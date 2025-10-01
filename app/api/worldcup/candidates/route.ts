import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

// 성별에 맞는 후보자 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userGender = searchParams.get("userGender");
    const userId = searchParams.get("userId");

    if (!userGender || !["남", "여", "기타"].includes(userGender)) {
      return NextResponse.json(
        { error: "유효한 성별을 제공해주세요." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);
    let candidates;

    // 성별에 따라 후보자 필터링 (본인 제외)
    if (userGender === "남") {
      // 남자는 여자만 볼 수 있음
      candidates = await sql`
        SELECT id, name, profile_image, gender
        FROM users
        WHERE gender = '여'
          AND profile_image IS NOT NULL
          AND profile_image != ''
          AND id != ${userIdNum}
      `;
    } else if (userGender === "여") {
      // 여자는 남자만 볼 수 있음
      candidates = await sql`
        SELECT id, name, profile_image, gender
        FROM users
        WHERE gender = '남'
          AND profile_image IS NOT NULL
          AND profile_image != ''
          AND id != ${userIdNum}
      `;
    } else {
      // 기타는 남자와 여자 모두 볼 수 있음
      candidates = await sql`
        SELECT id, name, profile_image, gender
        FROM users
        WHERE gender IN ('남', '여')
          AND profile_image IS NOT NULL
          AND profile_image != ''
          AND id != ${userIdNum}
      `;
    }

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("후보자 조회 오류:", error);
    return NextResponse.json(
      { error: "후보자 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
