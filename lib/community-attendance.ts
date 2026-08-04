import type { NeonQueryPromise } from "@neondatabase/serverless";
import { sql } from "@/lib/db";

/**
 * 소모임 일정은 날짜가 지나면 소모임 쪽에서 사라진다.
 * 그래서 참여 예정으로 등록된 멤버는 "일정 날짜가 된 시점"에 출석으로 확정하고
 * users 카운터(벙 횟수·벙주 횟수·마지막 모임일)에 한 번만 반영한다.
 * 이 확정 작업을 정산(settlement)이라고 부르고, settled_at 으로 중복을 막는다.
 *
 * 정산 기준 날짜는 한국 시간이다.
 */

/** 트랜잭션으로 묶어 실행할 쿼리 */
export type Statement = NeonQueryPromise<false, false>;

export type CommunityStats = {
  member_count: number;
  participant_count: number;
  attendance_count: number;
  organizer_count: number;
  managed_event_count: number;
};

let schemaReady: Promise<void> | null = null;

/** 프로세스당 한 번만 실행 (요청마다 DDL을 던지지 않도록) */
export function ensureParticipantSchema() {
  if (!schemaReady) {
    schemaReady = createSchema().catch((error) => {
      schemaReady = null; // 실패하면 다음 요청에서 다시 시도
      throw error;
    });
  }
  return schemaReady;
}

async function createSchema() {
  // settled_at 이 없던 시절의 DB인지 먼저 확인한다(아래 백필 판단용).
  const legacyRows = (await sql`
    SELECT NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'community_event_participants'
        AND column_name = 'settled_at'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'community_event_participants'
    ) AS needs_backfill
  `) as { needs_backfill: boolean }[];

  await sql`
    CREATE TABLE IF NOT EXISTS community_event_participants (
      event_id TEXT NOT NULL,
      event_title TEXT NOT NULL,
      event_date DATE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      user_image_url TEXT,
      is_organizer BOOLEAN NOT NULL DEFAULT FALSE,
      attended BOOLEAN NOT NULL DEFAULT FALSE,
      settled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (event_id, user_id)
    )
  `;
  await sql`
    ALTER TABLE community_event_participants
      ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_community_participants_event_date
      ON community_event_participants (event_date DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_community_participants_user_id
      ON community_event_participants (user_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_community_participants_unsettled
      ON community_event_participants (event_date)
      WHERE settled_at IS NULL
  `;

  // settled_at 도입 이전에 출석 체크된 기록은 이미 users 카운터에 반영돼 있다.
  // 정산 완료로 표시해 두지 않으면 아래 정산에서 한 번 더 더해진다.
  if (legacyRows[0]?.needs_backfill) {
    await sql`
      UPDATE community_event_participants
      SET settled_at = COALESCE(updated_at, created_at, NOW())
      WHERE settled_at IS NULL AND attended
    `;
  }
}

/**
 * 일정 날짜가 된(지난) 참여 예정 기록을 출석으로 확정하고 users 카운터에 반영한다.
 * settled_at 이 비어 있는 행만 대상이라 몇 번을 호출해도 결과가 같다.
 */
export async function settleDueParticipants() {
  await ensureParticipantSchema();

  const pendingRows = (await sql`
    SELECT COUNT(*)::INTEGER AS count
    FROM community_event_participants
    WHERE settled_at IS NULL
      AND event_date <= (NOW() AT TIME ZONE 'Asia/Seoul')::date
  `) as { count: number }[];

  const pending = pendingRows[0]?.count ?? 0;
  if (pending === 0) return { settled: 0 };

  await sql.transaction([
    // 동시에 들어온 요청이 같은 기록을 두 번 정산하지 못하게 잠근다(커밋 시 해제).
    sql`SELECT pg_advisory_xact_lock(41260401)`,
    sql`
      WITH due AS (
        SELECT
          user_id,
          COUNT(*)::INTEGER AS meetup_delta,
          COUNT(*) FILTER (WHERE is_organizer)::INTEGER AS organizer_delta,
          MAX(event_date) AS latest_date
        FROM community_event_participants
        WHERE settled_at IS NULL
          AND event_date <= (NOW() AT TIME ZONE 'Asia/Seoul')::date
        GROUP BY user_id
      )
      UPDATE users u
      SET
        meetup_count = COALESCE(u.meetup_count, 0) + due.meetup_delta,
        total_meetup_count = COALESCE(u.total_meetup_count, 0) + due.meetup_delta,
        meetup_make_count = COALESCE(u.meetup_make_count, 0) + due.organizer_delta,
        last_meetup_date = CASE
          WHEN u.last_meetup_date IS NULL OR u.last_meetup_date < due.latest_date
            THEN due.latest_date
          ELSE u.last_meetup_date
        END
      FROM due
      WHERE u.id = due.user_id
    `,
    sql`
      UPDATE community_event_participants
      SET attended = TRUE, settled_at = NOW(), updated_at = NOW()
      WHERE settled_at IS NULL
        AND event_date <= (NOW() AT TIME ZONE 'Asia/Seoul')::date
    `,
  ]);

  return { settled: pending };
}

export async function getCommunityStats() {
  const rows = (await sql`
    SELECT
      (SELECT COUNT(*)::INTEGER FROM users) AS member_count,
      COUNT(*) FILTER (WHERE event_date >= CURRENT_DATE)::INTEGER
        AS participant_count,
      COUNT(*) FILTER (WHERE attended AND settled_at IS NOT NULL)::INTEGER
        AS attendance_count,
      COUNT(*) FILTER (WHERE is_organizer)::INTEGER AS organizer_count,
      COUNT(DISTINCT event_id)::INTEGER AS managed_event_count
    FROM community_event_participants
  `) as CommunityStats[];

  return (
    rows[0] ?? {
      member_count: 0,
      participant_count: 0,
      attendance_count: 0,
      organizer_count: 0,
      managed_event_count: 0,
    }
  );
}

export async function getEventParticipants(eventId?: string) {
  if (eventId) {
    return sql`
      SELECT
        event_id,
        event_title,
        event_date,
        user_id,
        user_name,
        user_image_url,
        is_organizer,
        attended,
        settled_at,
        created_at,
        updated_at
      FROM community_event_participants
      WHERE event_id = ${eventId}
      ORDER BY is_organizer DESC, attended DESC, user_name ASC
    `;
  }

  return sql`
    SELECT
      event_id,
      event_title,
      event_date,
      user_id,
      user_name,
      user_image_url,
      is_organizer,
      attended,
      settled_at,
      created_at,
      updated_at
    FROM community_event_participants
    ORDER BY event_date DESC, is_organizer DESC, user_name ASC
  `;
}
