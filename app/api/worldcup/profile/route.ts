import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { put } from "@vercel/blob";
import { getClientIp } from "@/lib/db";

export const runtime = "nodejs";

// 현재 사용자 정보 조회 (IP 기반)
export async function GET(request: NextRequest) {
  try {
    const clientIp = await getClientIp();

    // IP로 사용자 찾기
    const result = await sql`
      SELECT id, name, profile_image, gender
      FROM users
      WHERE last_ip = ${clientIp}
      ORDER BY id DESC
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error("프로필 조회 오류:", error);
    return NextResponse.json(
      { error: "프로필 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 프로필 업데이트 (이미지 + 성별)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const gender = formData.get("gender") as string;
    const imageFile = formData.get("image") as File | null;

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (!gender || !["남", "여", "기타"].includes(gender)) {
      return NextResponse.json(
        { error: "유효한 성별을 선택해주세요." },
        { status: 400 }
      );
    }

    // userId로 사용자 확인
    const userResult = await sql`
      SELECT id, name
      FROM users
      WHERE id = ${parseInt(userId)}
    `;

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const user = userResult[0];
    let profileImageUrl = null;

    // 이미지가 있으면 업로드
    if (imageFile) {
      const blob = await put(`worldcup/${user.id}-${Date.now()}.${imageFile.name.split('.').pop()}`, imageFile, {
        access: "public",
      });
      profileImageUrl = blob.url;
    }

    // 데이터베이스 업데이트
    if (profileImageUrl) {
      await sql`
        UPDATE users
        SET gender = ${gender}::gender_type,
            profile_image = ${profileImageUrl}
        WHERE id = ${user.id}
      `;
    } else {
      await sql`
        UPDATE users
        SET gender = ${gender}::gender_type
        WHERE id = ${user.id}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "프로필이 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("프로필 업데이트 오류:", error);
    return NextResponse.json(
      { error: "프로필 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }
}
