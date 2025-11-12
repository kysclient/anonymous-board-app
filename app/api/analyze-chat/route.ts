import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic"; // Vercel 배포 시 동적 렌더링 강제

interface ChatAnalysis {
  userMessages: { user: string; count: number }[];
  totalMessages: number;
  analysisTable: UserConversationSummary[];
  targetUserSummary: TargetUserSummary | null;
  sessionId: string;
}

interface WordCount {
  word: string;
  count: number;
}

interface ConversationMessage {
  timestamp: string;
  text: string;
}

interface UserConversationSummary {
  name: string;
  totalMessages: number;
  topWords: WordCount[];
  sampleMessages: ConversationMessage[];
}

interface TargetUserSummary {
  name: string;
  totalMessages: number;
  topWords: WordCount[];
  chronologicalMessages: ConversationMessage[];
}

interface UserAggregate {
  messages: ConversationMessage[];
  wordCounts: Map<string, number>;
}

type SqlClient = typeof sql;

interface PersistChatAnalysisParams {
  sessionId: string;
  startDate: Date | null;
  endDate: Date | null;
  targetUser: string;
  stopWords: string[];
  analysisTable: UserConversationSummary[];
  userAggregates: Map<string, UserAggregate>;
}

export async function POST(req: NextRequest) {
  let tempPath: string | null = null;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const startDateRaw = formData.get("startDate") as string | null;
    const endDateRaw = formData.get("endDate") as string | null;
    const targetUserRaw = formData.get("targetUser");
    const stopWordsRaw = formData.get("stopWords");
    const targetUser =
      typeof targetUserRaw === "string" && targetUserRaw.trim().length > 0
        ? targetUserRaw.trim()
        : "이호준";
    const stopWords = buildStopWordSet(stopWordsRaw);
    const stopWordsList = Array.from(stopWords).sort();

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 파일 크기 제한 (100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    // 날짜 유효성 검사
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startDateRaw) {
      startDate = new Date(startDateRaw);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid startDate format" },
          { status: 400 }
        );
      }
    }

    if (endDateRaw) {
      endDate = new Date(endDateRaw);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid endDate format" },
          { status: 400 }
        );
      }
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "startDate cannot be after endDate" },
        { status: 400 }
      );
    }

    // 임시 파일 경로 생성
    const tempFileName = `kakao-chat-${Date.now()}-${file.name}`;
    tempPath = join(tmpdir(), tempFileName);

    // 파일을 임시 디렉토리에 저장
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await writeFile(tempPath, uint8Array);

    // 사용자별 메시지 및 단어 빈도 집계
    const userAggregates = new Map<string, UserAggregate>();

    // 스트리밍 방식으로 파일 읽기
    const fileStream = createReadStream(tempPath, { encoding: "utf-8" });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue; // 빈 줄 무시

      let fields: string[];

      // 탭 구분 또는 CSV 구분 자동 감지
      if (line.includes('\t')) {
        fields = line.split('\t');
      } else {
        // CSV 형식: 쉼표로 분리, 따옴표로 묶인 필드 처리
        const matches = line.match(/(?:"[^"]*"|[^,]+)(?=\s*,|\s*$)/g);
        fields = matches ? matches.map((field) => field.replace(/^"|"$/g, "").trim()) : [];
      }

      if (fields.length < 2) {
        console.warn(`Invalid line format: ${line}`);
        continue;
      }

      const [timestampRaw, userInfo, ...messageParts] = fields; // 타임스탬프, 사용자 정보, 메시지
      const message = messageParts.join(" ").trim();

      // 타임스탬프 파싱
      const timestamp = new Date(timestampRaw);
      if (isNaN(timestamp.getTime())) {
        console.warn(`Invalid timestamp: ${timestampRaw}`);
        continue;
      }

      // 날짜 범위 필터링
      if (startDate && timestamp < startDate) continue;
      if (endDate && timestamp > endDate) continue;

      const user = userInfo.split("/")[0]; // 첫 번째 토큰: "김은서"

      if (user) {
        let aggregate = userAggregates.get(user);
        if (!aggregate) {
          aggregate = { messages: [], wordCounts: new Map() };
          userAggregates.set(user, aggregate);
        }

        aggregate.messages.push({
          timestamp: timestamp.toISOString(),
          text: message,
        });

        if (message) {
          updateWordCounts(message, aggregate.wordCounts, stopWords);
        }
      }
    }

    const analysisTable: UserConversationSummary[] = Array.from(
      userAggregates.entries()
    )
      .map(([name, aggregate]) => {
        const topWords = calculateTopWords(aggregate.wordCounts, 10);
        const sampleMessages = aggregate.messages.slice(-5);
        return {
          name,
          totalMessages: aggregate.messages.length,
          topWords,
          sampleMessages,
        };
      })
      .sort((a, b) => b.totalMessages - a.totalMessages);

    const sessionId = randomUUID();

    await persistChatAnalysis({
      sessionId,
      startDate,
      endDate,
      targetUser,
      stopWords: stopWordsList,
      analysisTable,
      userAggregates,
    });

    // 결과 데이터 생성
    const result: ChatAnalysis = {
      userMessages: analysisTable.map(({ name, totalMessages }) => ({
        user: name,
        count: totalMessages,
      })),
      totalMessages: analysisTable.reduce(
        (sum, entry) => sum + entry.totalMessages,
        0
      ),
      analysisTable,
      targetUserSummary: buildTargetUserSummary(
        targetUser,
        userAggregates,
        analysisTable
      ),
      sessionId,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (tempPath) {
      try {
        await unlink(tempPath);
      } catch (cleanupError) {
        console.error("Failed to remove temp file:", cleanupError);
      }
    }
  }
}

