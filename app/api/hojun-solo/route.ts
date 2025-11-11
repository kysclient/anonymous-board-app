import { NextResponse } from "next/server";

import {
  createHojunSoloWish,
  fetchHojunSoloWishes,
} from "@/lib/hojun-solo";

function getClientIpFromHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const vercelIp = headers.get("x-vercel-ip");
  if (vercelIp) {
    return vercelIp.trim();
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const wishes = await fetchHojunSoloWishes(limit);

    return NextResponse.json(
      {
        success: true,
        data: wishes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[HOJUN_SOLO][GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: "기원 메시지를 불러오는 중 문제가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch (error) {
      console.error("[HOJUN_SOLO][POST][PARSE]", error);
      body = null;
    }

    const message = (body as { message?: string } | null)?.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "남길 메시지를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    const trimmed = message.trim();

    if (!trimmed) {
      return NextResponse.json(
        {
          success: false,
          error: "남길 메시지를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    if (trimmed.length > 160) {
      return NextResponse.json(
        {
          success: false,
          error: "메시지는 160자 이내로 입력해주세요.",
        },
        { status: 400 }
      );
    }

    const clientIp = getClientIpFromHeaders(request.headers);

    const wish = await createHojunSoloWish(trimmed, clientIp);

    return NextResponse.json(
      {
        success: true,
        data: wish,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[HOJUN_SOLO][POST]", error);
    return NextResponse.json(
      {
        success: false,
        error: "기원 메시지를 남기는 중 문제가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
