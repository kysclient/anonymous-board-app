import { sql } from "@/lib/db";

export type HojunSoloWish = {
  id: number;
  message: string;
  client_ip: string | null;
  created_at: string;
};

const DEFAULT_LIMIT = 120;
const MAX_LIMIT = 300;

function clampLimit(limit?: number | null) {
  if (!limit || Number.isNaN(limit) || limit <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_LIMIT);
}

export async function fetchHojunSoloWishes(limit?: number) {
  const safeLimit = clampLimit(limit);

  const rows = (await sql`
    SELECT id, message, client_ip, created_at
    FROM hojun_solo_wishes
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `) as unknown as HojunSoloWish[];

  return rows;
}

export async function createHojunSoloWish(
  message: string,
  clientIp?: string | null
) {
  const trimmed = message.trim();

  const rows = (await sql`
    INSERT INTO hojun_solo_wishes (message, client_ip)
    VALUES (${trimmed}, ${clientIp ?? null})
    RETURNING id, message, client_ip, created_at
  `) as unknown as HojunSoloWish[];

  return rows[0];
}
