import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// Neon 클라이언트 초기화
const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token !== process.env.API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sql.transaction([
      sql`UPDATE users SET meetup_count = 0`,
      sql`UPDATE users SET meetup_make_count = 0`,
    ]);
    return NextResponse.json({ message: "Users table meetup_count reset successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error resetting Users table meetup_count:", error);
    return NextResponse.json({ error: "Failed to reset Users table meetup_count" }, { status: 500 });
  }
}