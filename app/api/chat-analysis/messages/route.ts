import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const participantIdRaw = searchParams.get("participantId");
  const sessionId = searchParams.get("sessionId");
  const participantName = searchParams.get("participant");

  if (!participantIdRaw && !(sessionId && participantName)) {
    return NextResponse.json(
      { error: "participantId or (sessionId and participant) is required" },
      { status: 400 }
    );
  }

  try {
    let messages:
      | {
          message_timestamp: string | Date;
          message: string | null;
        }[]
      | null = null;
    let resolvedParticipantName = participantName ?? null;

    if (participantIdRaw) {
      const participantId = Number(participantIdRaw);
      if (!Number.isFinite(participantId)) {
        return NextResponse.json(
          { error: "Invalid participantId" },
          { status: 400 }
        );
      }

      const rows = (await sql`
        SELECT cm.message_timestamp, cm.message, cp.name
        FROM chat_messages cm
        JOIN chat_participants cp ON cm.participant_id = cp.id
        WHERE cm.participant_id = ${participantId}
        ORDER BY cm.message_timestamp ASC
      `) as { message_timestamp: Date; message: string | null; name: string }[];

      messages = rows.map(({ message_timestamp, message }) => ({
        message_timestamp,
        message,
      }));
      resolvedParticipantName = rows[0]?.name ?? resolvedParticipantName;
    } else if (sessionId && participantName) {
      const rows = (await sql`
        SELECT cm.message_timestamp, cm.message
        FROM chat_messages cm
        JOIN chat_participants cp ON cm.participant_id = cp.id
        WHERE cp.session_id = ${sessionId} AND cp.name = ${participantName}
        ORDER BY cm.message_timestamp ASC
      `) as { message_timestamp: Date; message: string | null }[];
      messages = rows;
    }

    return NextResponse.json({
      participant: resolvedParticipantName,
      messages: (messages ?? []).map(({ message_timestamp, message }) => ({
        timestamp:
          message_timestamp instanceof Date
            ? message_timestamp.toISOString()
            : new Date(message_timestamp).toISOString(),
        text: message ?? "",
      })),
    });
  } catch (error) {
    console.error("Failed to load chat messages:", error);
    return NextResponse.json(
      { error: "Failed to load chat messages" },
      { status: 500 }
    );
  }
}
