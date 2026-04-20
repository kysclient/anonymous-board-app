"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Beer,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Plus,
  Trophy,
  Users,
  Minus,
  ChevronRight,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- constants & types ----------

const COLORS = [
  "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#A855F7",
  "#EC4899", "#06B6D4", "#10B981", "#F97316", "#8B5CF6",
  "#14B8A6", "#F43F5E", "#6366F1", "#84CC16", "#D946EF",
  "#0EA5E9", "#FB7185", "#F472B6",
];

const CANVAS_W = 520;
const CANVAS_H = 820;
const WALL = 10;
const FINISH_Y = CANVAS_H - 50;
const GRAVITY = 0.22;
const RESTITUTION = 0.48;
const AIR = 0.9992;

interface Marble {
  id: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  finished: boolean;
  finishOrder: number;
  highlight?: number;
}

interface Peg {
  x: number;
  y: number;
  r: number;
}

interface Ramp {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type Phase = "setup" | "countdown" | "racing" | "finished";

// ---------- course builder ----------

function buildCourse(): { pegs: Peg[]; ramps: Ramp[] } {
  const pegs: Peg[] = [];
  const ramps: Ramp[] = [];

  const rampConfigs: Array<{ y: number; side: "left" | "right" }> = [
    { y: 160, side: "right" },
    { y: 290, side: "left" },
    { y: 420, side: "right" },
    { y: 550, side: "left" },
    { y: 680, side: "right" },
  ];
  const gap = 110;
  for (const { y, side } of rampConfigs) {
    if (side === "right") {
      ramps.push({
        x1: WALL,
        y1: y - 44,
        x2: CANVAS_W - gap - WALL,
        y2: y + 44,
      });
    } else {
      ramps.push({
        x1: gap + WALL,
        y1: y + 44,
        x2: CANVAS_W - WALL,
        y2: y - 44,
      });
    }
  }

  const pegRows: Array<{ y: number; positions: number[] }> = [
    { y: 110, positions: [130, 210, 290, 370] },
    { y: 230, positions: [180, 260, 340, 420] },
    { y: 360, positions: [110, 200, 290, 380] },
    { y: 490, positions: [170, 260, 350, 430] },
    { y: 620, positions: [120, 210, 300, 380] },
    { y: 740, positions: [100, 180, 260, 340, 420] },
  ];
  for (const row of pegRows) {
    for (const x of row.positions) {
      pegs.push({ x, y: row.y, r: 6 });
    }
  }

  return { pegs, ramps };
}

// ---------- page component ----------

export default function DrinkingGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const marblesRef = useRef<Marble[]>([]);
  const courseRef = useRef<{ pegs: Peg[]; ramps: Ramp[] }>({
    pegs: [],
    ramps: [],
  });
  const finishCounterRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [loserCount, setLoserCount] = useState(1);

  const [phase, setPhase] = useState<Phase>("setup");
  const [countdown, setCountdown] = useState(3);
  const [liveFinished, setLiveFinished] = useState<string[]>([]);
  const [losers, setLosers] = useState<string[]>([]);
  const [revealIndex, setRevealIndex] = useState(0);

  // ---------- participant management ----------

  const addParticipant = useCallback(() => {
    const name = participantInput.trim();
    if (!name) return;
    if (participants.includes(name)) {
      setParticipantInput("");
      return;
    }
    setParticipants((p) => [...p, name]);
    setParticipantInput("");
  }, [participantInput, participants]);

  const removeParticipant = (name: string) => {
    setParticipants((p) => p.filter((x) => x !== name));
  };

  const clearAll = () => {
    setParticipants([]);
    setParticipantInput("");
  };

  const addBulk = () => {
    const names = participantInput
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (names.length === 0) return;
    setParticipants((p) => {
      const set = new Set(p);
      for (const n of names) set.add(n);
      return Array.from(set);
    });
    setParticipantInput("");
  };

  // ---------- race flow ----------

