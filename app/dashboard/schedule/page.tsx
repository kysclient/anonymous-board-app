"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  RefreshCw,
  CalendarX,
  Navigation,
  ChevronRight,
  ChevronLeft,
  X,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleEvent {
  id: string;
  title: string;
  dateRaw: number;
  date: string;
  time: string;
  place: string;
  tag: string;
  capacity: number | null;
  joined: number;
  imageUrl: string;
  region: string;
  mapUrl: string | null;
}

interface GroupMeta {
  name: string;
  imageUrl: string;
  region: string;
  memberCount: number | null;
}

interface Member {
  id: string;
  name: string;
  imageUrl: string;
  isStaff: boolean;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function parseDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  return {
    day: d.getDate(),
    month: d.getMonth() + 1,
    weekday: WEEKDAYS[d.getDay()],
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
    diffDays,
    relative:
      diffDays === 0
        ? "오늘"
        : diffDays === 1
        ? "내일"
        : diffDays === 2
        ? "모레"
        : diffDays > 0
        ? `${diffDays}일 후`
        : null,
  };
}

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [group, setGroup] = useState<GroupMeta | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/somoim-schedule", { cache: "no-store" });
      const result: {
        success: boolean;
        data?: { events: ScheduleEvent[]; group: GroupMeta; members: Member[] };
        error?: string;
      } = await res.json();

      if (result.success && result.data) {
        setEvents(result.data.events);
        setGroup(result.data.group);
        setMembers(result.data.members ?? []);
      } else {
        setError(result.error || "일정을 가져올 수 없습니다.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Hero */}
      <header className="m3-card-feature relative overflow-hidden bg-md-tertiary-container p-7 sm:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-md-primary-container opacity-50" />
        <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-md-secondary-container opacity-60" />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="m3-pill m3-pill-primary">
              <CalendarDays className="h-3 w-3" />
              Schedule · 정모
            </span>
            {events.length > 0 && (
              <span className="m3-pill">
                <Clock className="h-3 w-3" />
                예정 {events.length}건
              </span>
            )}
          </div>

          <div className="flex items-start gap-4">
            {group?.imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={group.imageUrl}
                alt=""
                className="hidden h-16 w-16 shrink-0 rounded-2xl object-cover elev-2 sm:block"
              />
            )}
            <div className="space-y-2">
              <h1 className="type-display-medium text-md-on-tertiary-container">
                모임 일정
              </h1>
              <p className="type-body-large max-w-xl text-md-on-tertiary-container/85 font-bold">
                {group?.name || "SPICY"}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 type-label-large text-md-on-tertiary-container/75">
                {group?.region && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {group.region}
                  </span>
                )}
                {group?.memberCount != null && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    멤버 {group.memberCount.toLocaleString()}명
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchSchedule}
            disabled={loading}
            className="m3-pill inline-flex items-center gap-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            새로고침
          </button>

          {members.length > 0 && <MemberList members={members} />}
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-md-error-container px-5 py-4 type-body-medium text-md-on-error-container">
          {error}
        </div>
      )}

      {/* List */}
      <section className="space-y-3">
        {loading && events.length === 0 ? (
          <SkeletonList count={4} />
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          events.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </section>
    </div>
  );
}

