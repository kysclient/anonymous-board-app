import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import {
  ensureParticipantSchema,
  getCommunityStats,
  getEventParticipants,
  settleDueParticipants,
  type Statement,
} from "@/lib/community-attendance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ParticipantRequest = {
  event?: {
    id?: string;
    title?: string;
    date?: string;
  };
  participantIds?: number[];
  attendedIds?: number[];
  organizerId?: number | null;
};

type ExistingParticipant = {
  user_id: number;
  attended: boolean;
  is_organizer: boolean;
  settled_at: string | null;
};

type LocalMember = {
  id: number;
  name: string;
  profile_image: string | null;
  is_regular: string;
};

export async function GET() {
  try {
    // 날짜가 지난 일정은 소모임에서 사라지므로, 피드를 열 때마다 먼저 정산한다.
    await settleDueParticipants();

    const [participants, members, stats] = await Promise.all([
      getEventParticipants(),
      sql`
        SELECT id, name, profile_image, is_regular
        FROM users
        ORDER BY is_regular DESC, name ASC
      `,
      getCommunityStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: { participants, members, stats },
    });
  } catch (error) {
    console.error("모임 참여 정보 조회 오류:", error);
    return NextResponse.json(
      { success: false, error: "모임 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_auth")?.value !== "true") {
    return NextResponse.json(
      { success: false, error: "관리자 인증이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as ParticipantRequest;
    const event = body.event;

    if (
      !event?.id?.trim() ||
      !event.title?.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(event.date ?? "")
    ) {
      return NextResponse.json(
        { success: false, error: "올바른 일정 정보가 필요합니다." },
        { status: 400 }
      );
    }

    const participantIds = normalizeIds(body.participantIds);
    const attendedIds = new Set(normalizeIds(body.attendedIds));
    const organizerId = normalizeId(body.organizerId);

    if (organizerId !== null && !participantIds.includes(organizerId)) {
      participantIds.push(organizerId);
    }
    for (const attendedId of attendedIds) {
      if (!participantIds.includes(attendedId)) participantIds.push(attendedId);
    }

    await ensureParticipantSchema();

    const eventId = event.id.trim();
    const eventTitle = event.title.trim().slice(0, 200);
    const eventDate = event.date!;

    const [dueResult, memberResult, existingResult] = await Promise.all([
      sql`
        SELECT CAST(${eventDate} AS DATE) <= (NOW() AT TIME ZONE 'Asia/Seoul')::date
          AS is_due
      `,
      participantIds.length
        ? sql.query(
            `
              SELECT id, name, profile_image, is_regular
              FROM users
              WHERE id = ANY($1::int[])
            `,
            [participantIds]
          )
        : Promise.resolve([]),
      sql`
        SELECT user_id, attended, is_organizer, settled_at
        FROM community_event_participants
        WHERE event_id = ${eventId}
      `,
    ]);

    const dueRows = dueResult as { is_due: boolean }[];
    const selectedMembers = memberResult as LocalMember[];
    const existing = existingResult as ExistingParticipant[];

    if (selectedMembers.length !== participantIds.length) {
      return NextResponse.json(
        { success: false, error: "존재하지 않는 멤버가 포함되어 있습니다." },
        { status: 400 }
      );
    }

    // 일정 날짜가 됐거나 지났으면 이 저장 시점에 바로 출석으로 확정한다.
    const isDue = Boolean(dueRows[0]?.is_due);
    const settledAt = isDue ? new Date().toISOString() : null;

    const existingByUser = new Map(existing.map((row) => [row.user_id, row]));
    const selectedSet = new Set(participantIds);

    const statements: Statement[] = [];
    const meetupDelta = new Map<number, number>();
    const organizerDelta = new Map<number, number>();

    // 참여 예정에서 빠진 멤버: 기록을 지우고, 이미 반영된 카운터는 되돌린다.
    for (const row of existing) {
      if (selectedSet.has(row.user_id)) continue;

      statements.push(sql`
        DELETE FROM community_event_participants
        WHERE event_id = ${eventId} AND user_id = ${row.user_id}
      `);
      addDelta(meetupDelta, row.user_id, -countedMeetup(row));
      addDelta(organizerDelta, row.user_id, -countedOrganizer(row));
    }

    for (const member of selectedMembers) {
      const previous = existingByUser.get(member.id);
      const wasSettled = Boolean(previous?.settled_at);
      const nextSettled = wasSettled || isDue;
      // 이번 저장으로 확정되는 기록은 참여 예정 = 출석으로 본다.
      // 이미 확정된 기록은 관리자가 출석을 다시 끄고 켤 수 있다(사후 정정).
      const nextAttended = nextSettled && !wasSettled
        ? true
        : attendedIds.has(member.id);
      const nextOrganizer = organizerId === member.id;

      addDelta(
        meetupDelta,
        member.id,
        (nextSettled && nextAttended ? 1 : 0) - countedMeetup(previous)
      );
      addDelta(
        organizerDelta,
        member.id,
        (nextSettled && nextOrganizer ? 1 : 0) - countedOrganizer(previous)
      );

      statements.push(sql`
        INSERT INTO community_event_participants (
          event_id,
          event_title,
          event_date,
          user_id,
          user_name,
          user_image_url,
          is_organizer,
          attended,
          settled_at
        )
        VALUES (
          ${eventId},
          ${eventTitle},
          CAST(${eventDate} AS DATE),
          ${member.id},
          ${member.name},
          ${member.profile_image},
          ${nextOrganizer},
          ${nextAttended},
          CAST(${settledAt} AS TIMESTAMPTZ)
        )
        ON CONFLICT (event_id, user_id) DO UPDATE SET
          event_title = EXCLUDED.event_title,
          event_date = EXCLUDED.event_date,
          user_name = EXCLUDED.user_name,
          user_image_url = EXCLUDED.user_image_url,
          is_organizer = EXCLUDED.is_organizer,
          attended = EXCLUDED.attended,
          settled_at = COALESCE(
            community_event_participants.settled_at,
            EXCLUDED.settled_at
          ),
          updated_at = NOW()
      `);
    }

    // 카운터 반영은 참여 기록 쓰기 뒤에 붙인다(마지막 모임일 재계산이 최종 상태를 봐야 함).
    for (const [userId, delta] of meetupDelta) {
      if (delta === 0) continue;

      statements.push(sql`
        UPDATE users
        SET
          meetup_count = GREATEST(COALESCE(meetup_count, 0) + ${delta}, 0),
          total_meetup_count =
            GREATEST(COALESCE(total_meetup_count, 0) + ${delta}, 0)
        WHERE id = ${userId}
      `);

      if (delta > 0) {
        statements.push(sql`
          UPDATE users
          SET last_meetup_date = CAST(${eventDate} AS DATE)
          WHERE id = ${userId}
            AND (
              last_meetup_date IS NULL
              OR last_meetup_date < CAST(${eventDate} AS DATE)
            )
        `);
      } else {
        // 출석이 취소됐으면 남아 있는 확정 기록 중 가장 늦은 날짜로 되돌린다.
        // 남은 기록이 없으면 이 시스템 도입 전의 값을 그대로 둔다.
        statements.push(sql`
          UPDATE users u
          SET last_meetup_date = COALESCE(
            (
              SELECT MAX(p.event_date)
              FROM community_event_participants p
              WHERE p.user_id = u.id
                AND p.settled_at IS NOT NULL
                AND p.attended
            ),
            u.last_meetup_date
          )
          WHERE u.id = ${userId}
            AND (
              u.last_meetup_date IS NULL
              OR u.last_meetup_date <= CAST(${eventDate} AS DATE)
            )
        `);
      }
    }

    for (const [userId, delta] of organizerDelta) {
      if (delta === 0) continue;

      statements.push(sql`
        UPDATE users
        SET meetup_make_count =
          GREATEST(COALESCE(meetup_make_count, 0) + ${delta}, 0)
        WHERE id = ${userId}
      `);
    }

    if (statements.length > 0) {
      await sql.transaction(statements);
    }

    const [participants, stats] = await Promise.all([
      getEventParticipants(eventId),
      getCommunityStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: { participants, stats, settled: isDue },
    });
  } catch (error) {
    console.error("모임 참여 정보 저장 오류:", error);
    return NextResponse.json(
      { success: false, error: "참여·출석 정보를 저장하지 못했습니다." },
      { status: 500 }
    );
  }
}

/** users 카운터에 이미 +1 로 반영된 기록인지 */
function countedMeetup(row?: ExistingParticipant) {
  return row && row.settled_at && row.attended ? 1 : 0;
}

function countedOrganizer(row?: ExistingParticipant) {
  return row && row.settled_at && row.is_organizer ? 1 : 0;
}

function addDelta(map: Map<number, number>, userId: number, amount: number) {
  if (amount === 0) return;
  map.set(userId, (map.get(userId) ?? 0) + amount);
}

function normalizeIds(ids: unknown) {
  if (!Array.isArray(ids)) return [];
  return Array.from(
    new Set(ids.map(normalizeId).filter((id): id is number => id !== null))
  ).slice(0, 500);
}

function normalizeId(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
