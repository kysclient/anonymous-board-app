'use client'
import React, { useEffect, useMemo, useState } from "react";
import { create } from "zustand/react";

/** 도둑잡기(Old Maid) — 확장 가능한 클라이언트 전용 MVP
 * - 2~6인 로컬 핫시트 플레이
 * - 조커 1장 포함(도둑 카드). 페어는 "동일 랭크 + 동일 색(레드/블랙)"으로 제거
 * - 자신의 턴에 다음 플레이어 손에서 임의의 위치 1장을 뽑음 -> 즉시 페어 제거 -> 빈손이면 탈락
 * - 조커만 남는 순간, 조커 보유자가 패자, 나머지는 승자
 * - 네트워킹은 추후 패치 전파 함수 한 곳만 연결하면 됨 (파일 하단 참조)
 */

// -------------------- 카드/유틸 --------------------

type Suit = "S" | "C" | "H" | "D"; // Spade, Club, Heart, Diamond
const SUITS: Suit[] = ["S", "C", "H", "D"];
const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
] as const;

type Rank = (typeof RANKS)[number];

export interface Card {
  id: string; // unique
  rank: Rank | "JOKER";
  suit?: Suit;
}

const isRed = (s: Suit) => s === "H" || s === "D";

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({ id: `${s}-${r}`, rank: r, suit: s });
    }
  }
  deck.push({ id: `JOKER`, rank: "JOKER" }); // 도둑 카드
  return deck;
}

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 동랭크 + 동색이면 페어 성립. 페어는 2장 단위.
function removePairs(hand: Card[]): { hand: Card[]; removed: Card[][] } {
  const byKey = new Map<string, Card[]>();
  for (const c of hand) {
    if (c.rank === "JOKER") continue;
    const color = isRed(c.suit!) ? "R" : "B";
    const key = `${c.rank}-${color}`;
    const arr = byKey.get(key) || [];
    arr.push(c);
    byKey.set(key, arr);
  }
  const toRemoveIds = new Set<string>();
  const removed: Card[][] = [];
  for (const arr of byKey.values()) {
    // 2장씩 제거
    const pairs = Math.floor(arr.length / 2);
    for (let i = 0; i < pairs * 2; i += 2) {
      toRemoveIds.add(arr[i].id);
      toRemoveIds.add(arr[i + 1].id);
      removed.push([arr[i], arr[i + 1]]);
    }
  }
  const newHand = hand.filter((c) => !toRemoveIds.has(c.id));
  return { hand: newHand, removed };
}

// -------------------- 게임 상태 --------------------

interface Player {
  id: string;
  name: string;
  hand: Card[];
  out: boolean;
}

type Phase = "idle" | "playing" | "finished";

interface GameState {
  players: Player[];
  turn: number; // players index
  phase: Phase;
  loserId: string | null;
  seed: number;
  // actions
  start: (n: number, names?: string[]) => void;
  drawFromNext: (pickIndex: number) => void;
  nextTurn: () => void;
  reset: () => void;
  // sync hook (나중에 ws로 교체) — 상태 패치가 있을 때 호출됨
  onPatch?: (partial: Partial<GameState>) => void;
}