function MemberList({ members }: { members: Member[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="rounded-3xl bg-md-surface/55 p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 type-title-small font-semibold text-md-on-tertiary-container">
          <Users className="h-4 w-4" />
          멤버 목록
        </span>
        <span className="m3-pill">{members.length.toLocaleString()}명</span>
      </div>

      <ul className="max-h-72 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {members.map((m, idx) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setActiveIdx(idx)}
              className="group flex w-full items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-md-surface/60"
            >
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-md-surface-container-highest">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.imageUrl}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <ZoomIn className="h-4 w-4 text-white" />
                </span>
              </span>
              <span className="type-body-medium truncate text-md-on-tertiary-container">
                {m.name}
              </span>
              {m.isStaff && (
                <span className="m3-pill m3-pill-primary ml-auto shrink-0">
                  운영진
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {activeIdx !== null && (
        <MemberPhotoModal
          members={members}
          index={activeIdx}
          onClose={() => setActiveIdx(null)}
          onIndexChange={setActiveIdx}
        />
      )}
    </div>
  );
}

function MemberPhotoModal({
  members,
  index,
  onClose,
  onIndexChange,
}: {
  members: Member[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const member = members[index];
  const isFirst = index === 0;
  const isLast = index === members.length - 1;

  useEffect(() => {
    setImgLoaded(false);
    setFailed(false);
  }, [index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      else if (e.key === "ArrowRight" && index < members.length - 1)
        onIndexChange(index + 1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [index, members.length, onClose, onIndexChange]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-m3-fade-in sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Top toolbar */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center justify-between gap-2 px-4 py-4 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 type-label-large text-white backdrop-blur">
          <span className="truncate max-w-[60vw]">{member.name}</span>
          {member.isStaff && (
            <span className="m3-pill m3-pill-primary">운영진</span>
          )}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Prev */}
      {!isFirst && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(index - 1);
          }}
          className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6 sm:flex"
          aria-label="이전"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next */}
      {!isLast && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(index + 1);
          }}
          className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6 sm:flex"
          aria-label="다음"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Photo */}
      <div
        className="relative flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {failed ? (
          <div className="flex h-64 w-64 flex-col items-center justify-center gap-3 rounded-3xl bg-white/10 text-white/70">
            <Users className="h-12 w-12" />
            <span className="type-body-medium">사진이 없어요</span>
          </div>
        ) : (
          <>
            {!imgLoaded && (
              <div className="absolute h-12 w-12 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={member.imageUrl}
              src={member.imageUrl}
              alt={member.name}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgLoaded(true);
                setFailed(true);
              }}
              className={cn(
                "max-h-[80vh] max-w-full rounded-3xl object-contain transition-opacity duration-300",
                imgLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: ScheduleEvent }) {
  const { day, weekday, isWeekend, relative, diffDays } = parseDate(event.date);
  const isToday = diffDays === 0;
  const isFull = event.capacity !== null && event.joined >= event.capacity;
  const ratio =
    event.capacity && event.capacity > 0
      ? Math.min(1, event.joined / event.capacity)
      : 0;
  const almostFull = !isFull && ratio >= 0.75;

  return (
    <article className="group relative flex gap-4 overflow-hidden rounded-3xl bg-md-surface-container-low p-4 elev-1 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:elev-3 sm:gap-5 sm:p-5">
      {/* Date block — Google Calendar style */}
      <div
        className={cn(
          "flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl py-3 text-center sm:w-[72px]",
          isToday
            ? "bg-md-primary text-md-on-primary"
            : isWeekend
            ? "bg-md-tertiary-container text-md-on-tertiary-container"
            : "bg-md-secondary-container text-md-on-secondary-container"
        )}
      >
        <span className="type-label-medium opacity-80">{weekday}</span>
        <span className="text-[28px] font-semibold leading-none tracking-tight">
          {day}
        </span>
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {relative && (
            <span
              className={cn(
                "m3-pill",
                isToday ? "m3-pill-primary" : "m3-pill-tertiary"
              )}
            >
              {relative}
            </span>
          )}
          {almostFull && (
            <span className="m3-pill m3-pill-error">마감임박</span>
          )}
          {isFull && <span className="m3-pill m3-pill-error">마감</span>}
        </div>

        <h3 className="type-title-medium line-clamp-1 font-semibold text-md-on-surface">
          {event.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 type-body-small text-md-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {event.time}
          </span>
          {event.place && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.place}
            </span>
          )}
        </div>

        {/* Capacity */}
        {event.capacity !== null && (
          <div className="flex items-center gap-2.5 pt-0.5">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-md-surface-container-highest">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isFull
                    ? "bg-md-error"
                    : almostFull
                    ? "bg-md-tertiary"
                    : "bg-md-primary"
                )}
                style={{ width: `${Math.max(8, ratio * 100)}%` }}
              />
            </div>
            <span className="inline-flex items-center gap-1 type-label-medium text-md-on-surface-variant">
              <Users className="h-3.5 w-3.5" />
              {event.joined}/{event.capacity}명
            </span>
          </div>
        )}

        {/* Map link */}
        {event.mapUrl && (
          <a
            href={event.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="m3-pill mt-1 inline-flex w-fit items-center gap-1.5 transition-opacity hover:opacity-80"
          >
            <Navigation className="h-3 w-3" />
            길찾기
            <ChevronRight className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Thumbnail */}
      {event.imageUrl && (
        <div className="relative hidden h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-md-surface-container-highest sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
    </article>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-3xl bg-md-surface-container-low p-4 elev-1 sm:gap-5 sm:p-5"
        >
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-md-surface-container-highest sm:w-[72px]" />
          <div className="flex flex-1 flex-col justify-center gap-2.5">
            <div className="h-3 w-16 animate-pulse rounded-full bg-md-surface-container-highest" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-md-surface-container-highest" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-md-surface-container-highest" />
          </div>
          <div className="hidden h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-md-surface-container-highest sm:block" />
        </div>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-md-surface-container-low py-16 text-center elev-1">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-md-surface-container-highest text-md-on-surface-variant">
        <CalendarX className="h-7 w-7" />
      </span>
      <p className="type-title-medium text-md-on-surface">
        예정된 일정이 없어요
      </p>
      <p className="type-body-medium text-md-on-surface-variant">
        새로운 벙이 올라오면 여기에 표시됩니다.
      </p>
    </div>
  );
}
