import { neon } from "@neondatabase/serverless";
import { headers } from "next/headers";

// 데이터베이스 연결 설정
export const sql = neon(process.env.DATABASE_URL!);

// 클라이언트 IP 주소 가져오기 (개선된 버전)
export function getClientIp(): string {
  try {
    const headersList = headers();

    // 다양한 헤더에서 IP 주소 확인 (우선순위 순)
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }

    const realIp = headersList.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }

    const vercelIp = headersList.get("x-vercel-ip");
    if (vercelIp) {
      return vercelIp.trim();
    }

    const vercelForwardedFor = headersList.get("x-vercel-forwarded-for");
    if (vercelForwardedFor) {
      return vercelForwardedFor.split(",")[0].trim();
    }

    // 모든 헤더 정보 확인 (디버깅용)
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });

    // 헤더에서 IP를 찾을 수 없는 경우 "Unknown IP"와 일부 헤더 정보 반환
    return `Unknown IP (Headers: ${JSON.stringify(allHeaders).substring(
      0,
      100
    )}...)`;
  } catch (error) {
    console.error("IP 주소 가져오기 오류:", error);
    return "Error getting IP";
  }
}
