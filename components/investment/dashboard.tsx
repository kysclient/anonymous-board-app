"use client";

import { useEffect, useState } from "react";
import { MarketTicker } from "./market-ticker";
import { WatchlistSidebar } from "./watchlist-sidebar";
import { ChartHero } from "./chart-hero";
import { OrderBookCompact } from "./orderbook-compact";
import { TechnicalCards } from "./technical-cards";
import { RecommendationGrid } from "./recommendation-grid";
import { NewsGrid } from "./news-grid";

const DEFAULT_TICKER = "005930";

export function InvestmentDashboard() {
  const [selectedTicker, setSelectedTicker] = useState<string>(DEFAULT_TICKER);
  const [selectedName, setSelectedName] = useState<string>("삼성전자");
  // 추천 갱신 트리거 (워치리스트 사이드바도 같이 새로고침)
  const [recRefreshKey, setRecRefreshKey] = useState(0);

  // 5분마다 추천 자동 갱신 (워치리스트도 새 추천 종목 자동 편입됨)
  useEffect(() => {
    const t = setInterval(() => {
      fetch("/api/investment/recommendations?topN=10", { cache: "no-store" })
        .then(() => setRecRefreshKey((k) => k + 1))
        .catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <MarketTicker />

      <section className="mt-4 grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)_320px] gap-4">
        <WatchlistSidebar
          key={`wl-${recRefreshKey}`}
          selectedTicker={selectedTicker}
          onSelect={(t, n) => {
            setSelectedTicker(t);
            setSelectedName(n);
          }}
        />
        <ChartHero ticker={selectedTicker} name={selectedName} />
        <OrderBookCompact ticker={selectedTicker} />
      </section>

      <section className="mt-6">
        <SectionTitle
          title="기술적 분석"
          subtitle={`${selectedName} · 5종 지표 종합`}
        />
        <TechnicalCards ticker={selectedTicker} />
      </section>

      <section className="mt-6">
        <SectionTitle
          title="오늘의 추천 종목"
          subtitle="기술적 분석 · 5분마다 자동 갱신"
        />
        <RecommendationGrid
          refreshKey={recRefreshKey}
          onSelectTicker={(t, n) => {
            setSelectedTicker(t);
            setSelectedName(n || t);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          selectedTicker={selectedTicker}
          onRefresh={() => setRecRefreshKey((k) => k + 1)}
        />
      </section>

      <section className="mt-6 mb-12">
        <SectionTitle
          title={`${selectedName} 관련 뉴스`}
          subtitle="네이버 뉴스 검색 · 최신순"
        />
        <NewsGrid query={selectedName} />
      </section>
    </main>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
