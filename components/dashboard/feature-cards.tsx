import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ArtKind = "squares" | "radar" | "rects" | "waves";

interface Hue {
  /** dark base gradient stops */
  from: string;
  to: string;
  /** primary glow / accent */
  glow: string;
  line: string;
  dot: string;
}

const HUES: Record<string, Hue> = {
  blue: { from: "#0b1f3a", to: "#060d18", glow: "56,132,255", line: "150,190,255", dot: "120,180,255" },
  violet: { from: "#1b1538", to: "#0b0918", glow: "139,108,255", line: "190,170,255", dot: "176,150,255" },
  teal: { from: "#06281f", to: "#03130e", glow: "16,200,150", line: "120,235,200", dot: "80,230,180" },
  rose: { from: "#2a1020", to: "#130810", glow: "244,80,140", line: "255,170,200", dot: "255,140,180" },
};

interface CardDef {
  n: string;
  kind: string;
  href: string;
  title: string;
  desc: string;
  meta: string;
  tags: string[];
  art: ArtKind;
  hue: keyof typeof HUES;
}

const CARDS: CardDef[] = [
  {
    n: "01",
    kind: "SEATING",
    href: "/dashboard/seating",
    title: "자리 배치",
    desc: "무작위 배정으로 매번 새로운 만남을 설계합니다",
    meta: "실시간",
    tags: ["랜덤", "빠른 배정", "그룹"],
    art: "squares",
    hue: "blue",
  },
  {
    n: "02",
    kind: "STATS",
    href: "/dashboard/stats",
    title: "멤버 통계",
    desc: "참여 추이·활동 비율을 한눈에 읽습니다",
    meta: "분석",
    tags: ["차트", "인사이트", "추이"],
    art: "waves",
    hue: "violet",
  },
  {
    n: "03",
    kind: "GALLERY",
    href: "/dashboard/gallery",
    title: "갤러리",
    desc: "함께한 순간들이 차곡차곡 쌓입니다",
    meta: "모음",
    tags: ["사진", "추억"],
    art: "radar",
    hue: "teal",
  },
  {
    n: "04",
    kind: "SCHEDULE",
    href: "/dashboard/schedule",
    title: "모임 일정",
    desc: "다가오는 정모와 번개를 한 곳에서",
    meta: "예정",
    tags: ["캘린더", "정모", "번개"],
    art: "rects",
    hue: "rose",
  },
];

export default function FeatureCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {CARDS.map((c) => (
        <FeatureCard key={c.n} def={c} />
      ))}
    </section>
  );
}

function FeatureCard({ def }: { def: CardDef }) {
  const hue = HUES[def.hue];
  return (
    <Link
      href={def.href}
      className="feature-card group block overflow-hidden rounded-2xl border border-md-outline-variant/65 bg-md-surface-container-lowest"
    >
      {/* Art header */}
      <div
        className="relative h-44 overflow-hidden"
        style={{
          background: `radial-gradient(120% 120% at 75% 0%, ${hue.from} 0%, ${hue.to} 70%)`,
        }}
      >
        <div className="feature-art absolute inset-0">
          <Art kind={def.art} hue={hue} />
        </div>

        {/* Eyebrow */}
        <div className="absolute left-5 top-4 font-mono text-[11px] font-medium tracking-[0.18em] text-white/70">
          {def.n} <span className="mx-1 text-white/30">—</span> {def.kind}
        </div>

        {/* fade into body */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-md-on-surface">
            {def.title}
          </h3>
          <span className="shrink-0 font-mono text-[12px] text-md-on-surface-variant/70">
            {def.meta}
          </span>
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-md-on-surface-variant">
          {def.desc}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {def.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-md-outline-variant/70 px-2.5 py-1 font-mono text-[11px] text-md-on-surface-variant"
            >
              {t}
            </span>
          ))}
        </div>

        <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-spicy">
          자세히 보기
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

/* ── SVG generative art ─────────────────────────────────────── */

function Art({ kind, hue }: { kind: ArtKind; hue: Hue }) {
  switch (kind) {
    case "squares":
      return <SquaresArt hue={hue} />;
    case "radar":
      return <RadarArt hue={hue} />;
    case "rects":
      return <RectsArt hue={hue} />;
    case "waves":
      return <WavesArt hue={hue} />;
  }
}

function GridLines({ hue }: { hue: Hue }) {
  const id = `grid-${hue.line.replace(/[^0-9]/g, "")}`;
  return (
    <>
      <defs>
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M40 0H0V40"
            fill="none"
            stroke={`rgba(${hue.line},0.07)`}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="400" height="176" fill={`url(#${id})`} />
    </>
  );
}

function SquaresArt({ hue }: { hue: Hue }) {
  const cols = 7;
  const rows = 4;
  const size = 30;
  const gx = (400 - cols * size) / (cols + 1);
  const gy = (176 - rows * size) / (rows + 1);
  const cells: { x: number; y: number; on: boolean; i: number }[] = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = (c * 3 + r * 5) % 7 === 0 || (c === 4 && r === 0) || (c === 6 && r === 2);
      cells.push({ x: gx + c * (size + gx), y: gy + r * (size + gy), on, i: i++ });
    }
  }
  return (
    <svg viewBox="0 0 400 176" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <GridLines hue={hue} />
      {/* soft glow */}
      <circle cx="120" cy="60" r="120" fill={`rgba(${hue.glow},0.30)`} style={{ filter: "blur(40px)" }} />
      {cells.map((cell) =>
        cell.on ? (
          <rect
            key={cell.i}
            className="art-sq"
            x={cell.x}
            y={cell.y}
            width={size}
            height={size}
            rx="8"
            fill={`rgba(${hue.dot},0.9)`}
            style={{ animationDelay: `${(cell.i % 6) * 0.35}s`, filter: `drop-shadow(0 0 8px rgba(${hue.glow},0.7))` }}
          />
        ) : (
          <rect
            key={cell.i}
            x={cell.x}
            y={cell.y}
            width={size}
            height={size}
            rx="8"
            fill="none"
            stroke={`rgba(${hue.line},0.16)`}
            strokeWidth="1.2"
          />
        )
      )}
    </svg>
  );
}

