import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CardDef {
  n: string;
  kind: string;
  href: string;
  title: string;
  desc: string;
  badge?: string;
  tags: string[];
}

const CARDS: CardDef[] = [
  {
    n: "01",
    kind: "SEATING",
    href: "/dashboard/seating",
    title: "자리 배치",
    desc: "무작위 배정으로 매번 새로운 만남을 설계합니다. 그룹·빠른 배정 모드를 지원합니다.",
    badge: "Latest",
    tags: ["랜덤", "빠른 배정", "그룹"],
  },
  {
    n: "02",
    kind: "STATS",
    href: "/dashboard/stats",
    title: "멤버 통계",
    desc: "참여 추이와 활동 비율을 한눈에 읽습니다. 월별 차트와 인사이트를 제공합니다.",
    tags: ["차트", "인사이트", "추이"],
  },
  {
    n: "03",
    kind: "GALLERY",
    href: "/dashboard/gallery",
    title: "갤러리",
    desc: "함께한 순간들이 차곡차곡 쌓입니다. 모임 사진을 업로드하고 둘러보세요.",
    tags: ["사진", "추억"],
  },
  {
    n: "04",
    kind: "LIVE LOUNGE",
    href: "/dashboard/smoking-room",
    title: "흡연실",
    desc: "길게 말하긴 귀찮을 때 한마디만 띄워두세요. 지금 있는 멤버들과 실시간으로 이어집니다.",
    badge: "Live",
    tags: ["실시간", "익명", "한마디"],
  },
];

export default function FeatureCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((c) => (
        <FeatureCard key={c.n} def={c} />
      ))}
    </section>
  );
}

function FeatureCard({ def }: { def: CardDef }) {
  return (
    <Link
      href={def.href}
      className="feature-card group flex flex-col rounded-2xl border border-md-outline-variant/55 bg-md-surface-container-lowest p-6 sm:p-7"
    >
      <div className="font-mono text-[11px] font-medium tracking-[0.16em] text-md-on-surface-variant/70">
        {def.n} <span className="mx-1 opacity-40">—</span> {def.kind}
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <h3 className="text-[20px] font-medium tracking-[-0.02em] text-md-on-surface">
          {def.title}
        </h3>
        {def.badge && <span className="xai-badge">{def.badge}</span>}
      </div>

      <p className="mt-2 text-[14px] leading-relaxed text-md-on-surface-variant">
        {def.desc}
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {def.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-md-outline-variant/70 px-2.5 py-1 text-[11.5px] text-md-on-surface-variant"
          >
            {t}
          </span>
        ))}
      </div>

      <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-md-on-surface">
        자세히 보기
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
