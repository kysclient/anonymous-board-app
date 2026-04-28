"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
}

export function NewsList({ query }: { query: string }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `/api/investment/news?q=${encodeURIComponent(query)}&display=8`,
          { cache: "no-store" }
        );
        const j = await r.json();
        setItems(j.items || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [query]);

  return (
    <div className="rounded-2xl bg-[#f7f8fa] dark:bg-[#1f232b] p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold">관련 뉴스</h4>
        <span className="text-[11px] text-muted-foreground">"{query}"</span>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : !items.length ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          관련 뉴스가 없습니다
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((n, i) => (
            <li key={i}>
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group hover:bg-white dark:hover:bg-[#2a2f38] rounded-lg p-2 -m-2 transition"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-[#3182f6] transition">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {n.summary}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                      {new Date(n.publishedAt).toLocaleString("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
