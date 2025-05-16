import { neon } from "@neondatabase/serverless"
import { headers } from "next/headers"

// 데이터베이스 연결 설정
export const sql = neon(process.env.DATABASE_URL!)

// 클라이언트 IP 주소 가져오기
export function getClientIp(): string {
  const headersList = headers()

  // X-Forwarded-For 헤더에서 IP 주소 가져오기 (프록시 서버 뒤에 있을 경우)
  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  // 직접 연결된 클라이언트의 IP 주소
  const remoteAddr = headersList.get("x-real-ip") || "익명"
  return remoteAddr
}
