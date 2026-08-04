import type { Metadata } from "next";
import { getAdminStatus } from "@/lib/actions";
import { CommunityFeed } from "./community-feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "모임 피드 · SPICY",
  description: "모임 일정과 출석 기록이 자동으로 모이는 소셜 피드",
};

export default async function CommunityPage() {
  const isAdmin = await getAdminStatus();
  return <CommunityFeed isAdmin={isAdmin} />;
}
