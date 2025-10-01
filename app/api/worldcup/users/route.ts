import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

// 모든 사용자 목록 조회
export async function GET() {
  try {
    const users = await sql`
      SELECT id, name, profile_image, gender
      FROM users
      ORDER BY name ASC
    `;

    return NextResponse.json({ users });
  } catch (error) {
    console.error("사용자 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "사용자 목록 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
