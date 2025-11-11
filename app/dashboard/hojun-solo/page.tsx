import type { Metadata } from "next";

import { fetchHojunSoloWishes } from "@/lib/hojun-solo";
import { HojunSoloClient } from "./solo-client";

export const metadata: Metadata = {
  title: "이호준 솔로기원 운동",
  description: "이호준 솔로기원을 위한 메시지를 남기고 마음을 모아주세요.",
};

export default async function HojunSoloPage() {
  const wishes = await fetchHojunSoloWishes(180);

  return <HojunSoloClient initialWishes={wishes} />;
}
