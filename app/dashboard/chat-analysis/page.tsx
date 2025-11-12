import { sql } from "@/lib/db";
import ChatAnalysisClient from "./chat-analysis-client";

export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  start_date: string | null;
  end_date: string | null;
  target_user: string | null;
  stop_words: unknown;
  created_at: Date | string;
}

interface ParticipantRow {
  id: number;
  name: string;
  total_messages: number;
  top_words: unknown;
}

export default async function ChatAnalysisDashboardPage() {
  const sessionRows = (await sql`
    SELECT id, start_date, end_date, target_user, stop_words, created_at
    FROM chat_analysis_sessions
    ORDER BY created_at DESC
    LIMIT 1
  `) as SessionRow[];

  if (sessionRows.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          채팅 분석 데이터가 없습니다.
        </h1>
        <p className="text-sm text-muted-foreground">
          /analyze 페이지에서 채팅 파일을 업로드하면 결과를 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  const session = sessionRows[0];
  const participants = (await sql`
    SELECT id, name, total_messages, top_words
    FROM chat_participants
    WHERE session_id = ${session.id}
    ORDER BY total_messages DESC, name ASC
  `) as ParticipantRow[];

  const parsedParticipants = participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    totalMessages: participant.total_messages,
    topWords: Array.isArray(participant.top_words)
      ? (participant.top_words as { word: string; count: number }[])
      : [],
  }));

  const stopWords =
    Array.isArray(session.stop_words) &&
    session.stop_words.every((word) => typeof word === "string")
      ? [...(session.stop_words as string[])].sort((a, b) =>
          a.localeCompare(b)
        )
      : [];

  return (
    <ChatAnalysisClient
      session={{
        id: session.id,
        startDate: session.start_date,
        endDate: session.end_date,
        targetUser: session.target_user ?? "이호준",
        stopWords,
        createdAt:
          session.created_at instanceof Date
            ? session.created_at.toISOString()
            : session.created_at,
      }}
      participants={parsedParticipants}
    />
  );
}
