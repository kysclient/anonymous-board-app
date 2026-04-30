import { formatDateString } from "@/lib/utils";
import {
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  UserPlus,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  Quote,
} from "lucide-react";
import { getUsers } from "./actions";
import CopyButton from "@/components/copy-button";
import MastersStrip from "@/components/masters-strip";

export const revalidate = 0;

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export default async function DashboardPage() {
  const users = await getUsers();

  const totalUsers = users.length;
  const totalMeetups = users.reduce((sum, user) => sum + user.meetup_count, 0);
  const averageMeetups =
    totalUsers > 0 ? (totalMeetups / totalUsers).toFixed(1) : "0";

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsers = users.filter(
    (user) => user.join_date && new Date(user.join_date) >= thirtyDaysAgo
  ).length;

  const now = new Date();
  const topUsers = [...users]
    .filter((user) => user.meetup_count > 0)
    .sort((a, b) => b.meetup_count - a.meetup_count)
    .slice(0, 10);

  const recentActivities = [...users]
    .filter((user) => user.last_meetup_date)
    .sort(
      (a, b) =>
        new Date(b.last_meetup_date || "").getTime() -
        new Date(a.last_meetup_date || "").getTime()
    )
    .slice(0, 8);

  const deadlineUsers = users
    .filter((user) => {
      if (user.is_regular === "신입") {
        if (!user.join_date) return false;
        const joinDate = new Date(user.join_date);
        const limitDate = new Date(joinDate);
        limitDate.setMonth(limitDate.getMonth() + 1);
        const diffDays = Math.floor(
          (limitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= 7;
      } else if (user.is_regular === "기존") {
        if (!user.last_meetup_date) return false;
        const lastMeetupDate = new Date(user.last_meetup_date);
        const limitDate = new Date(lastMeetupDate);
        limitDate.setMonth(limitDate.getMonth() + 2);
        const diffDays = Math.floor(
          (limitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= 7;
      }
      return false;
    })
    .map((user) => {
      let limitDate: Date;
      if (user.is_regular === "신입") {
        const joinDate = new Date(user.join_date!);
        limitDate = new Date(joinDate);
        limitDate.setMonth(limitDate.getMonth() + 1);
      } else {
        const lastMeetupDate = new Date(user.last_meetup_date!);
        limitDate = new Date(lastMeetupDate);
        limitDate.setMonth(limitDate.getMonth() + 2);
      }
      const diffDays = Math.floor(
        (limitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...user, limitDate, diffDays };
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  const overdueCount = deadlineUsers.filter((u) => u.diffDays < 0).length;

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Hero */}
      <header className="m3-card-feature relative overflow-hidden bg-md-primary-container p-7 sm:p-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-md-primary opacity-10" />
        <div className="absolute right-8 bottom-12 h-32 w-32 rounded-full bg-md-tertiary-container opacity-70" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-md-secondary-container opacity-50" />

        <div className="relative space-y-7">
          <span className="m3-pill m3-pill-tertiary">
            <Sparkles className="h-3 w-3" />
            오늘 · {formatLongDate(now)}
          </span>

          <div className="space-y-5">
            <Quote
              className="h-9 w-9 text-md-on-primary-container/30"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="type-headline-large text-balance max-w-3xl text-md-on-primary-container">
              기쁨뒤에 슬픔이 오는건 아름다운 마음이야
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <a href="/dashboard/seating" className="m3-btn m3-btn-filled">
              <Sparkles className="h-4 w-4" />
              자리 배치 시작
            </a>
            <a href="/dashboard/stats" className="m3-btn m3-btn-tonal">
              <TrendingUp className="h-4 w-4" />
              통계 보기
            </a>
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          tone="primary"
          icon={<Users className="h-5 w-5" />}
          label="총 멤버"
          value={totalUsers}
          delta={
            newUsers > 0 ? (
              <span className="inline-flex items-center gap-1 text-md-primary">
                <ArrowUpRight className="h-3.5 w-3.5" />+{newUsers} 30일
              </span>
            ) : (
              <span className="text-md-on-surface-variant">증감 없음</span>
            )
          }
        />
        <KpiCard
          tone="surface"
          icon={<TrendingUp className="h-5 w-5" />}
          label="이번 달 참여"
          value={`${totalMeetups}회`}
          delta={
            <span className="text-md-on-surface-variant">
              인당 평균 {averageMeetups}회
            </span>
          }
        />
        <KpiCard
          tone="tertiary"
          icon={<Trophy className="h-5 w-5" />}
          label="이달의 MVP"
          value={topUsers.length > 0 ? topUsers[0].name : "—"}
          delta={
            topUsers.length > 0 ? (
              <span className="text-md-on-tertiary-container/80">
                {topUsers[0].meetup_count}회 참여 중
              </span>
            ) : (
              <span className="text-md-on-tertiary-container/70">집계 전</span>
            )
          }
        />
        <KpiCard
          tone="surface"
          icon={<UserPlus className="h-5 w-5" />}
          label="신규 합류"
          value={newUsers}
          delta={
            <span className="text-md-on-surface-variant">
              총원 대비{" "}
              {totalUsers > 0
                ? Math.round((newUsers / totalUsers) * 100)
                : 0}
              %
            </span>
          }
        />
      </section>

      {/* Masters strip */}
      <section>
        <MastersStrip />
      </section>

      {/* Top 10 + recent activity */}
      <section className="grid gap-4 lg:grid-cols-7">
        {/* Leaderboard */}
        <div className="m3-card-elevated lg:col-span-4 p-6 sm:p-7">
          <CardHeader
            eyebrow="Leaderboard"
            title="이달의 벙킹 Top 10"
            subtitle="이번 달 벙 참여 횟수 기준 상위 10명"
            icon={<Trophy className="h-4 w-4" />}
          />

          <div className="mt-6">
            {topUsers.length === 0 ? (
              <EmptyState message="이번 달 데이터가 아직 없어요" />
            ) : (
              <ol className="space-y-1">
                {topUsers.map((user, index) => {
                  const max = topUsers[0].meetup_count || 1;
                  const ratio = (user.meetup_count / max) * 100;
                  return (
                    <li
                      key={user.id}
                      className="m3-list-item gap-4 px-3"
                    >
                      <span
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full type-label-large ${
                          index === 0
                            ? "bg-md-primary text-md-on-primary"
                            : index < 3
                              ? "bg-md-primary-container text-md-on-primary-container"
                              : "bg-md-surface-container-highest text-md-on-surface-variant"
                        }`}
                      >
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="type-title-medium truncate text-md-on-surface">
                            {user.name}
                          </span>
                          <span className="type-label-large flex-shrink-0 text-md-primary">
                            {user.meetup_count}회
                          </span>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-md-surface-container-highest">
                          <div
                            className="h-full rounded-full bg-md-primary transition-all"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="m3-card-elevated lg:col-span-3 p-6 sm:p-7">
          <CardHeader
            eyebrow="Activity"
            title="최근 벙 참여"
            subtitle="가장 최근에 활동한 멤버"
            icon={<Calendar className="h-4 w-4" />}
          />

          <div className="mt-6">
            {recentActivities.length === 0 ? (
              <EmptyState message="아직 활동 기록이 없어요" />
            ) : (
              <ul className="space-y-0">
                {recentActivities.map((user, idx) => (
                  <li key={user.id} className="relative flex gap-4">
                    {idx !== recentActivities.length - 1 && (
                      <span className="absolute left-[7px] top-5 h-full w-px bg-md-outline-variant" />
                    )}
                    <span className="relative mt-1.5 h-3 w-3 flex-shrink-0 rounded-full border-2 border-md-surface-container-low bg-md-primary" />
                    <div className="flex-1 pb-5">
                      <p className="type-body-medium leading-snug text-md-on-surface">
                        <span className="font-semibold">{user.name}</span>
                        <span className="text-md-on-surface-variant">
                          {" "}
                          님이 벙에 참여
                        </span>
                      </p>
                      <p className="type-label-small mt-1 text-md-on-surface-variant">
                        {user.last_meetup_date
                          ? formatDateString(user.last_meetup_date)
                          : "—"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Deadline section */}
      <section className="m3-card-filled p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <CardHeader
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
          />

          {deadlineUsers.length > 0 && <CopyButton deadlineUsers={deadlineUsers} />}
        </div>

        <div className="mt-6">
          {deadlineUsers.length === 0 ? (
            <EmptyState message="모두 안전권 ✓" />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {deadlineUsers.map((user) => {
                const isOverdue = user.diffDays < 0;
                return (
                  <div
                    key={user.id}
                    className={`rounded-2xl p-4 ${
                      isOverdue
                        ? "bg-md-error-container text-md-on-error-container"
                        : "bg-md-surface-container-low text-md-on-surface"
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
        </div>
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */

function KpiCard({
  tone,
  label,
  value,
  delta,
  icon,
}: {
  tone: "primary" | "tertiary" | "surface";
  label: string;
  value: string | number;
  delta: React.ReactNode;
  icon: React.ReactNode;
}) {
  const surfaceClass =
    tone === "primary"
      ? "bg-md-primary-container text-md-on-primary-container"
      : tone === "tertiary"
        ? "bg-md-tertiary-container text-md-on-tertiary-container"
        : "bg-md-surface-container-low text-md-on-surface";

  const iconWrapClass =
    tone === "primary"
      ? "bg-md-primary text-md-on-primary"
      : tone === "tertiary"
        ? "bg-md-tertiary text-md-on-tertiary"
        : "bg-md-secondary-container text-md-on-secondary-container";

  return (
    <div className={`rounded-3xl p-5 sm:p-6 ${surfaceClass}`}>
      <div className="flex items-start justify-between">
        <p className="type-label-large opacity-80">{label}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${iconWrapClass}`}
        >
          {icon}
        </span>
      </div>
      <p className="type-headline-large mt-4 truncate">{value}</p>
      <p className="type-label-medium mt-1 opacity-80">{delta}</p>
    </div>
  );
}

function CardHeader({
  eyebrow,
  title,
  subtitle,
  icon,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-md-primary">
        {icon}
        <span className="type-label-medium uppercase">{eyebrow}</span>
      </div>
      <h2 className="type-title-large text-md-on-surface">{title}</h2>
      <p className="type-body-medium text-md-on-surface-variant">{subtitle}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-2xl bg-md-surface-container-low">
      <p className="type-body-medium text-md-on-surface-variant">{message}</p>
    </div>
  );
}
