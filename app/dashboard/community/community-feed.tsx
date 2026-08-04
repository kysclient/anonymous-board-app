"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crown,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SomoimEvent = {
  id: string;
  title: string;
  dateRaw: number;
  date: string;
  time: string;
  place: string;
  tag: string;
  imageUrl: string;
  region: string;
  mapUrl: string | null;
};

type SomoimGroup = {
  name: string;
  imageUrl: string;
};

type LocalMember = {
  id: number;
  name: string;
  profile_image: string | null;
  is_regular: string;
};

type ParticipantRow = {
  event_id: string;
  event_title: string;
  event_date: string;
  user_id: number;
  user_name: string;
  user_image_url: string | null;
  is_organizer: boolean;
  attended: boolean;
  /** 일정 날짜가 되어 출석으로 확정되고 벙 횟수에 반영된 시각 */
  settled_at: string | null;
  created_at: string;
  updated_at: string;
};

type CommunityStats = {
  member_count: number;
  participant_count: number;
  attendance_count: number;
  organizer_count: number;
  managed_event_count: number;
};

type ScheduleResponse = {
  success: boolean;
  data?: {
    events: SomoimEvent[];
    group: SomoimGroup;
  };
  error?: string;
};

type CommunityResponse = {
  success: boolean;
  data?: {
    participants: ParticipantRow[];
    members: LocalMember[];
    stats: CommunityStats;
  };
  error?: string;
};

type SortMode = "upcoming" | "popular";

const EMPTY_GROUP: SomoimGroup = {
  name: "SPICY",
  imageUrl: "",
};

const EMPTY_STATS: CommunityStats = {
  member_count: 0,
  participant_count: 0,
  attendance_count: 0,
  organizer_count: 0,
  managed_event_count: 0,
};

