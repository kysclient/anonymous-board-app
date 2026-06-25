import Image from "next/image";
import { Users } from "lucide-react";

interface Master {
  id: number;
  name: string;
  src: string | null;
  /** Soft tonal hue used for ring + initial fallback. */
  hue: "blue" | "purple" | "amber" | "rose" | "teal" | "indigo" | "green";
}

const MASTERS: Master[] = [
  { id: 1, name: "이휘원", src: "/masters/1.png", hue: "blue" },
  { id: 2, name: "최이윤", src: "/masters/2.png", hue: "purple" },
  { id: 3, name: "박성준", src: "/masters/3.png", hue: "amber" },
  { id: 4, name: "박수빈", src: "/masters/4.png", hue: "rose" },
  { id: 5, name: "안치현", src: "/masters/5.png", hue: "teal" },
  { id: 6, name: "김우경", src: null, hue: "indigo" },
  { id: 7, name: "이진우", src: null, hue: "green" },
];

const HUE: Record<Master["hue"], { ring: string; gradient: string }> = {
  blue: {
    ring: "ring-blue-200/70 dark:ring-blue-400/30",
    gradient: "from-blue-200 via-blue-100 to-sky-100",
  },
  purple: {
    ring: "ring-violet-200/70 dark:ring-violet-400/30",
    gradient: "from-violet-200 via-purple-100 to-pink-100",
  },
  amber: {
    ring: "ring-amber-200/70 dark:ring-amber-400/30",
    gradient: "from-amber-200 via-orange-100 to-yellow-100",
  },
  rose: {
    ring: "ring-rose-200/70 dark:ring-rose-400/30",
    gradient: "from-rose-200 via-pink-100 to-red-100",
  },
  teal: {
    ring: "ring-teal-200/70 dark:ring-teal-400/30",
    gradient: "from-teal-200 via-emerald-100 to-cyan-100",
  },
  indigo: {
    ring: "ring-indigo-200/70 dark:ring-indigo-400/30",
    gradient: "from-indigo-200 via-blue-100 to-violet-100",
  },
  green: {
    ring: "ring-emerald-200/70 dark:ring-emerald-400/30",
    gradient: "from-emerald-200 via-green-100 to-teal-100",
  },
};

export default function MastersStrip() {
  return (
    <section className="hq-panel p-5 sm:p-6">
      {/* Minimal section header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="type-label-small uppercase tracking-wide text-spicy">
            Team
          </p>
          <h2 className="type-title-large text-md-on-surface">운영진</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-md-outline-variant px-3 py-1 type-label-small text-md-on-surface-variant">
          <Users className="h-3.5 w-3.5" />
          {MASTERS.length}명
        </span>
      </div>

      {/* People grid */}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7 sm:gap-4">
        {MASTERS.map((master, i) => (
          <MasterTile key={master.id} master={master} index={i} />
        ))}
      </div>
    </section>
  );
}

function MasterTile({ master, index }: { master: Master; index: number }) {
  const palette = HUE[master.hue];
  const initial = master.name.charAt(0);

  return (
    <div
      className="group relative flex flex-col items-center gap-3 rounded-3xl p-3 transition-colors hover:bg-md-surface-container animate-m3-fade-in"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative">
        {/* Soft ambient halo on hover */}
        <div
          className={`absolute -inset-1.5 rounded-full bg-gradient-to-br ${palette.gradient} opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-90`}
        />

        {/* Avatar */}
        <div
          className={`relative h-16 w-16 overflow-hidden rounded-full bg-md-surface-container-highest ring-4 ${palette.ring} transition-transform duration-300 group-hover:scale-[1.04] sm:h-[72px] sm:w-[72px]`}
        >
          {master.src ? (
            <Image
              src={master.src}
              alt={master.name}
              fill
              sizes="(max-width: 640px) 80px, 96px"
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${palette.gradient}`}
            >
              <span className="type-headline-medium text-md-on-surface">
                {initial}
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="type-title-small truncate text-center text-md-on-surface">
        {master.name}
      </p>
    </div>
  );
}
