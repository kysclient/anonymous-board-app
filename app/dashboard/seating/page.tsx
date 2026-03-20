"use client";

import type React from "react";
import { useState, useRef, useMemo } from "react";
import { Plus, X, Shuffle, Download, Users, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  name: string;
  gender: "male" | "female";
}

interface TableSeat {
  participant: string;
  gender: "male" | "female";
  position: number;
}

type TableShape = "linear" | "round";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/* ── 원형 배치 컴포넌트 ── */
function RoundTable({ seats }: { seats: TableSeat[] }) {
  const count = seats.length;
  // 모바일에선 작게, 데스크톱에선 크게
  // 사람 수에 따라 반지름 동적 조절
  const baseRadius = Math.max(100, Math.min(160, count * 16));

  return (
    <div className="flex items-center justify-center py-4">
      <div
        className="relative"
        style={{
          width: `${baseRadius * 2 + 80}px`,
          height: `${baseRadius * 2 + 80}px`,
        }}
      >
        {/* 테이블 원 */}
        <div
          className="absolute rounded-full border-2 border-border/30 bg-muted/15"
          style={{
            width: `${baseRadius * 1.2}px`,
            height: `${baseRadius * 1.2}px`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
            Table
          </span>
        </div>

        {/* 좌석들 */}
        {seats.map((seat, i) => {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2;
          const x = Math.cos(angle) * baseRadius;
          const y = Math.sin(angle) * baseRadius;

          return (
            <div
              key={seat.position}
              className="absolute animate-in fade-in-0 zoom-in-90"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: "translate(-50%, -50%)",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 sm:px-3 sm:py-2 whitespace-nowrap",
                  "shadow-sm backdrop-blur-sm",
                  seat.gender === "male"
                    ? "border-blue-500/20 bg-blue-500/8 dark:bg-blue-500/10"
                    : "border-rose-500/20 bg-rose-500/8 dark:bg-rose-500/10"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      seat.gender === "male" ? "bg-blue-500" : "bg-rose-500"
                    )}
                  />
                  <span className="text-[10px] sm:text-xs font-medium">{seat.participant}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 일자형 배치 컴포넌트 ── */
function LinearTable({ seats }: { seats: TableSeat[] }) {
  const half = Math.ceil(seats.length / 2);
  const leftSeats = seats.filter((s) => s.position < half);
  const rightSeats = seats.filter((s) => s.position >= half);

  return (
    <div className="flex gap-3 sm:gap-4 max-w-lg mx-auto">
      {/* 왼쪽 */}
      <div className="flex-1 space-y-2">
        <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider font-medium mb-3">
          좌
        </p>
        {leftSeats.map((seat, i) => (
          <div
            key={seat.position}
            className="animate-in fade-in-0 slide-in-from-left-2"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <SeatChip seat={seat} />
          </div>
        ))}
      </div>

      {/* 테이블 중앙선 */}
      <div className="flex items-center justify-center px-1 sm:px-2">
        <div className="w-px h-full bg-border/40 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border/60 bg-muted/20 flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] text-muted-foreground/60 font-medium">T</span>
          </div>
        </div>
      </div>

      {/* 오른쪽 */}
      <div className="flex-1 space-y-2">
        <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider font-medium mb-3">
          우
        </p>
        {rightSeats.map((seat, i) => (
          <div
            key={seat.position}
            className="animate-in fade-in-0 slide-in-from-right-2"
            style={{ animationDelay: `${(i + leftSeats.length) * 80}ms` }}
          >
            <SeatChip seat={seat} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatChip({ seat }: { seat: TableSeat }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 text-center transition-colors",
        seat.gender === "male"
          ? "border-blue-500/15 bg-blue-500/5"
          : "border-rose-500/15 bg-rose-500/5"
      )}
    >
      <div className="flex items-center justify-center gap-1.5">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            seat.gender === "male" ? "bg-blue-500" : "bg-rose-500"
          )}
        />
        <span className="text-[11px] sm:text-xs font-medium">{seat.participant}</span>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function SeatingV2Page() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState<"male" | "female">("male");
  const [tableSeats, setTableSeats] = useState<TableSeat[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [tableShape, setTableShape] = useState<TableShape>("linear");
  const resultsRef = useRef<HTMLDivElement>(null);

  const maleCount = participants.filter((p) => p.gender === "male").length;
  const femaleCount = participants.filter((p) => p.gender === "female").length;

  const addParticipant = () => {
    if (newName.trim() && participants.length < 50) {
      setParticipants([
        ...participants,
        { id: Date.now().toString(), name: newName.trim(), gender: newGender },
      ]);
      setNewName("");
    }
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
    setShowResults(false);
    setTableSeats([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addParticipant();
  };

  const startMatching = async () => {
    if (participants.length < 2) return;
    setIsMatching(true);
    setShowResults(false);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const males = shuffleArray(participants.filter((p) => p.gender === "male"));
    const females = shuffleArray(participants.filter((p) => p.gender === "female"));

    const newSeats: TableSeat[] = [];
    const total = participants.length;
    let maleIdx = 0;
    let femaleIdx = 0;
    let consecutiveCount = 0;
    let lastGender: "male" | "female" | null = null;

    for (let pos = 0; pos < total; pos++) {
      let selected: "male" | "female" | null = null;
      const malesLeft = males.length - maleIdx;
      const femalesLeft = females.length - femaleIdx;
      const remaining = total - pos;

      if (malesLeft === 0) {
        selected = "female";
      } else if (femalesLeft === 0) {
        selected = "male";
      } else if (consecutiveCount >= 2 && lastGender) {
        selected = lastGender === "male" ? "female" : "male";
      } else {
        const maleRatio = malesLeft / remaining;
        const femaleRatio = femalesLeft / remaining;

        if (lastGender === "male") {
          selected = femaleRatio >= 0.3 ? "female" : "male";
        } else if (lastGender === "female") {
          selected = maleRatio >= 0.3 ? "male" : "female";
        } else {
          selected = malesLeft >= femalesLeft ? "male" : "female";
        }
      }

      if (selected === "male" && maleIdx < males.length) {
        newSeats.push({ participant: males[maleIdx].name, gender: "male", position: pos });
        maleIdx++;
      } else if (selected === "female" && femaleIdx < females.length) {
        newSeats.push({ participant: females[femaleIdx].name, gender: "female", position: pos });
        femaleIdx++;
      }

      if (selected === lastGender) {
        consecutiveCount++;
      } else {
        consecutiveCount = 1;
        lastGender = selected;
      }
    }

    setTableSeats(newSeats);
    setIsMatching(false);
    setShowResults(true);
  };

  const downloadAsImage = async () => {
    if (!resultsRef.current || tableSeats.length === 0) return;
    try {
      const html2canvas = await import("html2canvas").then((m) => m.default);
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement("a");
      link.download = `자리배치_${new Date().toLocaleDateString("ko-KR").replace(/\./g, "")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      console.log("html2canvas not available");
    }
  };

  const resultMaleCount = tableSeats.filter((s) => s.gender === "male").length;
  const resultFemaleCount = tableSeats.filter((s) => s.gender === "female").length;

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
          <Users className="h-3 w-3" />
          Seating v2
        </div>
        <h1 className="text-xl font-semibold sm:text-2xl">자리 배치</h1>
        <p className="text-xs text-muted-foreground">
          참가자를 추가하고 성별 균형 맞춤 자리 배치를 생성하세요
        </p>
      </div>

      {/* Input section */}
      <div className="rounded-xl border border-border/60 bg-card/80 p-3.5 sm:p-5 space-y-3">
        <div className="flex gap-2">
          {/* Gender toggle */}
          <div className="flex rounded-lg border border-border/60 overflow-hidden flex-shrink-0">
            <button
              onClick={() => setNewGender("male")}
              className={cn(
                "px-3.5 py-2.5 text-xs font-medium transition-colors min-w-[40px]",
                newGender === "male"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground hover:bg-accent/40"
              )}
            >
              남
            </button>
            <button
              onClick={() => setNewGender("female")}
              className={cn(
                "px-3.5 py-2.5 text-xs font-medium transition-colors border-l border-border/60 min-w-[40px]",
                newGender === "female"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground hover:bg-accent/40"
              )}
            >
              여
            </button>
          </div>

          {/* Name input */}
          <input
            type="text"
            placeholder="이름 입력"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            className={cn(
              "flex-1 min-w-0 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50",
              "transition-all placeholder:text-muted-foreground/50"
            )}
          />

          {/* Add button */}
          <button
            onClick={addParticipant}
            disabled={!newName.trim() || participants.length >= 50}
            className={cn(
              "flex-shrink-0 flex items-center justify-center rounded-lg w-10 h-10 transition-all",
              newName.trim() && participants.length < 50
                ? "bg-foreground text-background hover:opacity-90 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground tabular-nums">
          {participants.length}/50명 · 남 {maleCount} · 여 {femaleCount}
          {participants.length < 2 && " · 최소 2명 필요"}
        </p>
      </div>

      {/* Participants */}
      {participants.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-sm font-semibold">참가자 ({participants.length}명)</h2>
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  p.gender === "male"
                    ? "border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300"
                    : "border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-300"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    p.gender === "male" ? "bg-blue-500" : "bg-rose-500"
                  )}
                />
                {p.name}
                <button
                  onClick={() => removeParticipant(p.id)}
                  className="ml-0.5 rounded-sm p-0.5 hover:bg-foreground/10 transition-colors -mr-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start button */}
      {participants.length >= 2 && (
        <button
          onClick={startMatching}
          disabled={isMatching}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium transition-all",
            isMatching
              ? "bg-muted text-muted-foreground cursor-wait"
              : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
          )}
        >
          {isMatching ? (
            <>
              <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              배치 중...
            </>
          ) : (
            <>
              <Shuffle className="h-4 w-4" />
              자리 배치 시작
            </>
          )}
        </button>
      )}

      {/* Empty state */}
      {participants.length === 0 && !showResults && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">참가자를 추가해 주세요</p>
          <p className="text-[11px] text-muted-foreground/60">최소 2명 이상 필요합니다</p>
        </div>
      )}

      {/* Results */}
      {showResults && tableSeats.length > 0 && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div ref={resultsRef} className="space-y-4">
            {/* Result header + shape toggle */}
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">배치 결과</h2>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  총 {tableSeats.length}명 · 남 {resultMaleCount} · 여 {resultFemaleCount}
                </p>
              </div>

              {/* Table shape toggle */}
              <div className="flex rounded-lg border border-border/60 overflow-hidden">
                <button
                  onClick={() => setTableShape("linear")}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] font-medium transition-colors flex items-center gap-1.5",
                    tableShape === "linear"
                      ? "bg-foreground/5 text-foreground"
                      : "text-muted-foreground hover:bg-accent/40"
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                    <rect x="1" y="3" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  일자
                </button>
                <button
                  onClick={() => setTableShape("round")}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] font-medium transition-colors border-l border-border/60 flex items-center gap-1.5",
                    tableShape === "round"
                      ? "bg-foreground/5 text-foreground"
                      : "text-muted-foreground hover:bg-accent/40"
                  )}
                >
                  <Circle className="h-3 w-3 flex-shrink-0" />
                  원형
                </button>
              </div>
            </div>

            {/* Visual table */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-3 sm:p-6 overflow-x-auto">
              {tableShape === "round" ? (
                <RoundTable seats={tableSeats} />
              ) : (
                <LinearTable seats={tableSeats} />
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] text-muted-foreground">남</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] text-muted-foreground">여</span>
                </div>
              </div>
            </div>

            {/* Seat order list */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-3.5 sm:p-5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-3">
                좌석 순서
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                {tableSeats.map((seat, i) => (
                  <div
                    key={seat.position}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent/30 transition-colors"
                  >
                    <span className="text-[10px] text-muted-foreground tabular-nums w-4 flex-shrink-0">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        seat.gender === "male" ? "bg-blue-500" : "bg-rose-500"
                      )}
                    />
                    <span className="text-[11px] sm:text-xs font-medium truncate">{seat.participant}</span>
                    {tableShape === "linear" && (
                      <span className="text-[9px] text-muted-foreground/60 ml-auto flex-shrink-0">
                        {seat.position < Math.ceil(tableSeats.length / 2) ? "L" : "R"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={downloadAsImage}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-3 text-xs font-medium text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5" />
              이미지 저장
            </button>
            <button
              onClick={startMatching}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-3 text-xs font-medium text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors active:scale-[0.98]"
            >
              <Shuffle className="h-3.5 w-3.5" />
              다시 배치
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
