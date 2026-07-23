import { NextResponse } from "next/server";
import { listOmokRooms } from "@/lib/omok/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rooms = await listOmokRooms();
    return NextResponse.json(
      { rooms },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json({ rooms: [] }, { status: 200 });
  }
}