export const useGame = create<GameState>((set: any, get: any) => ({
  players: [],
  turn: 0,
  phase: "idle",
  loserId: null,
  seed: Date.now(),

  start: (n: any, names: any) => {
    const count = Math.max(2, Math.min(6, n));
    const deck = shuffle(buildDeck());

    const players: Player[] = Array.from({ length: count }, (_, i) => ({
      id: `P${i + 1}`,
      name: names?.[i] ?? `Player ${i + 1}`,
      hand: [],
      out: false,
    }));

    // 라운드 로빈으로 배분
    let idx = 0;
    for (const card of deck) {
      players[idx].hand.push(card);
      idx = (idx + 1) % count;
    }

    // 시작 전 즉시 페어 제거
    for (const p of players) {
      const r = removePairs(p.hand);
      p.hand = r.hand;
      if (p.hand.length === 0) p.out = true;
    }

    set({
      players,
      turn: 0,
      phase: "playing",
      loserId: null,
      seed: Date.now(),
    });
    get().onPatch?.({
      players: get().players,
      turn: get().turn,
      phase: "playing",
    });
  },

  drawFromNext: (pickIndex: any) => {
    const state = get();
    if (state.phase !== "playing") return;

    // 현재 플레이어와 다음 활성 플레이어 찾기
    const activeIdxs = state.players
      .map((p: any, i: any) => (!p.out ? i : -1))
      .filter((i: any) => i >= 0);
    if (activeIdxs.length <= 1) return;

    let cur = state.turn;
    while (state.players[cur].out) cur = (cur + 1) % state.players.length;

    let nxt = (cur + 1) % state.players.length;
    while (state.players[nxt].out) nxt = (nxt + 1) % state.players.length;

    const curP = state.players[cur];
    const nextP = state.players[nxt];

    if (nextP.hand.length === 0) return;

    // 인덱스 안전화
    const safeIndex = Math.max(0, Math.min(nextP.hand.length - 1, pickIndex));

    // 카드 이동
    const [picked] = nextP.hand.splice(safeIndex, 1);
    curP.hand.push(picked);

    // 즉시 페어 제거
    const r = removePairs(curP.hand);
    curP.hand = r.hand;

    // 탈락 체크
    if (nextP.hand.length === 0) nextP.out = true;
    if (curP.hand.length === 0) curP.out = true;

    // 종료 조건: 조커만 남았는지
    const alive = state.players.filter((p: any) => !p.out);
    if (alive.length === 1) {
      const last = alive[0];
      const hasJoker = last.hand.some((c: any) => c.rank === "JOKER");
      set({ phase: "finished", loserId: hasJoker ? last.id : null });
      get().onPatch?.({ phase: "finished", loserId: get().loserId });
      return;
    }

    // 턴 유지: 도둑잡기는 보통 1장 뽑고 다음 사람에게 턴 이동
    set({ players: [...state.players] });
    get().nextTurn();
  },

  nextTurn: () => {
    const s = get();
    if (s.phase !== "playing") return;
    let t = (s.turn + 1) % s.players.length;
    while (s.players[t].out) t = (t + 1) % s.players.length;
    set({ turn: t });
    get().onPatch?.({ turn: t });
  },

  reset: () =>
    set({
      players: [],
      turn: 0,
      phase: "idle",
      loserId: null,
      seed: Date.now(),
    }),
}));

// -------------------- UI --------------------

function CardView({ card }: { card: Card }) {
  const label = card.rank === "JOKER" ? "🃏" : `${card.rank}${card.suit}`;
  const color =
    card.rank === "JOKER"
      ? "text-emerald-500"
      : card.suit === "H" || card.suit === "D"
      ? "text-rose-500"
      : "text-slate-800";
  return (
    <div
      className={`w-12 h-16 rounded-xl bg-white shadow flex items-center justify-center text-sm font-semibold ${color}`}
    >
      {label}
    </div>
  );
}

function HiddenCard({ onPick }: { onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className="w-12 h-16 rounded-xl bg-slate-700/60 shadow-inner border border-slate-600"
    />
  );
}

function Controls() {
  const { start, reset, players, phase, turn } = useGame();
  return (
    <div className="flex items-center gap-2">
      <button
        className="px-3 py-1 rounded-lg bg-slate-800 text-white"
        onClick={() => start(4)}
      >
        새 게임 4인
      </button>
      <button
        className="px-3 py-1 rounded-lg bg-slate-700 text-white"
        onClick={() => start(3)}
      >
        3인
      </button>
      <button
        className="px-3 py-1 rounded-lg bg-slate-700 text-white"
        onClick={() => start(2)}
      >
        2인
      </button>
      <button
        className="px-3 py-1 rounded-lg bg-slate-600 text-white"
        onClick={reset}
      >
        리셋
      </button>
      <span className="px-2 text-slate-300 text-sm">
        상태: {phase} / 턴: {players[turn]?.name ?? "-"}
      </span>
    </div>
  );
}

