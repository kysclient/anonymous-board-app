import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

// 특정 사용자 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "유효하지 않은 사용자 ID입니다." },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT id, name, profile_image, gender
      FROM users
      WHERE id = ${userId}
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error("사용자 조회 오류:", error);
    return NextResponse.json(
      { error: "사용자 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