function updateWordCounts(
  message: string,
  wordCounts: Map<string, number>,
  stopWords: Set<string>
) {
  const tokens = message
    .split(/\s+/)
    .map((token) =>
      token
        .replace(/[^0-9a-zA-Z가-힣]/g, "")
        .toLowerCase()
        .trim()
    )
    .filter((token) => token.length > 1 && !stopWords.has(token));

  for (const token of tokens) {
    wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
  }
}

function calculateTopWords(
  wordCounts: Map<string, number>,
  limit: number
): WordCount[] {
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

function buildTargetUserSummary(
  targetUser: string,
  userAggregates: Map<string, UserAggregate>,
  analysisTable: UserConversationSummary[]
): TargetUserSummary | null {
  const aggregate = userAggregates.get(targetUser);

  if (!aggregate) {
    return null;
  }

  const topWords = calculateTopWords(aggregate.wordCounts, 20);
  const chronologicalMessages = aggregate.messages;

  return {
    name: targetUser,
    totalMessages: aggregate.messages.length,
    topWords: topWords.length
      ? topWords
      : analysisTable.find((row) => row.name === targetUser)?.topWords ?? [],
    chronologicalMessages,
  };
}

async function persistChatAnalysis({
  sessionId,
  startDate,
  endDate,
  targetUser,
  stopWords,
  analysisTable,
  userAggregates,
}: PersistChatAnalysisParams) {
  const startDateValue = startDate ? startDate.toISOString().slice(0, 10) : null;
  const endDateValue = endDate ? endDate.toISOString().slice(0, 10) : null;

  await sql`DELETE FROM chat_analysis_sessions`;

  await sql.query(
    `
      INSERT INTO chat_analysis_sessions (id, start_date, end_date, target_user, stop_words)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [sessionId, startDateValue, endDateValue, targetUser, stopWords]
  );

  for (const summary of analysisTable) {
    const participantRows = (await sql.query(
      `
        INSERT INTO chat_participants (session_id, name, total_messages, top_words)
        VALUES ($1, $2, $3, $4::jsonb)
        RETURNING id
      `,
      [
        sessionId,
        summary.name,
        summary.totalMessages,
        JSON.stringify(summary.topWords),
      ]
    )) as { id: number }[];

    const participantId = participantRows[0]?.id;
    if (!participantId) continue;

    const aggregate = userAggregates.get(summary.name);
    if (!aggregate || aggregate.messages.length === 0) continue;

    await insertMessages(sql, participantId, aggregate.messages);
  }
}

async function insertMessages(
  client: SqlClient,
  participantId: number,
  messages: ConversationMessage[]
) {
  const CHUNK_SIZE = 500;

  for (let index = 0; index < messages.length; index += CHUNK_SIZE) {
    const chunk = messages.slice(index, index + CHUNK_SIZE);
    if (!chunk.length) {
      continue;
    }

    const values: string[] = [];
    const params: unknown[] = [];

    chunk.forEach((message, messageIndex) => {
      const baseIndex = messageIndex * 3;
      values.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`
      );
      params.push(
        participantId,
        new Date(message.timestamp),
        message.text || null
      );
    });

    const insertQuery = `
      INSERT INTO chat_messages (participant_id, message_timestamp, message)
      VALUES ${values.join(", ")}
    `;

    await client.query(insertQuery, params);
  }
}

function buildStopWordSet(stopWordsRaw: FormDataEntryValue | null): Set<string> {
  const defaults = [
    "그리고",
    "그냥",
    "근데",
    "그래서",
    "그런데",
    "하지만",
    "정말",
    "진짜",
    "오늘",
    "이번",
    "저는",
    "나는",
    "이건",
    "저건",
    "거",
    "그거",
    "이거",
    "저거",
    "the",
    "and",
    "are",
    "for",
    "you",
    "with",
    "that",
    "from",
    "have",
    "this",
    "사진",
    "이모티콘",
    "파일",
  ];

  if (typeof stopWordsRaw !== "string") {
    return new Set(defaults);
  }

  const custom = stopWordsRaw
    .split(/[\n,]/)
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);

  return new Set([...defaults, ...custom]);
}
