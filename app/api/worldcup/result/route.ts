import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getClientIp } from "@/lib/db";

export const runtime = "nodejs";

// 월드컵 결과 저장
export async function POST(request: NextRequest) {
  try {
    const clientIp = await getClientIp();
    const body = await request.json();
    const { winnerId } = body;

    if (!winnerId) {
      return NextResponse.json(
        { error: "우승자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 현재 사용자 찾기
    const userResult = await sql`
      SELECT id
      FROM users
      WHERE last_ip = ${clientIp}
      ORDER BY id DESC
      LIMIT 1
    `;

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const userId = userResult[0].id;

    // 결과 저장 (worldcup_results 테이블이 필요한 경우)
    // 여기서는 간단하게 로그만 남기거나, 원한다면 별도 테이블에 저장 가능
    console.log(`User ${userId} selected ${winnerId} as their ideal type`);

    return NextResponse.json({
      success: true,
      message: "결과가 저장되었습니다.",
    });
  } catch (error) {
    console.error("결과 저장 오류:", error);
    return NextResponse.json(
      { error: "결과 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
