import { formatDateString } from "@/lib/utils";
import {
  Users,
  Trophy,
  TrendingUp,
  UserPlus,
  AlertCircle,
  Crown,
  Activity,
  Flame,
} from "lucide-react";
import { getUsers } from "./actions";
import CopyButton from "@/components/copy-button";
import MastersStrip from "@/components/masters-strip";
import LiveActivityFeed, {
  type FeedItem,
} from "@/components/dashboard/live-activity-feed";
import ActivityHeatmap from "@/components/dashboard/activity-heatmap";
import FeatureCards from "@/components/dashboard/feature-cards";
import HqArt from "@/components/dashboard/hq-art";

export const revalidate = 0;

const DAY_MS = 86_400_000;

/** Local calendar key YYYY-MM-DD (avoids UTC off-by-one for heatmap). */
function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const users = await getUsers();

  const now = new Date();
  const kstHour = (now.getUTCHours() + 9) % 24;
  const greeting =
    kstHour < 6
      ? "Good night"
      : kstHour < 12
        ? "Good morning"
        : kstHour < 18
          ? "Good afternoon"
          : "Good evening";

  /* ── KPIs ──────────────────────────────────────────────── */
  const totalUsers = users.length;
  const totalMeetups = users.reduce((sum, u) => sum + u.meetup_count, 0);
  const averageMeetups =
    totalUsers > 0 ? (totalMeetups / totalUsers).toFixed(1) : "0";
  const activeMembers = users.filter((u) => u.meetup_count > 0).length;
  const activeRate =
    totalUsers > 0 ? Math.round((activeMembers / totalUsers) * 100) : 0;

  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const newUsers = users.filter(
    (u) => u.join_date && new Date(u.join_date) >= thirtyDaysAgo
  ).length;

  /* ── MVP leaderboard ───────────────────────────────────── */
  const topUsers = [...users]
    .filter((u) => u.meetup_count > 0)
    .sort((a, b) => b.meetup_count - a.meetup_count)
    .slice(0, 8);

  /* ── Live activity feed (merge joins + meetups) ────────── */
  const feed: FeedItem[] = [];
  users.forEach((u) => {
    if (u.last_meetup_date)
      feed.push({
        id: `m-${u.id}`,
        name: u.name,
        date: u.last_meetup_date,
        type: "meetup",
      });
    if (u.join_date && new Date(u.join_date) >= thirtyDaysAgo)
      feed.push({
        id: `j-${u.id}`,
        name: u.name,
        date: u.join_date,
        type: "join",
      });
  });
  feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const feedItems = feed.slice(0, 9);
  // Lead with this month's MVP for a bit of brand flavour.
  if (topUsers.length > 0) {
    feedItems.unshift({
      id: `mvp-${topUsers[0].id}`,
      name: topUsers[0].name,
      date: topUsers[0].last_meetup_date ?? toKey(now),
      type: "mvp",
    });
  }

  /* ── Heatmap: 18 weeks of 마지막 참여일 density ─────────── */
  const meetupByDay = new Map<string, number>();
  users.forEach((u) => {
    if (!u.last_meetup_date) return;
    const k = toKey(new Date(u.last_meetup_date));
    meetupByDay.set(k, (meetupByDay.get(k) ?? 0) + 1);
  });

  const WEEKS = 18;
  const todayMid = new Date(now);
  todayMid.setHours(0, 0, 0, 0);
  const gridEnd = new Date(
    todayMid.getTime() + (6 - todayMid.getDay()) * DAY_MS
  ); // Saturday of current week
  const totalDays = WEEKS * 7;
  const gridStart = new Date(gridEnd.getTime() - (totalDays - 1) * DAY_MS); // a Sunday

  const heatmapDays = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(gridStart.getTime() + i * DAY_MS);
    const key = toKey(d);
    return { date: key, count: d > todayMid ? 0 : meetupByDay.get(key) ?? 0 };
  });
  const heatmapMax = Math.max(1, ...heatmapDays.map((d) => d.count));
  const heatmapTotal = heatmapDays.reduce((s, d) => s + d.count, 0);

  /* ── Deadline tracking ─────────────────────────────────── */
  const deadlineUsers = users
    .filter((user) => {
      if (user.is_regular === "신입") {
        if (!user.join_date) return false;
        const limitDate = new Date(user.join_date);
        limitDate.setMonth(limitDate.getMonth() + 1);
        const diffDays = Math.floor(
          (limitDate.getTime() - now.getTime()) / DAY_MS
        );
        return diffDays <= 7;
      } else if (user.is_regular === "기존") {
        if (!user.last_meetup_date) return false;
        const limitDate = new Date(user.last_meetup_date);
        limitDate.setMonth(limitDate.getMonth() + 2);
        const diffDays = Math.floor(
          (limitDate.getTime() - now.getTime()) / DAY_MS
        );
        return diffDays <= 7;
      }
      return false;
    })
    .map((user) => {
      let limitDate: Date;
      if (user.is_regular === "신입") {
        limitDate = new Date(user.join_date!);
        limitDate.setMonth(limitDate.getMonth() + 1);
      } else {
        limitDate = new Date(user.last_meetup_date!);
        limitDate.setMonth(limitDate.getMonth() + 2);
      }
      const diffDays = Math.floor((limitDate.getTime() - now.getTime()) / DAY_MS);
      return { ...user, limitDate, diffDays };
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  const overdueCount = deadlineUsers.filter((u) => u.diffDays < 0).length;
  const todayLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now);

  return (
    <div className="flex flex-col gap-5 pb-16">
      {/* ── HQ command bar ─────────────────────────────────── */}
      <header className="hq-command px-6 py-7 sm:px-9 sm:py-9">
        <HqArt />
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="leading-none">
                <p className="text-[15px] font-bold tracking-tight text-[rgb(var(--hq-on-surface))]">
                  SPICY <span className="text-spicy">HQ</span>
                </p>
                <p className="mt-1 type-label-small text-[rgb(var(--hq-on-surface))]/55">
                  오늘의 운영 현황
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden type-label-medium text-[rgb(var(--hq-on-surface))]/55 sm:inline">
                {todayLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 type-label-small font-semibold text-[rgb(var(--hq-on-surface))]">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-spicy-bright" />
                LIVE
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[rgb(var(--hq-on-surface))] sm:text-[40px]">
              {greeting}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--hq-on-surface))]/60 sm:text-base">
              오늘 신규 합류{" "}
              <span className="font-medium text-[rgb(var(--hq-on-surface))]">
                {newUsers}명
              </span>
              {" · "}이번 달 누적 참여{" "}
              <span className="font-medium text-[rgb(var(--hq-on-surface))]">
                {totalMeetups}회
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <a
              href="/dashboard/seating"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold tracking-tight text-[#1d1d1f] transition-all hover:bg-white/90"
            >
              <Flame className="h-4 w-4 text-spicy" />
              자리 배치 시작
            </a>
            <a
              href="/dashboard/stats"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-[14px] font-medium tracking-tight text-[rgb(var(--hq-on-surface))]/90 transition-colors hover:bg-white/[0.06]"
            >
              <TrendingUp className="h-4 w-4" />
              통계 보기
            </a>
          </div>
        </div>
      </header>

      {/* ── KPI bar (single row, hairline dividers) ────────── */}
      <section className="kpi-bar hq-panel grid grid-cols-2 overflow-hidden md:grid-cols-5">
        <KpiCell
          icon={<Users className="h-4 w-4" />}
          label="총 멤버"
          value={totalUsers}
          sub="전체 등록 인원"
        />
        <KpiCell
          icon={<TrendingUp className="h-4 w-4" />}
          label="이번 달 참여"
          value={`${totalMeetups}회`}
          sub={`인당 평균 ${averageMeetups}회`}
        />
        <KpiCell
          icon={<UserPlus className="h-4 w-4" />}
          label="신규 합류"
          value={newUsers}
          sub="최근 30일"
        />
        <KpiCell
          icon={<Activity className="h-4 w-4" />}
          label="참여율"
          value={`${activeRate}%`}
          sub={`활동 ${activeMembers}명`}
        />
        <KpiCell
          icon={<Crown className="h-4 w-4" />}
          label="이달의 MVP"
          value={topUsers.length > 0 ? topUsers[0].name : "—"}
          sub={
            topUsers.length > 0 ? `${topUsers[0].meetup_count}회 참여` : "집계 전"
          }
        />
      </section>

      {/* ── Feature shortcuts — generative art cards ───────── */}
      <FeatureCards />

      {/* ── Main grid: live feed + leaderboard ─────────────── */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* Live activity feed */}
        <Panel
          className="lg:col-span-2"
          eyebrow="Live feed"
          title="실시간 활동"
          subtitle="멤버들의 최근 움직임"
          icon={<Activity className="h-4 w-4" />}
          live
        >
          <LiveActivityFeed items={feedItems} />
        </Panel>

        {/* Leaderboard */}
        <Panel
          eyebrow="Ranking"
          title="이달의 MVP"
          subtitle="벙 참여 Top 8"
          icon={<Trophy className="h-4 w-4" />}
        >
          {topUsers.length === 0 ? (
            <EmptyState message="이번 달 데이터가 아직 없어요" />
          ) : (
            <ol className="space-y-0.5">
              {topUsers.map((user, index) => {
                const max = topUsers[0].meetup_count || 1;
                const ratio = (user.meetup_count / max) * 100;
                const isTop = index === 0;
                return (
                  <li
                    key={user.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-md-surface-container"
                  >
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums ${
                        isTop
                          ? "bg-spicy text-white"
                          : "bg-md-surface-container-high text-md-on-surface-variant"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[14px] font-medium text-md-on-surface">
                          {user.name}
                        </span>
                        <span className="flex-shrink-0 text-[13px] tabular-nums text-md-on-surface-variant">
                          {user.meetup_count}회
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-md-surface-container-high">
                        <div
                          className={`h-full rounded-full ${isTop ? "bg-spicy" : "bg-md-outline/50"}`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </section>

      {/* ── Activity heatmap ───────────────────────────────── */}
      <Panel
        eyebrow="Engagement"
        title="활동 히트맵"
        subtitle={`최근 18주 · 마지막 참여일 기준 ${heatmapTotal}건`}
        icon={<Flame className="h-4 w-4" />}
      >
        <div className="mt-1">
          <ActivityHeatmap days={heatmapDays} max={heatmapMax} />
        </div>
      </Panel>

      {/* ── Deadline tracking ──────────────────────────────── */}
      <Panel
        eyebrow="Action required"
        title="참여 기한 임박자"
        subtitle={
          deadlineUsers.length === 0
            ? "현재 임박한 기한이 없습니다"
            : `총 ${deadlineUsers.length}명이 일주일 내 기한 도래${
                overdueCount > 0 ? ` · ${overdueCount}명 초과` : ""
              }`
        }
        icon={<AlertCircle className="h-4 w-4" />}
        action={
          deadlineUsers.length > 0 ? (
            <CopyButton deadlineUsers={deadlineUsers} />
          ) : undefined
        }
      >
        {deadlineUsers.length === 0 ? (
          <EmptyState message="모두 안전권 ✓" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {deadlineUsers.map((user) => {
              const isOverdue = user.diffDays < 0;
              return (
                <div
                  key={user.id}
                  className={`rounded-xl border p-4 ${
                    isOverdue
                      ? "border-transparent bg-md-error-container text-md-on-error-container"
                      : "border-md-outline-variant bg-md-surface-container-lowest text-md-on-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="type-title-medium">{user.name}</p>
                      <p className="type-label-small opacity-70">
                        기한 {formatDateString(user.limitDate.toString())}
                      </p>
                    </div>
                    <span
                      className={`m3-pill ${
                        user.is_regular === "신입"
                          ? "m3-pill-primary"
                          : "bg-md-surface-container-high text-md-on-surface-variant"
                      }`}
                    >
                      {user.is_regular}
                    </span>
                  </div>
                  <p
                    className={`mt-4 type-label-large ${
                      isOverdue
                        ? "text-md-on-error-container"
                        : user.diffDays <= 3
                          ? "text-md-error"
                          : "text-md-on-surface-variant"
                    }`}
                  >
                    {user.name.includes("가람")
                      ? "가람이는 봐주자 · 알아서 데려갈게"
                      : isOverdue
                        ? `${Math.abs(user.diffDays)}일 초과`
                        : `${user.diffDays}일 남음`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ── Operations team ────────────────────────────────── */}
      <MastersStrip />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */

function KpiCell({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="bg-md-surface-container-lowest px-5 py-6">
      <div className="flex items-center gap-1.5 text-md-on-surface-variant/70">
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        <span className="text-[12px] font-medium tracking-tight">{label}</span>
      </div>
      <p className="mt-3.5 truncate text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-md-on-surface">
        {value}
      </p>
      <p className="mt-2.5 text-[12px] tracking-tight text-md-on-surface-variant/70">
        {sub}
      </p>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  subtitle,
  icon,
  action,
  live = false,
  className = "",
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  live?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`hq-panel p-5 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-md-on-surface-variant/60">
            <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
              {eyebrow}
            </span>
            {live && (
              <span className="live-dot ml-0.5 h-1.5 w-1.5 rounded-full bg-spicy" />
            )}
          </div>
          <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-md-on-surface">
            {title}
          </h2>
          <p className="text-[13px] text-md-on-surface-variant/80">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-2xl bg-md-surface-container-low">
      <p className="type-body-medium text-md-on-surface-variant">{message}</p>
    </div>
  );
}
