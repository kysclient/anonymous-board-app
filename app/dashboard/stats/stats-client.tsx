"use client";

import { User } from "../actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import {
  Users,
  TrendingUp,
  Clock,
  Crown,
  Target,
  Activity,
  Zap,
  BarChart3,
} from "lucide-react";

// Material 3 chart palette — primary blue + tertiary purple + accent siblings
const CHART_PRIMARY = "#0b57d0";
const CHART_TERTIARY = "#715573";
const CHART_TEAL = "#006a6a";
const CHART_AMBER = "#7c5800";
const CHART_GREEN = "#386a20";
const CHART_PINK = "#984065";
const CHART_PALETTE = [
  CHART_PRIMARY,
  CHART_TERTIARY,
  CHART_TEAL,
  CHART_AMBER,
  CHART_PINK,
  CHART_GREEN,
];

/* ────────────────────────────────────────────────────────────────── */
/*  Building blocks                                                    */
/* ────────────────────────────────────────────────────────────────── */

function KpiCard({
  tone,
  label,
  value,
  sub,
  icon,
}: {
  tone: "primary" | "tertiary" | "secondary" | "surface";
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  const surfaceClass =
    tone === "primary"
      ? "bg-md-primary-container text-md-on-primary-container"
      : tone === "tertiary"
        ? "bg-md-tertiary-container text-md-on-tertiary-container"
        : tone === "secondary"
          ? "bg-md-secondary-container text-md-on-secondary-container"
          : "bg-md-surface-container-low text-md-on-surface";

  const iconWrapClass =
    tone === "primary"
      ? "bg-md-primary text-md-on-primary"
      : tone === "tertiary"
        ? "bg-md-tertiary text-md-on-tertiary"
        : tone === "secondary"
          ? "bg-md-secondary text-md-on-secondary"
          : "bg-md-surface-container-highest text-md-on-surface-variant";

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
      {sub && <p className="type-label-medium mt-1 opacity-80">{sub}</p>}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`m3-card-elevated overflow-hidden p-6 sm:p-7 ${className}`}>
      <div className="space-y-1">
        <h4 className="type-title-large text-md-on-surface">{title}</h4>
        {description && (
          <p className="type-body-medium text-md-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function HighlightCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  tone: "primary" | "tertiary" | "secondary" | "amber";
}) {
  const styles = {
    primary: "bg-md-primary-container text-md-on-primary-container",
    tertiary: "bg-md-tertiary-container text-md-on-tertiary-container",
    secondary: "bg-md-secondary-container text-md-on-secondary-container",
    amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  };
  const iconStyles = {
    primary: "bg-md-primary text-md-on-primary",
    tertiary: "bg-md-tertiary text-md-on-tertiary",
    secondary: "bg-md-secondary text-md-on-secondary",
    amber: "bg-amber-500 text-white",
  };

  return (
    <div className={`rounded-2xl p-4 ${styles[tone]}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${iconStyles[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="type-label-medium uppercase opacity-70">{label}</p>
          <p className="type-title-medium mt-0.5 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-2xl bg-md-inverse-surface px-4 py-2.5 type-body-small text-md-inverse-on-surface elev-2"
    >
      {label && <p className="font-semibold">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p
          key={i}
          style={{ color: entry.color }}
          className="mt-0.5 font-medium"
        >
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────── */
/*  Page                                                               */
/* ────────────────────────────────────────────────────────────────── */

export default function StatsClient({ users }: { users: User[] }) {
  const now = new Date();

  const totalUsers = users.length;
  const totalMeetups = users.reduce((s, u) => s + u.total_meetup_count, 0);
  const monthlyMeetups = users.reduce((s, u) => s + u.meetup_count, 0);
  const avgMeetups =
    totalUsers > 0 ? (totalMeetups / totalUsers).toFixed(1) : "0";

  const newbies = users.filter((u) => u.is_regular === "신입").length;
  const regulars = users.filter((u) => u.is_regular === "기존").length;

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const activeRecent = users.filter(
    (u) => u.last_meetup_date && new Date(u.last_meetup_date) >= twoWeeksAgo
  ).length;
  const activeRate =
    totalUsers > 0 ? Math.round((activeRecent / totalUsers) * 100) : 0;

  const totalOrganized = users.reduce((s, u) => s + u.meetup_make_count, 0);
  const topOrganizer = [...users].sort(
    (a, b) => b.meetup_make_count - a.meetup_make_count
  )[0];

  // Gender distribution
  const genderMap: Record<string, number> = {};
  users.forEach((u) => {
    const g = u.gender || "미입력";
    genderMap[g] = (genderMap[g] || 0) + 1;
  });
  const genderData = Object.entries(genderMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Join timeline
  const joinTimeline: Record<string, number> = {};
  users.forEach((u) => {
    if (!u.join_date) return;
    const d = new Date(u.join_date);
    const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    joinTimeline[key] = (joinTimeline[key] || 0) + 1;
  });
  const joinTimelineData = Object.entries(joinTimeline)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  let cumulative = 0;
  const cumulativeData = joinTimelineData.map((d) => {
    cumulative += d.count;
    return { ...d, total: cumulative };
  });

  // Participation distribution
  const participationBuckets = [
    { range: "0", min: 0, max: 0 },
    { range: "1-2", min: 1, max: 2 },
    { range: "3-5", min: 3, max: 5 },
    { range: "6-10", min: 6, max: 10 },
    { range: "11-20", min: 11, max: 20 },
    { range: "21+", min: 21, max: Infinity },
  ];
  const participationDistData = participationBuckets.map((b) => ({
    range: b.range,
    count: users.filter(
      (u) => u.total_meetup_count >= b.min && u.total_meetup_count <= b.max
    ).length,
  }));

  // Top 10
  const monthlyTop = [...users]
    .filter((u) => u.meetup_count > 0)
    .sort((a, b) => b.meetup_count - a.meetup_count)
    .slice(0, 10)
    .map((u) => ({ name: u.name, count: u.meetup_count }));

  const allTimeTop = [...users]
    .sort((a, b) => b.total_meetup_count - a.total_meetup_count)
    .slice(0, 10)
    .map((u) => ({ name: u.name, count: u.total_meetup_count }));

  // Highlights
  const longestMember = [...users]
    .filter((u) => u.join_date)
    .sort(
      (a, b) =>
        new Date(a.join_date!).getTime() - new Date(b.join_date!).getTime()
    )[0];
  const daysSinceJoin = longestMember?.join_date
    ? Math.floor(
        (now.getTime() - new Date(longestMember.join_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const mostActiveNewbie = [...users]
    .filter((u) => u.is_regular === "신입")
    .sort((a, b) => b.total_meetup_count - a.total_meetup_count)[0];

  const highestMonthly = [...users].sort(
    (a, b) => b.meetup_count - a.meetup_count
  )[0];

  const neverAttended = users.filter((u) => u.total_meetup_count === 0).length;

  // Radar
  const radarUsers = [...users]
    .sort((a, b) => b.total_meetup_count - a.total_meetup_count)
    .slice(0, 5);

  const maxMeetup = Math.max(...users.map((u) => u.total_meetup_count), 1);
  const maxMonthly = Math.max(...users.map((u) => u.meetup_count), 1);
  const maxMake = Math.max(...users.map((u) => u.meetup_make_count), 1);

  const radarData = [
    {
      metric: "총 참여",
      ...Object.fromEntries(
        radarUsers.map((u) => [
          u.name,
          Math.round((u.total_meetup_count / maxMeetup) * 100),
        ])
      ),
    },
    {
      metric: "이달 참여",
      ...Object.fromEntries(
        radarUsers.map((u) => [
          u.name,
          Math.round((u.meetup_count / maxMonthly) * 100),
        ])
      ),
    },
    {
      metric: "벙주",
      ...Object.fromEntries(
        radarUsers.map((u) => [
          u.name,
          Math.round((u.meetup_make_count / maxMake) * 100),
        ])
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Hero */}
      <header className="m3-card-feature relative overflow-hidden bg-md-primary-container p-7 sm:p-10">
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-md-tertiary-container opacity-50" />
        <div className="absolute right-1/3 -top-12 h-40 w-40 rounded-full bg-md-secondary-container opacity-50" />
        <div className="relative space-y-4">
          <span className="m3-pill m3-pill-tertiary">
            <BarChart3 className="h-3 w-3" />
            Statistics · Live
          </span>
          <div className="space-y-3">
            <h1 className="type-display-medium text-md-on-primary-container">
              멤버 통계
            </h1>
            <p className="type-body-large max-w-xl text-md-on-primary-container/85">
              모임의 참여 추이, 활동 비율, 신입과 기존의 비교까지 — 운영에 필요한
              데이터를 한눈에.
            </p>
          </div>
        </div>
      </header>

      {/* KPI tiles */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          tone="primary"
          icon={<Users className="h-5 w-5" />}
          label="총 멤버"
          value={totalUsers}
          sub={`기존 ${regulars} · 신입 ${newbies}`}
        />
        <KpiCard
          tone="surface"
          icon={<TrendingUp className="h-5 w-5" />}
          label="누적 참여"
          value={`${totalMeetups}회`}
          sub={`인당 평균 ${avgMeetups}회`}
        />
        <KpiCard
          tone="tertiary"
          icon={<Activity className="h-5 w-5" />}
          label="이달 참여"
          value={`${monthlyMeetups}회`}
          sub={`${activeRate}% 최근 2주 활동`}
        />
        <KpiCard
          tone="secondary"
          icon={<Crown className="h-5 w-5" />}
          label="벙 개최"
          value={`${totalOrganized}회`}
          sub={topOrganizer ? `MVP · ${topOrganizer.name}` : "—"}
        />
      </section>

      {/* Highlights */}
      <section className="m3-card-elevated p-6 sm:p-7">
        <div className="space-y-1">
          <p className="type-label-medium uppercase text-md-primary">
            Highlights
          </p>
          <h2 className="type-title-large text-md-on-surface">
            이번 달의 시그널
          </h2>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {longestMember && (
            <HighlightCard
              icon={Clock}
              label="최장기 멤버"
              value={`${longestMember.name} · ${daysSinceJoin}일째`}
              tone="primary"
            />
          )}
          {mostActiveNewbie && mostActiveNewbie.total_meetup_count > 0 && (
            <HighlightCard
              icon={Zap}
              label="가장 열정적인 신입"
              value={`${mostActiveNewbie.name} · ${mostActiveNewbie.total_meetup_count}회`}
              tone="amber"
            />
          )}
          {highestMonthly && highestMonthly.meetup_count > 0 && (
            <HighlightCard
              icon={Target}
              label="이달의 최다 참여"
              value={`${highestMonthly.name} · ${highestMonthly.meetup_count}회`}
              tone="tertiary"
            />
          )}
          <HighlightCard
            icon={Activity}
            label="아직 미참여"
            value={`${neverAttended}명이 0회`}
            tone="secondary"
          />
        </div>
      </section>

      {/* Growth + composition */}
      <section className="grid gap-4 lg:grid-cols-7">
        <ChartCard
          title="멤버 가입 추이"
          description="월별 신규 가입 + 누적 멤버 수"
          className="lg:col-span-4"
        >
          {cumulativeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={cumulativeData}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgb(var(--md-outline-variant))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "rgb(var(--md-on-surface-variant))" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgb(var(--md-outline-variant))" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgb(var(--md-on-surface-variant))" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="누적 멤버"
                  stroke={CHART_PRIMARY}
                  strokeWidth={2}
                  fill="url(#growthGrad)"
                />
                <Bar
                  dataKey="count"
                  name="신규 가입"
                  fill={CHART_TERTIARY}
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center type-body-medium text-md-on-surface-variant">
              데이터 없음
            </p>
          )}
        </ChartCard>

        <div className="grid gap-4 lg:col-span-3">
          <ChartCard title="성별 분포" description="등록된 정보 기준">
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={52}
                    strokeWidth={2}
                    stroke="rgb(var(--md-surface-container-low))"
                  >
                    {genderData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-6 text-center type-body-medium text-md-on-surface-variant">
                데이터 없음
              </p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {genderData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 type-label-small">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}
                  />
                  <span className="text-md-on-surface-variant">
                    {d.name} {d.value}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="멤버 구성"
            description={`기존 vs 신입 · 총 ${totalUsers}명`}
          >
            <div className="space-y-3">
              <div className="flex items-baseline justify-between type-label-medium text-md-on-surface-variant">
                <span>기존 {regulars}명</span>
                <span>신입 {newbies}명</span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-md-surface-container-highest">
                <div
                  className="h-full bg-md-primary"
                  style={{
                    width: `${totalUsers > 0 ? (regulars / totalUsers) * 100 : 0}%`,
                  }}
                />
                <div
                  className="h-full bg-md-tertiary"
                  style={{
                    width: `${totalUsers > 0 ? (newbies / totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between type-label-medium">
                <span className="font-semibold text-md-primary">
                  {totalUsers > 0
                    ? Math.round((regulars / totalUsers) * 100)
                    : 0}
                  %
                </span>
                <span className="font-semibold text-md-tertiary">
                  {totalUsers > 0
                    ? Math.round((newbies / totalUsers) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </ChartCard>
        </div>
      </section>

      {/* Distribution + radar */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="참여 횟수 분포"
          description="누적 참여 횟수 구간별 멤버 수"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={participationDistData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgb(var(--md-outline-variant))"
              />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11, fill: "rgb(var(--md-on-surface-variant))" }}
                tickLine={false}
                axisLine={{ stroke: "rgb(var(--md-outline-variant))" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "rgb(var(--md-on-surface-variant))" }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="멤버 수" radius={[8, 8, 0, 0]}>
                {participationDistData.map((_, i) => (
                  <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top 5 멤버 비교"
          description="총 참여 · 이달 참여 · 벙주 비율 (상위 5명)"
        >
          {radarUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgb(var(--md-outline-variant))" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 11, fill: "rgb(var(--md-on-surface-variant))" }}
                />
                {radarUsers.map((u, i) => (
                  <Radar
                    key={u.id}
                    name={u.name}
                    dataKey={u.name}
                    stroke={CHART_PALETTE[i]}
                    fill={CHART_PALETTE[i]}
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center type-body-medium text-md-on-surface-variant">
              데이터 없음
            </p>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {radarUsers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-1.5 type-label-small">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CHART_PALETTE[i] }}
                />
                <span className="text-md-on-surface-variant">{u.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      {/* Rankings */}
      <section className="grid gap-4 lg:grid-cols-2">
        <RankingList
          title="이달의 Top 10"
          description="이번 달 참여 횟수 순"
          items={monthlyTop}
          unit="회"
          tone="primary"
          emptyMessage="이번 달 참여 데이터가 없어요"
        />
        <RankingList
          title="역대 Top 10"
          description="누적 참여 횟수 순"
          items={allTimeTop}
          unit="회"
          tone="tertiary"
          emptyMessage="데이터 없음"
        />
      </section>

      {/* Full member table */}
      <section className="m3-card-elevated overflow-hidden">
        <div className="p-6 sm:p-7">
          <h4 className="type-title-large text-md-on-surface">전체 멤버 현황</h4>
          <p className="type-body-medium mt-1 text-md-on-surface-variant">
            {totalUsers}명 · 누적 참여 횟수 내림차순
          </p>
        </div>

        <div className="overflow-x-auto border-t border-md-outline-variant">
          <table className="w-full">
            <thead>
              <tr className="bg-md-surface-container">
                <th className="w-[60px] px-4 py-3 text-left type-label-medium uppercase text-md-on-surface-variant">
                  #
                </th>
                <th className="px-4 py-3 text-left type-label-medium uppercase text-md-on-surface-variant">
                  이름
                </th>
                <th className="px-4 py-3 text-left type-label-medium uppercase text-md-on-surface-variant">
                  구분
                </th>
                <th className="px-4 py-3 text-right type-label-medium uppercase text-md-on-surface-variant">
                  이달
                </th>
                <th className="px-4 py-3 text-right type-label-medium uppercase text-md-on-surface-variant">
                  누적
                </th>
                <th className="px-4 py-3 text-right type-label-medium uppercase text-md-on-surface-variant">
                  벙주
                </th>
                <th className="hidden px-4 py-3 text-left type-label-medium uppercase text-md-on-surface-variant sm:table-cell">
                  가입일
                </th>
                <th className="hidden px-4 py-3 text-left type-label-medium uppercase text-md-on-surface-variant sm:table-cell">
                  최근 참여
                </th>
              </tr>
            </thead>
            <tbody>
              {[...users]
                .sort((a, b) => b.total_meetup_count - a.total_meetup_count)
                .map((u, i) => (
                  <tr
                    key={u.id}
                    className="border-t border-md-outline-variant/40 transition-colors hover:bg-md-surface-container"
                  >
                    <td className="px-4 py-3 type-label-medium text-md-on-surface-variant">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 type-title-small text-md-on-surface">
                      {u.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`m3-pill ${
                          u.is_regular === "신입" ? "m3-pill-primary" : ""
                        }`}
                      >
                        {u.is_regular}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right type-body-medium">
                      {u.meetup_count}
                    </td>
                    <td className="px-4 py-3 text-right type-title-small text-md-primary">
                      {u.total_meetup_count}
                    </td>
                    <td className="px-4 py-3 text-right type-body-medium">
                      {u.meetup_make_count}
                    </td>
                    <td className="hidden px-4 py-3 type-body-small text-md-on-surface-variant sm:table-cell">
                      {u.join_date
                        ? new Date(u.join_date).toLocaleDateString("ko-KR", {
                            year: "2-digit",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="hidden px-4 py-3 type-body-small text-md-on-surface-variant sm:table-cell">
                      {u.last_meetup_date
                        ? new Date(u.last_meetup_date).toLocaleDateString(
                            "ko-KR",
                            {
                              year: "2-digit",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RankingList({
  title,
  description,
  items,
  unit,
  tone,
  emptyMessage,
}: {
  title: string;
  description?: string;
  items: { name: string; count: number }[];
  unit: string;
  tone: "primary" | "tertiary";
  emptyMessage: string;
}) {
  const accentColor = tone === "primary" ? CHART_PRIMARY : CHART_TERTIARY;
  const containerClass =
    tone === "primary"
      ? "bg-md-primary-container text-md-on-primary-container"
      : "bg-md-tertiary-container text-md-on-tertiary-container";
  const accentBgClass =
    tone === "primary" ? "bg-md-primary text-md-on-primary" : "bg-md-tertiary text-md-on-tertiary";

  return (
    <ChartCard title={title} description={description}>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((u, i) => {
            const maxCount = items[0]?.count || 1;
            return (
              <div key={u.name} className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full type-label-large ${
                    i === 0
                      ? accentBgClass
                      : i < 3
                        ? containerClass
                        : "bg-md-surface-container-highest text-md-on-surface-variant"
                  }`}
                >
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="type-title-small truncate text-md-on-surface">
                      {u.name}
                    </span>
                    <span
                      className="flex-shrink-0 type-label-large"
                      style={{ color: accentColor }}
                    >
                      {u.count}
                      {unit}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-md-surface-container-highest">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(u.count / maxCount) * 100}%`,
                        background: accentColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-12 text-center type-body-medium text-md-on-surface-variant">
          {emptyMessage}
        </p>
      )}
    </ChartCard>
  );
}