  const resetRace = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    marblesRef.current = [];
    finishCounterRef.current = 0;
    setLiveFinished([]);
    setLosers([]);
    setRevealIndex(0);
    setPhase("setup");
  };

  const startGame = () => {
    if (participants.length < 2) return;
    if (loserCount >= participants.length) return;

    courseRef.current = buildCourse();
    const count = participants.length;
    const perRow = Math.min(6, count);
    const spacing = 30;
    const startX = CANVAS_W / 2 - ((perRow - 1) * spacing) / 2;
    const marbles: Marble[] = participants.map((name, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      return {
        id: i,
        name,
        x: startX + col * spacing + (Math.random() - 0.5) * 4,
        y: 30 + row * 30,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        radius: 11,
        color: COLORS[i % COLORS.length],
        finished: false,
        finishOrder: -1,
      };
    });
    marblesRef.current = marbles;
    finishCounterRef.current = 0;
    setLiveFinished([]);
    setLosers([]);
    setRevealIndex(0);
    setPhase("countdown");
    setCountdown(3);
  };

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown < 0) {
      startTimeRef.current = performance.now();
      setPhase("racing");
      return;
    }
    const delay = countdown === 0 ? 450 : 750;
    const t = setTimeout(() => setCountdown((c) => c - 1), delay);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // ---------- physics step ----------

  const step = useCallback(() => {
    const marbles = marblesRef.current;
    const { pegs, ramps } = courseRef.current;
    const now = performance.now();

    for (const m of marbles) {
      if (m.finished) continue;

      m.vy += GRAVITY;
      m.vx *= AIR;
      m.vy *= AIR;
      const speed = Math.hypot(m.vx, m.vy);
      const maxSpeed = 9;
      if (speed > maxSpeed) {
        m.vx = (m.vx / speed) * maxSpeed;
        m.vy = (m.vy / speed) * maxSpeed;
      }

      m.x += m.vx;
      m.y += m.vy;

      if (m.x - m.radius < WALL) {
        m.x = WALL + m.radius;
        m.vx = -m.vx * RESTITUTION;
      }
      if (m.x + m.radius > CANVAS_W - WALL) {
        m.x = CANVAS_W - WALL - m.radius;
        m.vx = -m.vx * RESTITUTION;
      }

      for (const p of pegs) {
        const dx = m.x - p.x;
        const dy = m.y - p.y;
        const dist = Math.hypot(dx, dy);
        const minDist = m.radius + p.r;
        if (dist < minDist && dist > 0.01) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          m.x += nx * overlap;
          m.y += ny * overlap;
          const vn = m.vx * nx + m.vy * ny;
          if (vn < 0) {
            m.vx -= (1 + RESTITUTION) * vn * nx;
            m.vy -= (1 + RESTITUTION) * vn * ny;
            m.vx += (Math.random() - 0.5) * 0.5;
            m.highlight = now;
          }
        }
      }

      for (const r of ramps) {
        const dx = r.x2 - r.x1;
        const dy = r.y2 - r.y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;
        const t = Math.max(
          0,
          Math.min(1, ((m.x - r.x1) * dx + (m.y - r.y1) * dy) / lenSq),
        );
        const cx = r.x1 + t * dx;
        const cy = r.y1 + t * dy;
        const ddx = m.x - cx;
        const ddy = m.y - cy;
        const dist = Math.hypot(ddx, ddy);
        const halfThick = 4;
        const minDist = m.radius + halfThick;
        if (dist < minDist && dist > 0.01) {
          const nx = ddx / dist;
          const ny = ddy / dist;
          const overlap = minDist - dist;
          m.x += nx * overlap;
          m.y += ny * overlap;
          const vn = m.vx * nx + m.vy * ny;
          if (vn < 0) {
            m.vx -= (1 + RESTITUTION) * vn * nx;
            m.vy -= (1 + RESTITUTION) * vn * ny;
          }
        }
      }
    }

    for (let i = 0; i < marbles.length; i++) {
      for (let j = i + 1; j < marbles.length; j++) {
        const a = marbles[i];
        const b = marbles[j];
        if (a.finished || b.finished) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;
        if (dist < minDist && dist > 0.01) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) / 2;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
          const va = a.vx * nx + a.vy * ny;
          const vb = b.vx * nx + b.vy * ny;
          if (va - vb > 0) continue;
          const delta = (vb - va) * (1 + RESTITUTION) * 0.5;
          a.vx += delta * nx;
          a.vy += delta * ny;
          b.vx -= delta * nx;
          b.vy -= delta * ny;
        }
      }
    }

    const newlyFinished: string[] = [];
    for (const m of marbles) {
      if (!m.finished && m.y > FINISH_Y - m.radius) {
        m.finished = true;
        m.finishOrder = finishCounterRef.current++;
        newlyFinished.push(m.name);
      }
    }
    if (newlyFinished.length > 0) {
      setLiveFinished((prev) => [...prev, ...newlyFinished]);
    }

    const remaining = marbles.filter((m) => !m.finished);
    const targetSurvivors = marbles.length - loserCount;
    if (finishCounterRef.current >= targetSurvivors) {
      const sorted = [...remaining].sort((a, b) => b.y - a.y);
      setLosers(sorted.map((m) => m.name));
      setPhase("finished");
    }

    if (performance.now() - startTimeRef.current > 90_000 && remaining.length > 0) {
      const sorted = [...remaining].sort((a, b) => b.y - a.y);
      setLosers(sorted.slice(0, loserCount).map((m) => m.name));
      setPhase("finished");
    }
  }, [loserCount]);

  // ---------- canvas render ----------

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { pegs, ramps } = courseRef.current;
    const marbles = marblesRef.current;

    // light, clean background — Toss-style
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, "#F1F5FB");
    bg.addColorStop(0.5, "#E8F0FC");
    bg.addColorStop(1, "#DEE9FA");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // subtle dot pattern
    ctx.fillStyle = "rgba(59, 130, 246, 0.06)";
    for (let y = 20; y < CANVAS_H; y += 48) {
      for (let x = 20; x < CANVAS_W; x += 48) {
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // walls (soft)
    ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
    ctx.fillRect(0, 0, WALL, CANVAS_H);
    ctx.fillRect(CANVAS_W - WALL, 0, WALL, CANVAS_H);

    // finish zone
    const flGrad = ctx.createLinearGradient(0, FINISH_Y, 0, CANVAS_H);
    flGrad.addColorStop(0, "rgba(59, 130, 246, 0.15)");
    flGrad.addColorStop(1, "rgba(59, 130, 246, 0.05)");
    ctx.fillStyle = flGrad;
    ctx.fillRect(WALL, FINISH_Y, CANVAS_W - WALL * 2, CANVAS_H - FINISH_Y);

    // finish line stripe
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(WALL, FINISH_Y);
    ctx.lineTo(CANVAS_W - WALL, FINISH_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // label
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#3B82F6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FINISH", CANVAS_W / 2, FINISH_Y + 20);

    // ramps (blue accent, Toss-style)
    for (const r of ramps) {
      const grad = ctx.createLinearGradient(r.x1, r.y1, r.x2, r.y2);
      grad.addColorStop(0, "#93C5FD");
      grad.addColorStop(1, "#60A5FA");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(59, 130, 246, 0.25)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.moveTo(r.x1, r.y1);
      ctx.lineTo(r.x2, r.y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    // pegs (subtle blue-gray)
    for (const p of pegs) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(p.x - 1, p.y - 1, 1, p.x, p.y, p.r);
      g.addColorStop(0, "#CBD5E1");
      g.addColorStop(1, "#64748B");
      ctx.fillStyle = g;
      ctx.fill();
    }

    // marbles
    const now = performance.now();
    for (const m of marbles) {
      if (m.finished) continue;

      // soft shadow
      ctx.beginPath();
      ctx.arc(m.x + 1.5, m.y + 3, m.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(15, 23, 42, 0.18)";
      ctx.fill();

      // body with gradient
      const g = ctx.createRadialGradient(
        m.x - m.radius * 0.4,
        m.y - m.radius * 0.4,
        m.radius * 0.2,
        m.x,
        m.y,
        m.radius,
      );
      g.addColorStop(0, lighten(m.color, 0.55));
      g.addColorStop(0.55, m.color);
      g.addColorStop(1, darken(m.color, 0.25));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      // peg-hit flash
      if (m.highlight && now - m.highlight < 250) {
        const alpha = 1 - (now - m.highlight) / 250;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // shine
      ctx.beginPath();
      ctx.arc(
        m.x - m.radius * 0.35,
        m.y - m.radius * 0.35,
        m.radius * 0.32,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fill();

      // name label
      ctx.font = "700 10px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 3.5;
      ctx.strokeText(m.name, m.x, m.y + m.radius + 10);
      ctx.fillStyle = "#0F172A";
      ctx.fillText(m.name, m.x, m.y + m.radius + 10);
    }

    // pulse losers when finished
    if (phase === "finished") {
      for (const m of marbles) {
        if (m.finished) continue;
        const pulse = 1 + Math.sin(now / 150) * 0.25;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius * (1.4 + pulse * 0.35), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.55 + pulse * 0.25})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }, [phase]);

  // ---------- animation loop ----------

  useEffect(() => {
    if (phase !== "racing" && phase !== "finished") return;

    const loop = () => {
      if (phase === "racing") {
        step();
        step();
      }
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [phase, step, draw]);

  useEffect(() => {
    if (phase === "countdown") draw();
  }, [phase, draw]);

  // stagger-reveal losers
  useEffect(() => {
    if (phase !== "finished") return;
    if (losers.length === 0) return;
    setRevealIndex(0);
    const t = setInterval(() => {
      setRevealIndex((i) => {
        if (i >= losers.length) {
          clearInterval(t);
          return i;
        }
        return i + 1;
      });
    }, 650);
    return () => clearInterval(t);
  }, [phase, losers]);

  // ---------- UI ----------

  const canStart =
    participants.length >= 2 &&
    loserCount >= 1 &&
    loserCount < participants.length;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <style jsx global>{`
        @keyframes tsspring-in {
          0% { transform: scale(0.6) translateY(8px); opacity: 0; }
          60% { transform: scale(1.08) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes tsspring-pop {
          0% { transform: scale(0.2); opacity: 0; }
          55% { transform: scale(1.18); opacity: 1; }
          80% { transform: scale(0.96); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tsfloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes tsfade-up {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes tsbounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes tsshimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes tsring {
          0% { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes tsconfetti {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translateY(420px) rotate(780deg); opacity: 0; }
        }
        @keyframes tscount {
          0% { transform: scale(0.3); opacity: 0; letter-spacing: 0.5em; }
          45% { transform: scale(1.1); opacity: 1; letter-spacing: 0; }
          100% { transform: scale(0.85); opacity: 0; letter-spacing: -0.1em; }
        }
        @keyframes tspulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -top-16 -right-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              <span className="text-[11px] font-semibold tracking-wide">
                SPICY LAB · 술게임
              </span>
            </div>
            <h1 className="text-[26px] sm:text-[30px] font-black leading-tight tracking-tight">
              누가 걸릴까요? 🍻
            </h1>
            <p className="text-sm text-white/80 leading-relaxed">
              이름을 넣고 구슬 레이스로 술 당첨자를 정해보세요
            </p>
          </div>
          <div
            className="shrink-0 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur shadow-lg"
            style={{ animation: "tsfloat 3s ease-in-out infinite" }}
          >
            <Beer className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        {/* ────── LEFT: controls ────── */}
        <div className="flex flex-col gap-4">
          {/* Step 1 — participants */}
          <section className="rounded-3xl bg-card border border-border/60 shadow-sm">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-[13px] font-black">
                    1
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold leading-tight">
                      참가자 추가
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      이름을 입력하고 엔터 · 쉼표로 여러 명 한번에
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 px-3 py-1">
                  <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {participants.length}명
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Korean IME: Enter that commits a composing char fires keyCode 229 (or isComposing=true).
                    // Skip those to avoid registering the trailing character twice.
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (
                        participantInput.includes(",") ||
                        participantInput.includes("\n")
                      ) {
                        addBulk();
                      } else {
                        addParticipant();
                      }
                    }
                  }}
                  placeholder="예) 유신, 가람, 차은욱"
                  disabled={phase !== "setup"}
                  className="h-12 flex-1 rounded-2xl bg-muted/40 border-transparent focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 text-sm"
                />
                <Button
                  type="button"
                  onClick={addParticipant}
                  disabled={phase !== "setup" || !participantInput.trim()}
                  className="h-12 w-12 p-0 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              {participants.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {participants.map((name, i) => (
                    <div
                      key={name}
                      className="group inline-flex items-center gap-2 rounded-full bg-muted/60 pl-1.5 pr-3 py-1.5 text-[13px] font-semibold shadow-sm border border-border/40"
                      style={{ animation: "tsspring-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                        style={{ background: COLORS[i % COLORS.length] }}
                      >
                        {i + 1}
                      </span>
                      <span>{name}</span>
                      {phase === "setup" && (
                        <button
                          onClick={() => removeParticipant(name)}
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-2xl bg-muted/30 py-10 text-xs text-muted-foreground">
                  참가자를 추가하면 여기에 표시돼요
                </div>
              )}

              {phase === "setup" && participants.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={clearAll}
                    className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    전체 삭제
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Step 2 — loser count */}
          <section className="rounded-3xl bg-card border border-border/60 shadow-sm">
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-[13px] font-black">
                  2
                </div>
                <div>
                  <h3 className="text-[15px] font-bold leading-tight">
                    몇 명이 걸리나요?
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    마지막에 도착한 사람들이 술 당첨
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-5 rounded-2xl bg-muted/30 px-4 py-6">
                <button
                  type="button"
                  onClick={() => setLoserCount((c) => Math.max(1, c - 1))}
                  disabled={phase !== "setup" || loserCount <= 1}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm border border-border/50 hover:bg-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="flex items-baseline gap-1 min-w-[88px] justify-center">
                  <span
                    key={loserCount}
                    className="text-[56px] font-black bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-none tabular-nums"
                    style={{ animation: "tsspring-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                  >
                    {loserCount}
                  </span>
                  <span className="text-base font-bold text-muted-foreground">명</span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setLoserCount((c) =>
                      Math.min(Math.max(1, participants.length - 1), c + 1),
                    )
                  }
                  disabled={
                    phase !== "setup" ||
                    loserCount >= participants.length - 1
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm border border-border/50 hover:bg-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {participants.length > 0 && loserCount >= participants.length && (
                <p className="text-xs text-red-500 text-center">
                  참가자 수보다 적어야 해요
                </p>
              )}
            </div>
          </section>

          {/* Start CTA */}
          {phase === "setup" ? (
            <button
              onClick={startGame}
              disabled={!canStart}
              className={cn(
                "relative group overflow-hidden rounded-3xl h-[64px] font-black text-[17px] text-white shadow-lg transition-all active:scale-[0.98]",
                canStart
                  ? "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:shadow-xl hover:shadow-blue-500/30"
                  : "bg-muted text-muted-foreground cursor-not-allowed shadow-none",
              )}
            >
              {canStart && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "tsshimmer 1.5s linear infinite",
                  }}
                />
              )}
              <span className="relative flex items-center justify-center gap-2">
                <Play className="h-5 w-5 fill-white" />
                레이스 시작하기
                {canStart && <ChevronRight className="h-5 w-5" />}
              </span>
            </button>
          ) : (
            <button
              onClick={resetRace}
              className="rounded-3xl h-[64px] font-bold text-[15px] bg-muted hover:bg-muted/80 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              다시 하기
            </button>
          )}

          {/* Live leaderboard */}
          {(phase === "racing" || phase === "finished") && (
            <section className="rounded-3xl bg-card border border-border/60 shadow-sm">
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold leading-tight">
                      도착 순위
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      먼저 도착할수록 안전해요
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {liveFinished.length === 0 ? (
                    <div className="flex items-center justify-center rounded-2xl bg-muted/30 py-6 text-xs text-muted-foreground">
                      레이스 진행 중…
                    </div>
                  ) : (
                    liveFinished.map((name, i) => (
                      <div
                        key={`${name}-${i}`}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm",
                          i === 0
                            ? "bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-950/10 border border-amber-400/30"
                            : "bg-muted/40",
                        )}
                        style={{
                          animation:
                            "tsspring-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                            i === 0
                              ? "bg-amber-500 text-white"
                              : i === 1
                                ? "bg-slate-400 text-white"
                                : i === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-background text-muted-foreground border",
                          )}
                        >
                          {i + 1}
                        </div>
                        <span className="font-bold flex-1">{name}</span>
                        {i === 0 && (
                          <Trophy className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ────── RIGHT: canvas arena ────── */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="rounded-[28px] border border-border/40 shadow-2xl max-w-full"
              style={{
                width: "min(100%, 480px)",
                height: "auto",
                background: "#F1F5FB",
              }}
            />

            {/* Setup empty state */}
            {phase === "setup" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-50/95 to-indigo-50/95 dark:from-slate-900/95 dark:to-slate-900/95 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 text-center p-6 max-w-[280px]">
                  <div className="relative">
                    <div
                      className="absolute inset-0 rounded-3xl bg-blue-400/30 blur-2xl"
                      style={{ animation: "tsfloat 3s ease-in-out infinite" }}
                    />
                    <div
                      className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl"
                      style={{ animation: "tsfloat 3s ease-in-out infinite" }}
                    >
                      <Beer className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-[17px] font-black text-foreground">
                      준비되면 시작해요
                    </h3>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      {participants.length < 2
                        ? "최소 2명의 참가자가 필요해요"
                        : !canStart
                          ? "설정을 확인해주세요"
                          : `${participants.length}명 중 ${loserCount}명이 걸려요`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Countdown overlay */}
            {phase === "countdown" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-600/30 to-indigo-700/40 backdrop-blur-[3px]">
                <div className="relative">
                  <div
                    className="absolute inset-0 -m-8 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)",
                      animation: "tspulse-ring 1s ease-out infinite",
                    }}
                  />
                  <div
                    key={countdown}
                    className="relative text-[140px] sm:text-[160px] font-black leading-none"
                    style={{
                      animation:
                        "tscount 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      color: "white",
                      textShadow:
                        "0 4px 40px rgba(59,130,246,0.6), 0 0 80px rgba(99,102,241,0.5)",
                    }}
                  >
                    {countdown > 0 ? countdown : "GO!"}
                  </div>
                </div>
              </div>
            )}

            {/* Finished overlay — fixed to viewport so it centers on mobile */}
            {phase === "finished" && losers.length > 0 && (
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/50 backdrop-blur-sm p-4">
                {/* confetti (spans viewport) */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-3 pointer-events-none rounded-sm"
                    style={{
                      left: `${6 + ((i * 43) % 88)}%`,
                      top: "-12px",
                      background: COLORS[i % COLORS.length],
                      animation: `tsconfetti ${2.8 + (i % 4) * 0.4}s linear ${i * 0.12}s infinite`,
                    }}
                  />
                ))}

                <div
                  className="relative z-10 w-full max-w-[360px] pt-10"
                  style={{
                    animation:
                      "tsspring-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {/* floating icon — sibling outside the overflow-hidden card */}
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl border-4 border-white"
                    style={{
                      animation: "tsbounce 1.2s ease-in-out infinite",
                    }}
                  >
                    <PartyPopper className="h-9 w-9 text-blue-500" />
                  </div>

                  {/* modal card */}
                  <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
                    {/* header */}
                    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 pt-14 pb-5 px-5 text-center text-white">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/80 font-semibold">
                        오늘의 당첨자
                      </p>
                      <h2 className="text-xl font-black mt-1">
                        {losers.length === 1
                          ? "한 명이 걸렸어요"
                          : `${losers.length}명이 걸렸어요`}
                      </h2>
                    </div>

                    {/* loser list */}
                    <div className="p-5 space-y-2.5 bg-white dark:bg-slate-900 max-h-[55vh] overflow-y-auto">
                      {losers.slice(0, revealIndex).map((name, i) => (
                        <div
                          key={`${name}-${i}`}
                          className="relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-800/50 p-3"
                          style={{
                            animation:
                              "tsspring-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                          }}
                        >
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-base shadow-lg">
                            {name.charAt(0)}
                            <div
                              className="absolute inset-0 rounded-full bg-blue-400/50"
                              style={{
                                animation: "tsring 1.5s ease-out infinite",
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-black text-foreground leading-tight truncate">
                              {name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              🍺 원샷 당첨
                            </p>
                          </div>
                          <div className="text-xl">🥂</div>
                        </div>
                      ))}

                      {revealIndex >= losers.length && (
                        <div
                          className="text-center pt-2"
                          style={{ animation: "tsfade-up 0.5s ease-out" }}
                        >
                          <p className="text-[13px] font-bold text-blue-600 dark:text-blue-400">
                            건배! 🍻
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="p-4 pt-2 bg-white dark:bg-slate-900 border-t border-border/40">
                      <button
                        onClick={resetRace}
                        className="w-full h-12 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        다시 하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- color helpers ----------

function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `rgb(${nr},${ng},${nb})`;
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.round(r * (1 - amount));
  const ng = Math.round(g * (1 - amount));
  const nb = Math.round(b * (1 - amount));
  return `rgb(${nr},${ng},${nb})`;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}
