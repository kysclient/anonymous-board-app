/**
 * 네이버 뉴스 검색 — 표시 전용 (LLM 분석 X)
 */

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "";

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string; // ISO
  source: string;
}

function stripHtml(s: string): string {
  return (s || "").replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

export async function searchNews(query: string, display = 10): Promise<NewsItem[]> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    return [];
  }
  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(display));
  url.searchParams.set("sort", "date");

  const r = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    },
    cache: "no-store",
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.items || []).map((it: any) => {
    let pub = new Date();
    try {
      pub = new Date(it.pubDate);
    } catch {}
    return {
      title: stripHtml(it.title),
      summary: stripHtml(it.description),
      url: it.link || it.originallink || "",
      publishedAt: pub.toISOString(),
      source: "naver",
    };
  });
}