function RadarArt({ hue }: { hue: Hue }) {
  const cx = 215;
  const cy = 84;
  return (
    <svg viewBox="0 0 400 176" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <GridLines hue={hue} />
      <circle cx={cx} cy={cy} r="120" fill={`rgba(${hue.glow},0.30)`} style={{ filter: "blur(36px)" }} />
      {[34, 64, 96, 130].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={`rgba(${hue.line},0.18)`} strokeWidth="1.2" />
      ))}
      {/* ping ring */}
      <circle cx={cx} cy={cy} r="40" fill="none" stroke={`rgba(${hue.dot},0.6)`} strokeWidth="1.5" className="art-ping" />
      {/* center */}
      <circle cx={cx} cy={cy} r="11" fill={`rgba(${hue.dot},1)`} style={{ filter: `drop-shadow(0 0 12px rgba(${hue.glow},0.9))` }} />
      {/* orbiting dots */}
      <circle className="art-float" cx={cx + 64} cy={cy - 6} r="5" fill={`rgba(${hue.dot},0.95)`} style={{ animationDelay: "0s" }} />
      <circle className="art-float" cx={cx - 96} cy={cy + 30} r="4" fill={`rgba(${hue.dot},0.8)`} style={{ animationDelay: "1.2s" }} />
      <circle className="art-float" cx={cx + 18} cy={cy + 78} r="3.5" fill={`rgba(${hue.dot},0.7)`} style={{ animationDelay: "2.1s" }} />
    </svg>
  );
}

function RectsArt({ hue }: { hue: Hue }) {
  return (
    <svg viewBox="0 0 400 176" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <GridLines hue={hue} />
      <circle cx="280" cy="120" r="110" fill={`rgba(${hue.glow},0.28)`} style={{ filter: "blur(40px)" }} />
      <g className="art-spin">
        <rect x="120" y="34" width="160" height="108" rx="16" fill="none" stroke={`rgba(${hue.line},0.35)`} strokeWidth="1.5" transform="rotate(-12 200 88)" />
        <rect x="140" y="48" width="120" height="80" rx="14" fill="none" stroke={`rgba(${hue.dot},0.55)`} strokeWidth="1.5" transform="rotate(8 200 88)" />
        <circle cx="140" cy="48" r="4" fill={`rgba(${hue.dot},1)`} style={{ filter: `drop-shadow(0 0 8px rgba(${hue.glow},0.9))` }} transform="rotate(8 200 88)" />
        <circle cx="280" cy="142" r="3.5" fill={`rgba(${hue.dot},0.9)`} transform="rotate(-12 200 88)" />
      </g>
    </svg>
  );
}

function WavesArt({ hue }: { hue: Hue }) {
  const rows = 7;
  return (
    <svg viewBox="0 0 400 176" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <GridLines hue={hue} />
      <circle cx="320" cy="30" r="120" fill={`rgba(${hue.glow},0.26)`} style={{ filter: "blur(42px)" }} />
      <g className="art-drift">
        {Array.from({ length: rows }).map((_, i) => {
          const y = 40 + i * 18;
          const amp = 10 + i * 1.5;
          const op = 0.5 - i * 0.045;
          return (
            <path
              key={i}
              d={`M-10 ${y} C 80 ${y - amp}, 140 ${y + amp}, 220 ${y} S 360 ${y - amp}, 420 ${y}`}
              fill="none"
              stroke={`rgba(${hue.line},${op.toFixed(2)})`}
              strokeWidth="1.5"
            />
          );
        })}
      </g>
    </svg>
  );
}
