import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RawEvent {
  eid: string;
  en: string;
  e_d: number;
  e_t: number;
  ee?: string;
  el?: string;
  emm?: number;
  enum?: number;
  imgUrl?: string;
  groupImgUrl?: string;
  gn?: string;
  loc1n?: string;
  loc2n?: string;
}

interface RawMember {
  mid: string;
  mn?: string;
  i_m?: string; // 운영진 여부 (Y/N)
  ban?: string; // 차단 여부 (Y/N)
  j_t?: number; // 가입 시각
}

/**
 * somoim 그룹 페이지는 events / members 데이터를 SSR flight JSON
 * ("events":[...], "members":[...]) 형태로 내려준다. escape된 문자열 안의
 * 괄호를 무시하면서 해당 배열의 끝을 찾아 파싱한다.
 */
function extractArray<T>(
  html: string,
  escapedKey: string,
  windowSize = 200000
): T[] {
  const keyIdx = html.indexOf(escapedKey);
  if (keyIdx === -1) return [];

  const start = html.indexOf("[", keyIdx);
  if (start === -1) return [];

  const slice = html
    .slice(start, start + windowSize)
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");

  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;

  for (let i = 0; i < slice.length; i++) {
    const c = slice[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') {
      inStr = true;
    } else if (c === "[") {
      depth++;
    } else if (c === "]") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end === -1) return [];

  try {
    return JSON.parse(slice.slice(0, end)) as T[];
  } catch {
    return [];
  }
}

/** 그룹 메타(멤버 수·소개·대표 이미지)는 groupInfoData 블록에 들어있다. */
function extractGroupInfo(html: string) {
  const seg = html.slice(html.indexOf('\\"gmc\\":'));
  const num = (k: string) => {
    const m = seg.match(new RegExp(`\\\\"${k}\\\\":(\\d+)`));
    return m ? Number(m[1]) : null;
  };
  return { memberCount: num("gmc") };
}

/**
 * 이벤트별 네이버 지도 링크(emap)는 events 배열이 아니라 group 객체에
 * en/en2/en3… 와 짝지어 들어있다. (e_d+e_t)를 키로 매핑한다.
 */
function extractMapLinks(html: string): Record<string, string> {
  const seg = html.slice(html.indexOf('\\"gmc\\":'), html.indexOf('\\"gmc\\":') + 6000).replace(/\\"/g, '"');
  const links: Record<string, string> = {};
  for (const suf of ["", "2", "3", "4", "5"]) {
    const ed = seg.match(new RegExp(`"e_d${suf}":(\\d+)`));
    const et = seg.match(new RegExp(`"e_t${suf}":(\\d+)`));
    const map = seg.match(new RegExp(`"emap${suf}":"(.*?)"`));
    if (ed && et && map && /^https?:\/\//.test(map[1])) {
      links[`${ed[1]}_${et[1]}`] = map[1];
    }
  }
  return links;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gid =
    searchParams.get("gid") || "e03ab496-0dd3-11ee-8cf5-0a16fe5c82071";

  try {
    const res = await fetch(`https://www.somoim.co.kr/${gid}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`somoim 페이지 응답 오류: ${res.status}`);
    }

    const html = await res.text();
    const raw = extractArray<RawEvent>(html, '\\"events\\":');
    const rawMembers = extractArray<RawMember>(html, '\\"members\\":', 600000);
    const mapLinks = extractMapLinks(html);
    const groupInfo = extractGroupInfo(html);

    const members = rawMembers
      .filter((m) => m.ban !== "Y" && m.mid)
      .map((m) => ({
        id: m.mid,
        name: (m.mn ?? "").trim() || "익명",
        imageUrl: `https://d228e474i2d5yf.cloudfront.net/${m.mid}n.png`,
        isStaff: m.i_m === "Y",
      }))
      // 운영진을 먼저, 그 외는 원래(가입) 순서 유지
      .sort((a, b) => Number(b.isStaff) - Number(a.isStaff));

    const events = raw
      .map((e) => {
        const d = String(e.e_d); // YYYYMMDD
        const t = String(e.e_t).padStart(4, "0"); // HHMM
        return {
          id: e.eid,
          title: e.en,
          dateRaw: e.e_d,
          date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
          time: `${t.slice(0, 2)}:${t.slice(2, 4)}`,
          place: e.el ?? "",
          tag: e.ee ?? "",
          capacity: e.emm ?? null,
          joined: e.enum ?? 0,
          imageUrl: e.imgUrl ?? "",
          region: [e.loc1n, e.loc2n].filter(Boolean).join(" "),
          mapUrl: mapLinks[`${e.e_d}_${e.e_t}`] ?? null,
        };
      })
      .sort((a, b) => a.dateRaw - b.dateRaw);

    const group = {
      name: raw[0]?.gn ?? "",
      imageUrl: raw[0]?.groupImgUrl ?? "",
      region: [raw[0]?.loc1n, raw[0]?.loc2n].filter(Boolean).join(" "),
      memberCount: groupInfo.memberCount ?? members.length,
    };

    return NextResponse.json(
      { success: true, data: { events, group, members } },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
