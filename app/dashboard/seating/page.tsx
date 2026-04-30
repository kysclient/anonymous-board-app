"use client";

import type React from "react";
import { useState, useRef } from "react";
import {
  Plus,
  X,
  Shuffle,
  Download,
  Users,
  Circle,
  Armchair,
  Sparkles,
  RectangleHorizontal,
} from "lucide-react";
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

const MALE = {
  bg: "rgb(var(--md-primary-container))",
  text: "rgb(var(--md-on-primary-container))",
  dot: "rgb(var(--md-primary))",
};
const FEMALE = {
  bg: "rgb(var(--md-tertiary-container))",
  text: "rgb(var(--md-on-tertiary-container))",
  dot: "rgb(var(--md-tertiary))",
};

/* ── Round table ── */
function RoundTable({ seats }: { seats: TableSeat[] }) {
  const count = seats.length;
  const baseRadius = Math.max(110, Math.min(180, count * 18));

  return (
    <div className="flex items-center justify-center py-6">
      <div
        className="relative"
        style={{
          width: `${baseRadius * 2 + 100}px`,
          height: `${baseRadius * 2 + 100}px`,
        }}
      >
        <div
          className="absolute rounded-full bg-md-surface-container-high"
          style={{
            width: `${baseRadius * 1.25}px`,
            height: `${baseRadius * 1.25}px`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: "var(--md-elev-1)",
          }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="type-label-medium uppercase text-md-on-surface-variant">
            Table
          </p>
          <p className="type-title-medium mt-0.5 text-md-on-surface">
            {count}석
          </p>
        </div>

        {seats.map((seat, i) => {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2;
          const x = Math.cos(angle) * baseRadius;
          const y = Math.sin(angle) * baseRadius;
          const palette = seat.gender === "male" ? MALE : FEMALE;

          return (
            <div
              key={seat.position}
              className="absolute animate-m3-fade-in"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: "translate(-50%, -50%)",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div
                className="flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 elev-1"
                style={{
                  background: palette.bg,
                  color: palette.text,
                }}
              >
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: palette.dot }}
                />
                <span className="type-label-large">{seat.participant}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Linear table ── */
function LinearTable({ seats }: { seats: TableSeat[] }) {
  const half = Math.ceil(seats.length / 2);
  const leftSeats = seats.filter((s) => s.position < half);
  const rightSeats = seats.filter((s) => s.position >= half);

  return (
    <div className="mx-auto flex max-w-2xl gap-4 py-6 sm:gap-6">
      <div className="flex-1 space-y-2">
        <p className="type-label-medium uppercase text-center text-md-on-surface-variant">
          좌
        </p>
        {leftSeats.map((seat, i) => (
          <div
            key={seat.position}
            className="animate-m3-fade-in"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <SeatChip seat={seat} index={seat.position} />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center px-1 sm:px-2">
        <div className="relative h-full w-px bg-md-outline-variant">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-md-surface-container-high elev-1">
              <span className="type-label-medium uppercase text-md-on-surface-variant">
                Table
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <p className="type-label-medium uppercase text-center text-md-on-surface-variant">
          우
        </p>
        {rightSeats.map((seat, i) => (
          <div
            key={seat.position}
            className="animate-m3-fade-in"
            style={{
              animationDelay: `${(i + leftSeats.length) * 70}ms`,
            }}
          >
            <SeatChip seat={seat} index={seat.position} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatChip({ seat, index }: { seat: TableSeat; index: number }) {
  const palette = seat.gender === "male" ? MALE : FEMALE;
  return (
    <div
      className="flex items-center gap-3 rounded-full px-4 py-2.5"
      style={{ background: palette.bg, color: palette.text }}
    >
      <span className="type-label-small w-5 flex-shrink-0 opacity-70">
        {(index + 1).toString().padStart(2, "0")}
      </span>
      <span
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ background: palette.dot }}
      />
      <span className="type-label-large truncate">{seat.participant}</span>
    </div>
  );
}

/* ── Page ── */
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

  const clearAll = () => {
    setParticipants([]);
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
    const females = shuffleArray(
      participants.filter((p) => p.gender === "female")
    );

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
        newSeats.push({
          participant: males[maleIdx].name,
          gender: "male",
          position: pos,
        });
        maleIdx++;
      } else if (selected === "female" && femaleIdx < females.length) {
        newSeats.push({
          participant: females[femaleIdx].name,
          gender: "female",
          position: pos,
        });
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
        backgroundColor: "#fdfbff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement("a");
      link.download = `자리배치_${new Date()
        .toLocaleDateString("ko-KR")
        .replace(/\./g, "")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      console.log("html2canvas not available");
    }
  };

  const resultMaleCount = tableSeats.filter((s) => s.gender === "male").length;
  const resultFemaleCount = tableSeats.filter(
    (s) => s.gender === "female"
  ).length;

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Hero */}
      <header className="m3-card-feature relative overflow-hidden bg-md-secondary-container p-7 sm:p-10">
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-md-tertiary-container opacity-50" />
        <div className="relative space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="m3-pill m3-pill-primary">
              <Armchair className="h-3 w-3" />
              Seating · v2
            </span>
            <span className="m3-pill">
              <Sparkles className="h-3 w-3" />
              Auto balance
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="type-display-medium text-md-on-secondary-container">
              자리 배치
            </h1>
            <p className="type-body-large max-w-xl text-md-on-secondary-container/85">
              이름과 성별을 입력하면 같은 성별이 3명 이상 연속되지 않게 알아서
              섞어 줍니다. 일자형·원형으로 미리보고 이미지로 저장하세요.
            </p>
          </div>
        </div>
      </header>

      {/* Input section */}
      <section className="m3-card-elevated p-6 sm:p-7">
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="type-label-medium uppercase text-md-primary">
              Add member
            </p>
            <h2 className="type-title-large text-md-on-surface">참가자 추가</h2>
            <p className="type-body-medium text-md-on-surface-variant">
              한 명씩 추가하세요. 최대 50명까지 가능합니다.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            {/* Gender segmented */}
            <div className="m3-segmented self-start">
              <button
                type="button"
                onClick={() => setNewGender("male")}
                data-selected={newGender === "male"}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: MALE.dot }}
                />
                남
              </button>
              <button
                type="button"
                onClick={() => setNewGender("female")}
                data-selected={newGender === "female"}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: FEMALE.dot }}
                />
                여
              </button>
            </div>

            {/* Search-style input */}
            <div className="m3-search flex-1 min-w-0">
              <Users className="h-5 w-5 text-md-on-surface-variant flex-shrink-0" />
              <input
                type="text"
                placeholder="이름 입력 후 Enter"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={20}
                className="min-w-0"
              />
            </div>

            <button
              type="button"
              onClick={addParticipant}
              disabled={!newName.trim() || participants.length >= 50}
              className="m3-btn m3-btn-filled self-stretch sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              추가
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="m3-chip">
              <Users className="h-3.5 w-3.5" />
              {participants.length} / 50
            </span>
            <span className="m3-chip">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: MALE.dot }}
              />
              남 {maleCount}
            </span>
            <span className="m3-chip">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: FEMALE.dot }}
              />
              여 {femaleCount}
            </span>
            {participants.length < 2 && (
              <span className="m3-pill m3-pill-error">최소 2명 필요</span>
            )}
          </div>
        </div>
      </section>

      {/* Participants */}
      {participants.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="type-label-medium uppercase text-md-primary">
                Participants
              </p>
              <h2 className="type-title-large text-md-on-surface">
                참가자 {participants.length}명
              </h2>
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="m3-btn m3-btn-text"
            >
              모두 지우기
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const palette = p.gender === "male" ? MALE : FEMALE;
              return (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-2 rounded-full pl-3 pr-1 py-1.5"
                  style={{ background: palette.bg, color: palette.text }}
                >
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: palette.dot }}
                  />
                  <span className="type-label-large">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => removeParticipant(p.id)}
                    className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                    aria-label={`${p.name} 삭제`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Start FAB-style button */}
      {participants.length >= 2 && (
        <button
          type="button"
          onClick={startMatching}
          disabled={isMatching}
          className="m3-btn m3-btn-filled w-full h-14 text-[15px] elev-2"
        >
          {isMatching ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
        <div className="m3-card-filled flex flex-col items-center justify-center gap-3 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-md-primary-container">
            <Users className="h-6 w-6 text-md-on-primary-container" />
          </div>
          <div className="space-y-1 text-center">
            <p className="type-title-medium text-md-on-surface">
              참가자를 추가해 주세요
            </p>
            <p className="type-body-medium text-md-on-surface-variant">
              최소 2명부터 자리를 배치할 수 있어요
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && tableSeats.length > 0 && (
        <section className="space-y-5 animate-m3-fade-in">
          <div ref={resultsRef} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="type-label-medium uppercase text-md-primary">
                  Result
                </p>
                <h2 className="type-headline-small text-md-on-surface">
                  배치 결과
                </h2>
                <p className="type-body-medium mt-1 text-md-on-surface-variant">
                  총 {tableSeats.length}명 · 남 {resultMaleCount} · 여{" "}
                  {resultFemaleCount}
                </p>
              </div>

              <div className="m3-segmented self-start sm:self-end">
                <button
                  type="button"
                  onClick={() => setTableShape("linear")}
                  data-selected={tableShape === "linear"}
                >
                  <RectangleHorizontal className="h-3.5 w-3.5" />
                  일자
                </button>
                <button
                  type="button"
                  onClick={() => setTableShape("round")}
                  data-selected={tableShape === "round"}
                >
                  <Circle className="h-3.5 w-3.5" />
                  원형
                </button>
              </div>
            </div>

            <div className="m3-card-elevated overflow-x-auto p-4 sm:p-8">
              {tableShape === "round" ? (
                <RoundTable seats={tableSeats} />
              ) : (
                <LinearTable seats={tableSeats} />
              )}

              <div className="mt-4 flex items-center justify-center gap-4 border-t border-md-outline-variant pt-4">
                <span className="m3-chip">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: MALE.dot }}
                  />
                  남 {resultMaleCount}명
                </span>
                <span className="m3-chip">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: FEMALE.dot }}
                  />
                  여 {resultFemaleCount}명
                </span>
              </div>
            </div>

            <div className="m3-card-elevated p-6 sm:p-7">
              <p className="type-label-medium uppercase mb-4 text-md-primary">
                Seat order
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
                {tableSeats.map((seat, i) => {
                  const palette = seat.gender === "male" ? MALE : FEMALE;
                  return (
                    <div
                      key={seat.position}
                      className="m3-list-item gap-3 px-3 py-2"
                    >
                      <span className="type-label-small w-5 flex-shrink-0 text-md-on-surface-variant">
                        {(i + 1).toString().padStart(2, "0")}
                      </span>
                      <span
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ background: palette.dot }}
                      />
                      <span className="type-body-medium truncate text-md-on-surface">
                        {seat.participant}
                      </span>
                      {tableShape === "linear" && (
                        <span className="type-label-small ml-auto flex-shrink-0 text-md-on-surface-variant">
                          {seat.position < Math.ceil(tableSeats.length / 2)
                            ? "L"
                            : "R"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={downloadAsImage}
              className="m3-btn m3-btn-tonal h-12"
            >
              <Download className="h-4 w-4" />
              이미지 저장
            </button>
            <button
              type="button"
              onClick={startMatching}
              className="m3-btn m3-btn-outlined h-12"
            >
              <Shuffle className="h-4 w-4" />
              다시 배치
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