function Table() {
  const { players, turn, phase, drawFromNext } = useGame();

  // 현재, 다음 플레이어 파생
  const current = players[turn];
  if (!current) return null;

  let nextIdx = (turn + 1) % players.length;
  while (players[nextIdx] && players[nextIdx].out)
    nextIdx = (nextIdx + 1) % players.length;
  const nextP = players[nextIdx];

  return (
    <div className="grid grid-cols-12 gap-6 w-full">
      {/* 상단: 상대(다음 플레이어) */}
      <div className="col-span-12">
        <div className="text-sm text-slate-300 mb-2">
          다음 플레이어: {nextP?.name} {nextP?.out ? "(탈락)" : ""}
        </div>
        <div className="flex gap-2 flex-wrap">
          {nextP?.hand.map((_: any, i: any) => (
            <HiddenCard
              key={i}
              onPick={() => phase === "playing" && drawFromNext(i)}
            />
          ))}
          {(!nextP || nextP.hand.length === 0) && (
            <div className="text-slate-400 text-sm">뽑을 카드 없음</div>
          )}
        </div>
      </div>

      {/* 중앙: 플레이어 목록 및 상태 */}
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3">
        {players.map((p: any, i: any) => (
          <div
            key={p.id}
            className={`rounded-xl p-3 ${
              i === turn
                ? "bg-emerald-900/30 border border-emerald-700"
                : "bg-slate-800/50"
            }`}
          >
            <div className="flex items-center justify-between mb-2 text-slate-100">
              <span>{p.name}</span>
              <span className="text-xs text-slate-300">
                {p.out ? "OUT" : `${p.hand.length}장`}
              </span>
            </div>
            <div className="flex gap-1 flex-wrap min-h-[2rem]">
              {!p.out && i === turn
                ? p.hand.map((c: any) => <CardView key={c.id} card={c} />)
                : null}
              {p.out && <span className="text-xs text-slate-400">탈락</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Result() {
  const { phase, loserId, players } = useGame();
  if (phase !== "finished") return null;
  const loser = players.find((p: any) => p.id === loserId);
  const winners = players.filter((p: any) => p.id !== loserId);
  return (
    <div className="mt-4 p-4 rounded-xl bg-amber-900/20 border border-amber-700 text-amber-100">
      <div className="font-semibold mb-1">게임 종료</div>
      <div className="text-sm">패자: {loser?.name} (🃏)</div>
      <div className="text-sm">
        승자: {winners.map((w: any) => w.name).join(", ")}
      </div>
    </div>
  );
}

export default function OldMaidGame() {
  const phase = useGame((s: any) => s.phase);
  useEffect(() => {
    if (phase === "idle") useGame.getState().start(4);
  }, [phase]);

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">도둑잡기 — MVP</h1>
        <Controls />
      </div>
      <Table />
      <Result />
      <FooterDocs />
    </div>
  );
}

function FooterDocs() {
  return (
    <details className="mt-6 text-slate-300 text-sm">
      <summary className="cursor-pointer select-none">
        아키텍처 노트 / 네트워크 확장 포인트
      </summary>
      <ul className="list-disc ml-6 mt-2 space-y-1">
        <li>페어 규칙: 동랭크 + 동색(레드/블랙) 2장 제거. 조커는 페어 불가.</li>
        <li>
          턴 흐름: 현재 → 다음 활성 플레이어. 다음 손에서 인덱스로 1장 뽑기 →
          즉시 페어 제거 → 빈손이면 탈락 → 다음 턴.
        </li>
        <li>
          종료 조건: 활성 플레이어가 1명 남으면 종료. 남은 손에 🃏 있으면 패자.
        </li>
        <li>
          네트워크 확장: useGame 스토어의 <code>onPatch</code> 훅에 부분 상태를
          브로드캐스트. 서버에서 수신 시 <code>useGame.setState(partial)</code>
          로 반영.
        </li>
        <li>
          보안: 온라인 전환 시 카드 공개 범위 분리(서버 권위, 개별 시크릿 채널)
          필요.
        </li>
      </ul>
    </details>
  );
}

/* -------------------- WebSocket 연동 스켈레톤 --------------------

// 1) 클라이언트
// const ws = useRef<WebSocket | null>(null)
// useEffect(() => {
//   ws.current = new WebSocket(WS_URL)
//   ws.current.onmessage = (ev) => {
//     const msg = JSON.parse(ev.data)
//     if (msg.t === 'patch') useGame.setState(msg.payload)
//   }
//   return () => ws.current?.close()
// }, [])
//
// // 액션 내에서 브로드캐스트
// useGame.setState({ onPatch: (partial) => ws.current?.send(JSON.stringify({ t: 'patch', payload: partial })) })
//
// 2) 서버(예: Node ws)
// wss.on('connection', (sock) => {
//   sock.on('message', (raw) => {
//     const msg = JSON.parse(raw.toString())
//     if (msg.t === 'patch') broadcastToRoom(sock.room, raw)
//   })
// })

*/
