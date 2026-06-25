"use client";

import { useEffect, useState } from "react";
import { UserPlus, Flame, Crown, CalendarCheck } from "lucide-react";

export type FeedItem = {
  id: string;
  name: string;
  /** ISO date string (YYYY-MM-DD or full ISO). */
  date: string;
  type: "join" | "meetup" | "host" | "mvp";
};

const NEUTRAL = "bg-md-surface-container-high text-md-on-surface-variant";

const META: Record<
  FeedItem["type"],
  { icon: typeof Flame; verb: string; tint: string }
> = {
  join: {
    icon: UserPlus,
    verb: "님이 새로 합류했어요",
    tint: NEUTRAL,
  },
  meetup: {
    icon: CalendarCheck,
    verb: "님이 벙에 참여했어요",
    tint: NEUTRAL,
  },
  host: {
    icon: Flame,
    verb: "님이 벙을 열었어요",
    tint: NEUTRAL,
  },
  mvp: {
    icon: Crown,
    verb: "님이 이달의 MVP에 올랐어요",
    tint: "bg-spicy-container text-spicy-on-container",
  },
};

function relativeTime(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffMs = now - t;
  const day = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor(diffMs / day);

  if (diffDays <= 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) {
      const diffMin = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return diffMin < 60 ? `${diffMin}분 전` : "방금";
    }
    return `${diffHours}시간 전`;
  }
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
  }).format(t);
}

export default function LiveActivityFeed({ items }: { items: FeedItem[] }) {
  // Render relative times only after mount to avoid SSR/CSR mismatch.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-md-surface-container-low">
        <p className="type-body-medium text-md-on-surface-variant">
          아직 활동 기록이 없어요
        </p>
      </div>
    );
  }

  return (
    <ul className="-mx-2">
      {items.map((item, idx) => {
        const meta = META[item.type];
        const Icon = meta.icon;
        return (
          <li
            key={item.id}
            className="feed-item group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-md-surface-container"
            style={{ animationDelay: `${Math.min(idx, 10) * 55}ms` }}
          >
            <span
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${meta.tint}`}
            >
              <Icon className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="type-body-medium leading-snug text-md-on-surface">
                <span className="font-semibold">{item.name}</span>
                <span className="text-md-on-surface-variant">{meta.verb}</span>
              </p>
            </div>

            <span className="type-label-small flex-shrink-0 tabular-nums text-md-on-surface-variant">
              {now === null ? "" : relativeTime(item.date, now)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