export function CommunityFeed({ isAdmin }: { isAdmin: boolean }) {
  const [events, setEvents] = useState<SomoimEvent[]>([]);
  const [group, setGroup] = useState<SomoimGroup>(EMPTY_GROUP);
  const [localMembers, setLocalMembers] = useState<LocalMember[]>([]);
  const [participants, setParticipants] = useState<
    Record<string, ParticipantRow[]>
  >({});
  const [stats, setStats] = useState<CommunityStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSerial, setRefreshSerial] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("upcoming");
  const [activeEvent, setActiveEvent] = useState<SomoimEvent | null>(null);
  const [plannedIds, setPlannedIds] = useState<Set<number>>(new Set());
  const [attendedIds, setAttendedIds] = useState<Set<number>>(new Set());
  const [organizerId, setOrganizerId] = useState<number | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let ignore = false;

    async function loadFeed() {
      if (refreshSerial === 0) setLoading(true);
      else setRefreshing(true);
      setError("");

      try {
        const [scheduleResponse, communityResponse] = await Promise.all([
          fetch(`/api/somoim-schedule?refresh=${refreshSerial}`, {
            cache: "no-store",
          }),
          fetch("/api/community-attendance", { cache: "no-store" }),
        ]);
        const [schedule, community] = (await Promise.all([
          scheduleResponse.json(),
          communityResponse.json(),
        ])) as [ScheduleResponse, CommunityResponse];

        if (!scheduleResponse.ok || !schedule.success || !schedule.data) {
          throw new Error(schedule.error || "소모임 일정을 불러오지 못했습니다.");
        }
        if (!communityResponse.ok || !community.success || !community.data) {
          throw new Error(
            community.error || "모임 정보를 불러오지 못했습니다."
          );
        }
        if (ignore) return;

        setEvents(schedule.data.events ?? []);
        setGroup(schedule.data.group ?? EMPTY_GROUP);
        setLocalMembers(community.data.members ?? []);
        setParticipants(groupParticipants(community.data.participants ?? []));
        setStats(community.data.stats ?? EMPTY_STATS);
        setLastSyncedAt(new Date());
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "모임 피드를 불러오지 못했습니다."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadFeed();
    return () => {
      ignore = true;
    };
  }, [refreshSerial]);

  const visibleEvents = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    const filtered = keyword
      ? events.filter((event) =>
          [event.title, event.place, event.tag, event.region].some((value) =>
            value?.toLocaleLowerCase("ko-KR").includes(keyword)
          )
        )
      : [...events];

    return filtered.sort((a, b) =>
      sortMode === "popular"
        ? (participants[b.id]?.length ?? 0) -
            (participants[a.id]?.length ?? 0) ||
          a.dateRaw - b.dateRaw
        : a.dateRaw - b.dateRaw
    );
  }, [events, participants, query, sortMode]);

  const upcomingEvents = useMemo(
    () =>
      [...events]
        .filter((event) => daysFromToday(event.date) >= 0)
        .sort((a, b) => a.dateRaw - b.dateRaw)
        .slice(0, 4),
    [events]
  );

  const filteredMembers = useMemo(() => {
    const keyword = memberQuery.trim().toLocaleLowerCase("ko-KR");
    if (!keyword) return localMembers;
    return localMembers.filter((member) =>
      member.name.toLocaleLowerCase("ko-KR").includes(keyword)
    );
  }, [localMembers, memberQuery]);

  const selectedOrganizer = useMemo(
    () => localMembers.find((member) => member.id === organizerId) ?? null,
    [localMembers, organizerId]
  );

  function refreshSomoim() {
    if (refreshing) return;
    setRefreshSerial((current) => current + 1);
  }

  function openAttendance(event: SomoimEvent) {
    const rows = participants[event.id] ?? [];
    setActiveEvent(event);
    setPlannedIds(new Set(rows.map((row) => row.user_id)));
    setAttendedIds(
      new Set(rows.filter((row) => row.attended).map((row) => row.user_id))
    );
    setOrganizerId(rows.find((row) => row.is_organizer)?.user_id ?? null);
    setMemberQuery("");
  }

  function togglePlanned(memberId: number) {
    if (!isAdmin) return;
    setPlannedIds((current) => {
      const next = new Set(current);
      if (next.has(memberId)) {
        next.delete(memberId);
        setAttendedIds((attended) => {
          const nextAttended = new Set(attended);
          nextAttended.delete(memberId);
          return nextAttended;
        });
        setOrganizerId((currentOrganizer) =>
          currentOrganizer === memberId ? null : currentOrganizer
        );
      } else {
        next.add(memberId);
        // 이미 날짜가 된 일정은 저장 즉시 출석으로 확정된다.
        if (isDueEvent(activeEvent)) {
          setAttendedIds((attended) => new Set(attended).add(memberId));
        }
      }
      return next;
    });
  }

  function toggleAttended(memberId: number) {
    if (!isAdmin) return;
    setPlannedIds((current) => new Set(current).add(memberId));
    setAttendedIds((current) => {
      const next = new Set(current);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  function changeOrganizer(value: string) {
    const nextOrganizerId = value ? Number(value) : null;
    setOrganizerId(nextOrganizerId);
    if (nextOrganizerId !== null) {
      setPlannedIds((current) => new Set(current).add(nextOrganizerId));
      if (isDueEvent(activeEvent)) {
        setAttendedIds((current) => new Set(current).add(nextOrganizerId));
      }
    }
  }

  function resetSelection() {
    setPlannedIds(new Set());
    setAttendedIds(new Set());
    setOrganizerId(null);
  }

  async function saveAttendance() {
    if (!activeEvent || !isAdmin) return;
    const due = isDueEvent(activeEvent);
    setSaving(true);
    try {
      const response = await fetch("/api/community-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            id: activeEvent.id,
            title: activeEvent.title,
            date: activeEvent.date,
          },
          participantIds: [...plannedIds],
          attendedIds: [...attendedIds],
          organizerId,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "참여·출석 저장에 실패했습니다.");
      }

      const savedRows = (result.data.participants ?? []) as ParticipantRow[];
      setParticipants((current) => ({
        ...current,
        [activeEvent.id]: savedRows,
      }));
      setStats(result.data.stats ?? EMPTY_STATS);
      setActiveEvent(null);
      toast({
        title: `${plannedIds.size}명 참여 정보 저장 완료`,
        description: due
          ? `출석 확정 ${
              savedRows.filter((row) => row.settled_at && row.attended).length
            }명 · 벙주 ${selectedOrganizer?.name ?? "미지정"} · 벙 횟수 반영됨`
          : `벙주 ${
              selectedOrganizer?.name ?? "미지정"
            } · 벙 횟수는 ${formatShortDate(activeEvent.date)}에 반영됩니다`,
      });
    } catch (saveError) {
      toast({
        title: "참여 정보를 저장하지 못했습니다",
        description:
          saveError instanceof Error
            ? saveError.message
            : "잠시 후 다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function shareEvent(event: SomoimEvent) {
    const text = `${event.title} · ${formatFullDate(event.date)} ${event.time} · ${event.place}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "일정이 클립보드에 복사되었습니다." });
      }
    } catch (shareError) {
      if ((shareError as Error)?.name !== "AbortError") {
        toast({ title: "공유하지 못했습니다.", variant: "destructive" });
      }
    }
  }

  if (loading) return <FeedSkeleton />;

  const activeRows = participants[activeEvent?.id ?? ""] ?? [];
  const activeEventDue = isDueEvent(activeEvent);

  return (
    <div className="mx-auto min-h-[calc(100vh-8rem)] max-w-[1120px]">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-md-on-surface-variant" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="일정, 장소, 태그 검색"
                className="h-11 w-full rounded-full border border-transparent bg-md-surface-container-lowest pl-11 pr-10 text-[14px] text-md-on-surface outline-none transition focus:border-md-outline focus:bg-md-surface"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="검색어 지우기"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-md-on-surface-variant hover:bg-md-surface-container-high"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full bg-md-surface-container-lowest p-1">
                <SortButton
                  active={sortMode === "upcoming"}
                  onClick={() => setSortMode("upcoming")}
                >
                  최신 일정
                </SortButton>
                <SortButton
                  active={sortMode === "popular"}
                  onClick={() => setSortMode("popular")}
                >
                  참여 많은 순
                </SortButton>
              </div>
              <button
                type="button"
                onClick={refreshSomoim}
                disabled={refreshing}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-md-outline-variant bg-md-surface px-4 text-[12px] font-semibold text-md-on-surface transition hover:bg-md-surface-container-lowest active:scale-[0.98] disabled:opacity-60"
              >
                <RefreshCw
                  className={cn("h-4 w-4", refreshing && "animate-spin")}
                />
                <span className="hidden md:inline">
                  {refreshing ? "불러오는 중" : "소모임 새로고침"}
                </span>
                <span className="md:hidden">
                  {refreshing ? "로딩" : "새로고침"}
                </span>
              </button>
            </div>
          </div>

          {error ? (
            <EmptyState
              title="피드를 불러오지 못했어요"
              description={error}
              action={
                <button
                  type="button"
                  onClick={refreshSomoim}
                  className="mt-5 rounded-full bg-spicy px-5 py-2.5 text-[13px] font-semibold text-white"
                >
                  다시 불러오기
                </button>
              }
            />
          ) : visibleEvents.length === 0 ? (
            <EmptyState
              title="조건에 맞는 일정이 없어요"
              description="다른 검색어로 다시 찾아보세요."
            />
          ) : (
            <div className="divide-y divide-md-outline-variant/75 border-y border-md-outline-variant/75">
              {visibleEvents.map((event) => {
                const eventRows = participants[event.id] ?? [];
                const attendedCount = eventRows.filter(
                  (row) => row.attended && row.settled_at
                ).length;
                const organizer = eventRows.find((row) => row.is_organizer);

                return (
                  <article
                    key={event.id}
                    id={`event-${event.id}`}
                    className="group px-1 py-5 transition-colors sm:px-4 sm:py-6 sm:hover:bg-md-on-surface/[0.018]"
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar
                        src={group.imageUrl}
                        name={group.name || "SPICY"}
                        className="mt-0.5 h-8 w-8"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-md-on-surface-variant">
                          <span className="truncate font-semibold text-md-on-surface">
                            m/{group.name || "SPICY"}
                          </span>
                          <span>·</span>
                          <span className="shrink-0">일정 봇</span>
                          <span>·</span>
                          <span className="shrink-0">
                            {relativeDate(event.date)}
                          </span>
                          <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-md-surface-container-high px-2 py-1 font-medium text-md-on-surface">
                            자동 작성
                          </span>
                        </div>

                        <h2 className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.025em] text-md-on-surface sm:text-[21px]">
                          {event.title}
                        </h2>
                        <p className="mt-2 text-[14px] leading-6 text-md-on-surface-variant">
                          {formatFullDate(event.date)} {event.time},{" "}
                          {event.place || event.region || "장소 협의"}에서 만나요.{" "}
                          {eventRows.length > 0
                            ? `참여 예정 ${eventRows.length}명입니다.`
                            : "아직 등록된 참여 예정 멤버가 없어요."}
                          {organizer ? ` · 벙주 ${organizer.user_name}` : ""}
                          {cleanEventTag(event.tag)
                            ? ` · ${cleanEventTag(event.tag)}`
                            : ""}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-medium text-md-on-surface-variant">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-md-surface-container-lowest px-3 py-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatShortDate(event.date)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-md-surface-container-lowest px-3 py-1.5">
                            <Clock3 className="h-3.5 w-3.5" /> {event.time}
                          </span>
                          {(event.place || event.region) && (
                            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-md-surface-container-lowest px-3 py-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="max-w-[250px] truncate">
                                {event.place || event.region}
                              </span>
                            </span>
                          )}
                          {organizer && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
                              <Crown className="h-3.5 w-3.5" /> 벙주{" "}
                              {organizer.user_name}
                            </span>
                          )}
                        </div>

                        {eventRows.length > 0 && (
                          <div className="mt-3.5">
                            <p className="text-[11px] font-semibold text-md-on-surface-variant">
                              참여 예정 {eventRows.length}명
                              {attendedCount > 0
                                ? ` · 출석 확정 ${attendedCount}명`
                                : ""}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {eventRows.map((row) => (
                                <ParticipantChip key={row.user_id} row={row} />
                              ))}
                            </div>
                          </div>
                        )}

                        {event.imageUrl && (
                          <div className="mt-4 overflow-hidden rounded-2xl border border-md-outline-variant/75 bg-md-surface-container-lowest">
                            <img
                              src={event.imageUrl}
                              alt={`${event.title} 일정 이미지`}
                              className="max-h-[460px] w-full object-cover"
                            />
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <ActionButton onClick={() => openAttendance(event)}>
                            <UserCheck className="h-4 w-4" />
                            참여 예정 {eventRows.length} · 출석 {attendedCount}
                          </ActionButton>
                          {event.mapUrl && (
                            <a
                              href={event.mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-md-surface-container-high px-3.5 text-[13px] font-medium text-md-on-surface transition hover:bg-md-surface-container-highest"
                            >
                              <MapPin className="h-4 w-4" /> 지도
                            </a>
                          )}
                          <ActionButton onClick={() => shareEvent(event)}>
                            <Share2 className="h-4 w-4" /> 공유
                          </ActionButton>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => openAttendance(event)}
                              className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-spicy px-4 text-[13px] font-semibold text-white transition hover:bg-spicy-bright active:scale-[0.98]"
                            >
                              <ShieldCheck className="h-4 w-4" /> 출석 관리
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        <aside className="sticky top-24 hidden space-y-4 xl:block">
          <RightCard title="다가오는 일정" icon={<CalendarDays />}>
            {upcomingEvents.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-md-on-surface-variant">
                예정된 일정이 없습니다.
              </p>
            ) : (
              <div className="divide-y divide-md-outline-variant/70">
                {upcomingEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(`event-${event.id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                    className="block w-full py-3 text-left"
                  >
                    <p className="text-[11px] font-semibold text-spicy">
                      {dDayLabel(event.date)} · {formatShortDate(event.date)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[14px] font-semibold leading-5 text-md-on-surface">
                      {event.title}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-md-on-surface-variant">
                      {event.place || event.region || "장소 협의"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </RightCard>

          <RightCard title="모임 현황" icon={<Users />}>
            <dl className="grid grid-cols-3 gap-2 py-2 text-center">
              <Stat value={stats.member_count} label="우리 멤버" />
              <Stat value={stats.participant_count} label="참여 예정" />
              <Stat value={stats.attendance_count} label="출석 기록" />
            </dl>
            <p className="mt-3 rounded-xl bg-md-surface-container-lowest px-3 py-2.5 text-[12px] leading-5 text-md-on-surface-variant">
              관리 일정 {stats.managed_event_count}개 · 벙주 기록{" "}
              {stats.organizer_count}회
            </p>
            <p className="mt-2 text-center text-[11px] text-md-on-surface-variant">
              소모임 연동 일정 {events.length}개
              {lastSyncedAt
                ? ` · ${lastSyncedAt.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} 갱신`
                : ""}
            </p>
          </RightCard>
        </aside>
      </div>

      <Dialog
        open={Boolean(activeEvent)}
        onOpenChange={(open) => !open && !saving && setActiveEvent(null)}
      >
        <DialogContent className="flex max-h-[90vh] max-w-[760px] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-md-outline-variant px-5 py-5 pr-12 text-left sm:px-6">
            <div className="flex items-center gap-2">
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-spicy-container px-2 py-1 text-[11px] font-semibold text-on-spicy-container">
                  <ShieldCheck className="h-3 w-3" /> 출석 관리
                </span>
              )}
              <span className="text-[12px] text-md-on-surface-variant">
                {activeEvent ? formatFullDate(activeEvent.date) : ""}
              </span>
            </div>
            <DialogTitle className="mt-2 text-[21px] leading-tight">
              {activeEvent?.title}
            </DialogTitle>
            <DialogDescription>
              {isAdmin
                ? "멤버를 참여 예정에 추가하고, 실제 출석과 벙주를 지정하세요."
                : "등록된 참여 예정·출석 정보입니다."}
            </DialogDescription>
            {isAdmin && (
              <p
                className={cn(
                  "mt-3 rounded-xl px-3 py-2.5 text-[12px] leading-5",
                  activeEventDue
                    ? "bg-emerald-50 text-emerald-900"
                    : "bg-md-surface-container-lowest text-md-on-surface-variant"
                )}
              >
                {activeEventDue
                  ? "일정 날짜가 지났습니다. 저장하면 참여 예정 멤버가 출석으로 확정되고 벙 횟수·마지막 모임일에 바로 반영됩니다. 불참자는 참여 예정에서 빼주세요."
                  : "일정 날짜가 되면 참여 예정 멤버는 자동으로 출석 처리되고 벙 횟수·마지막 모임일에 반영됩니다. 지금 저장하는 내용은 아직 카운터에 반영되지 않습니다."}
              </p>
            )}
          </DialogHeader>

          {isAdmin && (
            <div className="space-y-3 border-b border-md-outline-variant bg-md-surface-container-lowest px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="relative min-w-0 flex-1">
                  <Crown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
                  <select
                    value={organizerId ?? ""}
                    onChange={(event) => changeOrganizer(event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-md-outline-variant bg-md-surface pl-10 pr-10 text-[13px] font-medium text-md-on-surface outline-none focus:border-spicy"
                  >
                    <option value="">벙주 미지정</option>
                    {localMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-md-on-surface-variant" />
                </label>
                <p className="text-[11px] text-md-on-surface-variant sm:max-w-[235px]">
                  벙주로 지정하면 참여 예정에도 자동 추가됩니다.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-md-on-surface-variant" />
                  <input
                    value={memberQuery}
                    onChange={(event) => setMemberQuery(event.target.value)}
                    placeholder="우리 멤버 이름 검색"
                    className="h-10 w-full rounded-full border border-md-outline-variant bg-md-surface pl-10 pr-4 text-[13px] outline-none focus:border-md-outline"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const everyone = new Set(
                      localMembers.map((member) => member.id)
                    );
                    setPlannedIds(everyone);
                    if (isDueEvent(activeEvent)) setAttendedIds(new Set(everyone));
                  }}
                  className="h-9 shrink-0 rounded-full px-3 text-[12px] font-medium text-md-on-surface hover:bg-md-surface-container-high"
                >
                  전체 참여
                </button>
                <button
                  type="button"
                  onClick={resetSelection}
                  className="h-9 shrink-0 rounded-full px-3 text-[12px] font-medium text-md-on-surface-variant hover:bg-md-surface-container-high"
                >
                  초기화
                </button>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            {isAdmin ? (
              filteredMembers.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {filteredMembers.map((member) => {
                    const planned = plannedIds.has(member.id);
                    const attended = attendedIds.has(member.id);
                    const organizer = organizerId === member.id;

                    return (
                      <div
                        key={member.id}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2 transition",
                          planned
                            ? "border-spicy/45 bg-spicy-container/55"
                            : "border-transparent bg-md-surface-container-lowest"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => togglePlanned(member.id)}
                          aria-pressed={planned}
                          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 text-left"
                        >
                          <Avatar
                            src={member.profile_image ?? ""}
                            name={member.name}
                            className="h-9 w-9"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1 truncate text-[14px] font-medium text-md-on-surface">
                              <span className="truncate">{member.name}</span>
                              {organizer && (
                                <Crown className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                              )}
                            </span>
                            <span className="block text-[11px] text-md-on-surface-variant">
                              {member.is_regular || "모임 멤버"}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              planned
                                ? "border-spicy bg-spicy text-white"
                                : "border-md-outline-variant bg-md-surface"
                            )}
                          >
                            {planned && <Check className="h-3.5 w-3.5" />}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAttended(member.id)}
                          aria-pressed={attended}
                          className={cn(
                            "h-8 shrink-0 rounded-full px-2.5 text-[11px] font-semibold transition",
                            attended
                              ? "bg-emerald-600 text-white"
                              : "border border-md-outline-variant bg-md-surface text-md-on-surface-variant hover:text-md-on-surface"
                          )}
                        >
                          {attended ? "출석 완료" : "출석"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-12 text-center text-[13px] text-md-on-surface-variant">
                  검색된 우리 멤버가 없습니다.
                </p>
              )
            ) : activeRows.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {activeRows.map((row) => (
                  <div
                    key={row.user_id}
                    className="flex items-center gap-2.5 rounded-xl bg-md-surface-container-lowest p-3"
                  >
                    <Avatar
                      src={row.user_image_url ?? ""}
                      name={row.user_name}
                      className="h-9 w-9"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 truncate text-[13px] font-medium text-md-on-surface">
                        <span className="truncate">{row.user_name}</span>
                        {row.is_organizer && (
                          <Crown className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        )}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {row.is_organizer && (
                          <StatusBadge tone="amber">벙주</StatusBadge>
                        )}
                        <StatusBadge
                          tone={
                            row.settled_at && row.attended
                              ? "green"
                              : row.settled_at
                              ? "red"
                              : "gray"
                          }
                        >
                          {row.settled_at && row.attended
                            ? "출석 확정"
                            : row.settled_at
                            ? "불참"
                            : "참여 예정"}
                        </StatusBadge>
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="mx-auto h-7 w-7 text-md-on-surface-variant/60" />
                <p className="mt-3 text-[14px] font-medium text-md-on-surface">
                  아직 등록된 참여 멤버가 없어요
                </p>
                <p className="mt-1 text-[12px] text-md-on-surface-variant">
                  관리자가 멤버를 참여 예정에 추가할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between gap-4 border-t border-md-outline-variant bg-md-surface px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-md-on-surface">
                  {plannedIds.size}명 참여 예정 · {attendedIds.size}명 출석
                </p>
                <p className="truncate text-[11px] text-md-on-surface-variant">
                  벙주 {selectedOrganizer?.name ?? "미지정"} ·{" "}
                  {activeEventDue ? "저장 시 벙 횟수 반영" : "일정 날짜에 벙 횟수 반영"}
                </p>
              </div>
              <button
                type="button"
                onClick={saveAttendance}
                disabled={saving}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-spicy px-5 text-[13px] font-semibold text-white transition hover:bg-spicy-bright active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {saving ? "저장 중" : "참여·출석 저장"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** 일정 날짜가 됐거나 지난 일정 — 저장 시 곧바로 출석으로 확정된다. */
function isDueEvent(event: SomoimEvent | null) {
  return event ? daysFromToday(event.date) <= 0 : false;
}

function groupParticipants(rows: ParticipantRow[]) {
  return rows.reduce<Record<string, ParticipantRow[]>>((groups, row) => {
    (groups[row.event_id] ??= []).push(row);
    return groups;
  }, {});
}

function Avatar({
  src,
  name,
  className,
}: {
  src: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-red-600 text-xs font-bold text-white",
        className
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        name.trim().charAt(0).toUpperCase() || "S"
      )}
    </span>
  );
}

function ParticipantChip({ row }: { row: ParticipantRow }) {
  const confirmed = Boolean(row.settled_at) && row.attended;
  const absent = Boolean(row.settled_at) && !row.attended;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-[12px] font-medium",
        row.is_organizer
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : confirmed
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : absent
          ? "border-md-outline-variant bg-md-surface text-md-on-surface-variant line-through"
          : "border-md-outline-variant bg-md-surface text-md-on-surface"
      )}
    >
      <Avatar
        src={row.user_image_url ?? ""}
        name={row.user_name}
        className="h-5 w-5 text-[9px]"
      />
      <span className="truncate">{row.user_name}</span>
      {row.is_organizer && <Crown className="h-3 w-3 shrink-0" />}
      {confirmed && !row.is_organizer && (
        <Check className="h-3 w-3 shrink-0 text-emerald-600" />
      )}
    </span>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-[12px] font-semibold transition",
        active
          ? "bg-md-surface text-md-on-surface elev-1"
          : "text-md-on-surface-variant hover:text-md-on-surface"
      )}
    >
      {children}
      {active && <ChevronDown className="h-3.5 w-3.5" />}
    </button>
  );
}

function ActionButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-md-surface-container-high px-3.5 text-[13px] font-medium text-md-on-surface transition hover:bg-md-surface-container-highest"
    >
      {children}
    </button>
  );
}

function RightCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-md-surface-container-lowest p-4">
      <div className="flex items-center gap-2 text-md-on-surface">
        <span className="text-md-on-surface-variant [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        <h2 className="text-[14px] font-semibold">{title}</h2>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="text-[11px] text-md-on-surface-variant">{label}</dt>
      <dd className="mt-1 text-[20px] font-semibold tabular-nums text-md-on-surface">
        {value.toLocaleString("ko-KR")}
      </dd>
    </div>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: "amber" | "green" | "gray" | "red";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        tone === "amber" && "bg-amber-100 text-amber-800",
        tone === "green" && "bg-emerald-100 text-emerald-800",
        tone === "red" && "bg-rose-100 text-rose-800",
        tone === "gray" &&
          "bg-md-surface-container-high text-md-on-surface-variant"
      )}
    >
      {children}
    </span>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-md-outline-variant bg-md-surface py-20 text-center">
      <CalendarDays className="mx-auto h-8 w-8 text-md-on-surface-variant/60" />
      <p className="mt-4 text-[15px] font-semibold text-md-on-surface">{title}</p>
      <p className="mx-auto mt-1 max-w-md px-6 text-[13px] text-md-on-surface-variant">
        {description}
      </p>
      {action}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="mx-auto max-w-[1120px] animate-pulse">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <div className="h-11 rounded-full bg-md-surface-container-high" />
          {[0, 1, 2].map((item) => (
            <div key={item} className="border-t border-md-outline-variant py-6">
              <div className="h-3 w-52 rounded bg-md-surface-container-high" />
              <div className="mt-4 h-6 w-4/5 rounded bg-md-surface-container-high" />
              <div className="mt-3 h-4 w-full rounded bg-md-surface-container-high" />
              <div className="mt-2 h-4 w-2/3 rounded bg-md-surface-container-high" />
            </div>
          ))}
        </div>
        <div className="hidden h-80 rounded-2xl bg-md-surface-container-high xl:block" />
      </div>
    </div>
  );
}

function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysFromToday(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseLocalDate(date).getTime() - today.getTime()) / 86400000);
}

function dDayLabel(date: string) {
  const days = daysFromToday(date);
  if (days === 0) return "오늘";
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
}

function relativeDate(date: string) {
  const days = daysFromToday(date);
  if (days === 0) return "오늘";
  if (days === 1) return "내일";
  if (days > 1) return `${days}일 후`;
  if (days === -1) return "어제";
  return `${Math.abs(days)}일 전`;
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(parseLocalDate(date));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(parseLocalDate(date));
}

function cleanEventTag(tag: string) {
  const cleaned = tag.replace(/(?:\\n|\/n|\r?\n)+/gi, " ").trim();
  return cleaned.length > 1 ? cleaned : "";
}
