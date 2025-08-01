'use server';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { join } from 'path';
import { tmpdir } from 'os';

export const dynamic = 'force-dynamic'; // Vercel 배포 시 동적 렌더링 강제

interface ChatAnalysis {
  userMessages: { user: string; count: number }[];
  totalMessages: number;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const startDateRaw = formData.get('startDate') as string | null;
    const endDateRaw = formData.get('endDate') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 파일 크기 제한 (100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 100MB limit' }, { status: 400 });
    }

    // 날짜 유효성 검사
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startDateRaw) {
      startDate = new Date(startDateRaw);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ error: 'Invalid startDate format' }, { status: 400 });
      }
    }

    if (endDateRaw) {
      endDate = new Date(endDateRaw);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid endDate format' }, { status: 400 });
      }
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json({ error: 'startDate cannot be after endDate' }, { status: 400 });
    }

    // 임시 파일 경로 생성
    const tempFileName = `kakao-chat-${Date.now()}-${file.name}`;
    const tempPath = join(tmpdir(), tempFileName);

    // 파일을 임시 디렉토리에 저장
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await writeFile(tempPath, uint8Array);

    // 사용자별 메시지 수 집계
    const userMessages = new Map<string, number>();

    // 스트리밍 방식으로 파일 읽기
    const fileStream = createReadStream(tempPath, { encoding: 'utf-8' });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      // CSV 형식 파싱: 2025-08-01 16:35:12,"김은서/98/성수","허거덩"
      if (!line.trim()) continue; // 빈 줄 무시

      // 쉼표로 분리, 따옴표로 묶인 필드 처리
      const fields = line.match(/(?:"[^"]*"|[^,]+)(?=\s*,|\s*$)/g)?.map(field =>
        field.replace(/^"|"$/g, '').trim()
      );

      if (!fields || fields.length < 3) {
        console.warn(`Invalid line format: ${line}`);
        continue;
      }

      const [timestampRaw, userInfo] = fields; // 타임스탬프, 사용자 정보

      // 타임스탬프 파싱
      const timestamp = new Date(timestampRaw);
      if (isNaN(timestamp.getTime())) {
        console.warn(`Invalid timestamp: ${timestampRaw}`);
        continue;
      }

      // 날짜 범위 필터링
      if (startDate && timestamp < startDate) continue;
      if (endDate && timestamp > endDate) continue;

      const user = userInfo.split('/')[0]; // 첫 번째 토큰: "김은서"

      if (user) {
        userMessages.set(user, (userMessages.get(user) || 0) + 1);
      }
    }

    // 결과 데이터 생성
    const result: ChatAnalysis = {
      userMessages: Array.from(userMessages.entries()).map(([user, count]) => ({
        user,
        count,
      })),
      totalMessages: Array.from(userMessages.values()).reduce((sum, count) => sum + count, 0),
    };

    // 임시 파일 삭제
    await unlink(tempPath);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  runtime: 'nodejs' // 필수
}
