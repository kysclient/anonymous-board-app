"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
}

export function NewsGrid({ query }: { query: string }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `/api/investment/news?q=${encodeURIComponent(query)}&display=12`,
          { cache: "no-store" }
        );
        const j = await r.json();
        setItems(j.items || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [query]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] p-5 h-40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] p-10 text-center">
        <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          관련 뉴스가 없습니다 ("{query}")
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((n, i) => (
        <a
          key={i}
          href={n.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] p-5",
            "hover:border-[#3182f6]/40 hover:shadow-[0_6px_24px_rgba(49,130,246,0.10)] hover:-translate-y-0.5 transition-all"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded-md bg-[#f3f5f7] dark:bg-[#252a33]">
              <Newspaper className="h-2.5 w-2.5" />
              {n.source.toUpperCase()}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#3182f6] transition" />
          </div>

          <h3 className="text-sm font-bold leading-snug mb-2 line-clamp-2 group-hover:text-[#3182f6] transition">
            {n.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">
            {n.summary}
          </p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {new Date(n.publishedAt).toLocaleString("ko-KR", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
        </a>
      ))}
    </div>
  );
}
