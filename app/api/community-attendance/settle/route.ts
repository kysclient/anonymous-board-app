import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { settleDueParticipants } from "@/lib/community-attendance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 일정 날짜가 된 참여 예정 기록을 출석으로 확정한다.
 * 피드를 열 때도 자동으로 돌지만, 아무도 접속하지 않아도 반영되도록 크론에서 매일 호출한다.
 */
export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json(
      { success: false, error: "인증이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const result = await settleDueParticipants();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("모임 출석 정산 오류:", error);
    return NextResponse.json(
      { success: false, error: "출석 정산에 실패했습니다." },
      { status: 500 }
    );
  }
}

export const POST = GET;

async function isAuthorized(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (process.env.API_SECRET && token === process.env.API_SECRET) return true;

  // Vercel 크론은 CRON_SECRET 이 설정돼 있으면 Bearer 헤더를 붙여 호출한다.
  const authorization = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authorization === `Bearer ${process.env.CRON_SECRET}`
  ) {
    return true;
  }

  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "true";
}
