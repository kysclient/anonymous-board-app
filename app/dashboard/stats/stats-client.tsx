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
  Flame,
  Crown,
  Target,
  Activity,
  Zap,
  Calendar,
  BarChart3,
} from "lucide-react";

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

function StatNumber({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Users;
  accent?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-4 transition-all hover:border-blue-500/30 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
          <p
            className={`text-2xl font-bold tracking-tight ${
              accent
                ? "bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent"
                : "text-foreground"
            }`}
          >
            {value}
          </p>
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
          <Icon className="h-4 w-4 text-blue-500" />
        </div>
      </div>
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-500/5 transition-transform group-hover:scale-150" />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold tracking-tight text-foreground">
      {children}
    </h3>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border/60 bg-card/80 p-5 ${className}`}
    >
      <h4 className="mb-4 text-[13px] font-semibold text-foreground">{title}</h4>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="mt-0.5">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function StatsClient({ users }: { users: User[] }) {
  const now = new Date();

  // --- Core metrics ---
  const totalUsers = users.length;
  const totalMeetups = users.reduce((s, u) => s + u.total_meetup_count, 0);
  const monthlyMeetups = users.reduce((s, u) => s + u.meetup_count, 0);
  const avgMeetups = totalUsers > 0 ? (totalMeetups / totalUsers).toFixed(1) : "0";

  const newbies = users.filter((u) => u.is_regular === "신입").length;
  const regulars = users.filter((u) => u.is_regular === "기존").length;

  // Active in last 14 days
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const activeRecent = users.filter(
    (u) => u.last_meetup_date && new Date(u.last_meetup_date) >= twoWeeksAgo
  ).length;
  const activeRate = totalUsers > 0 ? Math.round((activeRecent / totalUsers) * 100) : 0;

  // Organizers
  const totalOrganized = users.reduce((s, u) => s + u.meetup_make_count, 0);
  const topOrganizer = [...users].sort((a, b) => b.meetup_make_count - a.meetup_make_count)[0];

  // --- Gender distribution ---
  const genderMap: Record<string, number> = {};
  users.forEach((u) => {
    const g = u.gender || "미입력";
    genderMap[g] = (genderMap[g] || 0) + 1;
  });
  const genderData = Object.entries(genderMap).map(([name, value]) => ({ name, value }));

  // --- Status distribution ---
  const statusData = [
    { name: "기존 멤버", value: regulars },
    { name: "신입 멤버", value: newbies },
  ];

  // --- Join date timeline (monthly) ---
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

  // Cumulative
  let cumulative = 0;
  const cumulativeData = joinTimelineData.map((d) => {
    cumulative += d.count;
    return { ...d, total: cumulative };
  });

  // --- Participation distribution (histogram) ---
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

  // --- Monthly activity top 10 ---
  const monthlyTop = [...users]
    .filter((u) => u.meetup_count > 0)
    .sort((a, b) => b.meetup_count - a.meetup_count)
    .slice(0, 10)
    .map((u) => ({ name: u.name, count: u.meetup_count }));

  // --- All-time top 10 ---
  const allTimeTop = [...users]
    .sort((a, b) => b.total_meetup_count - a.total_meetup_count)
    .slice(0, 10)
    .map((u) => ({ name: u.name, count: u.total_meetup_count }));

  // --- Fun facts ---
  const longestMember = [...users]
    .filter((u) => u.join_date)
    .sort((a, b) => new Date(a.join_date!).getTime() - new Date(b.join_date!).getTime())[0];
  const daysSinceJoin = longestMember?.join_date
    ? Math.floor(
        (now.getTime() - new Date(longestMember.join_date).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  const mostActiveNewbie = [...users]
    .filter((u) => u.is_regular === "신입")
    .sort((a, b) => b.total_meetup_count - a.total_meetup_count)[0];

  const highestMonthly = [...users].sort((a, b) => b.meetup_count - a.meetup_count)[0];

  const neverAttended = users.filter((u) => u.total_meetup_count === 0).length;

  // --- Radar chart: top 5 user comparison ---
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
        radarUsers.map((u) => [u.name, Math.round((u.total_meetup_count / maxMeetup) * 100)])
      ),
    },
    {
      metric: "이달 참여",
      ...Object.fromEntries(
        radarUsers.map((u) => [u.name, Math.round((u.meetup_count / maxMonthly) * 100)])
      ),
    },
    {
      metric: "벙주 횟수",
      ...Object.fromEntries(
        radarUsers.map((u) => [u.name, Math.round((u.meetup_make_count / maxMake) * 100)])
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Page header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
          <BarChart3 className="h-3 w-3" />
          Statistics
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          멤버 통계
        </h1>
        <p className="text-xs text-muted-foreground">
          우리 모임의 데이터를 한눈에 확인하세요
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatNumber
          label="총 멤버"
          value={totalUsers}
          sub={`신입 ${newbies} / 기존 ${regulars}`}
          icon={Users}
          accent
        />
        <StatNumber
          label="누적 참여"
          value={`${totalMeetups}회`}
          sub={`인당 평균 ${avgMeetups}회`}
          icon={TrendingUp}
        />
        <StatNumber
          label="이달 참여"
          value={`${monthlyMeetups}회`}
          sub={`${activeRate}% 최근 2주 활동`}
          icon={Flame}
        />
        <StatNumber
          label="벙 개최"
          value={`${totalOrganized}회`}
          sub={topOrganizer ? `MVP: ${topOrganizer.name}` : "-"}
          icon={Crown}
        />
      </div>

      {/* Fun facts */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5 p-5">
        <SectionTitle>Highlights</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {longestMember && (
            <div className="flex items-start gap-3 rounded-lg bg-background/60 p-3">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
              <div>
                <p className="text-[12px] font-medium text-foreground">
                  최장기 멤버
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {longestMember.name} -- {daysSinceJoin}일째
                </p>
              </div>
            </div>
          )}
          {mostActiveNewbie && mostActiveNewbie.total_meetup_count > 0 && (
            <div className="flex items-start gap-3 rounded-lg bg-background/60 p-3">
              <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <div>
                <p className="text-[12px] font-medium text-foreground">
                  가장 열정적인 신입
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {mostActiveNewbie.name} -- {mostActiveNewbie.total_meetup_count}회 참여
                </p>
              </div>
            </div>
          )}
          {highestMonthly && highestMonthly.meetup_count > 0 && (
            <div className="flex items-start gap-3 rounded-lg bg-background/60 p-3">
              <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
              <div>
                <p className="text-[12px] font-medium text-foreground">
                  이달의 최다 참여
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {highestMonthly.name} -- {highestMonthly.meetup_count}회
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-lg bg-background/60 p-3">
            <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
            <div>
              <p className="text-[12px] font-medium text-foreground">
                미참여 멤버
              </p>
              <p className="text-[11px] text-muted-foreground">
                {neverAttended}명이 아직 벙 미참여
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 1: Growth + Distribution */}
      <div className="grid gap-4 lg:grid-cols-7">
        <ChartCard title="멤버 가입 추이" className="lg:col-span-4">
          {cumulativeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={cumulativeData}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="누적 멤버"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#growthGrad)"
                />
                <Bar dataKey="count" name="신규 가입" fill="#8b5cf6" opacity={0.6} radius={[2, 2, 0, 0]} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">데이터 없음</p>
          )}
        </ChartCard>

        <div className="grid gap-4 lg:col-span-3">
          <ChartCard title="성별 분포">
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    strokeWidth={2}
                    stroke="var(--background)"
                  >
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">데이터 없음</p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {genderData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">
                    {d.name} {d.value}명
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="멤버 구성">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="mb-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>기존 {regulars}명</span>
                  <span>신입 {newbies}명</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                    style={{
                      width: `${totalUsers > 0 ? (regulars / totalUsers) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px]">
                  <span className="font-medium text-blue-500">
                    {totalUsers > 0 ? Math.round((regulars / totalUsers) * 100) : 0}%
                  </span>
                  <span className="font-medium text-muted-foreground">
                    {totalUsers > 0 ? Math.round((newbies / totalUsers) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Charts row 2: Participation */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="참여 횟수 분포 (전체)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={participationDistData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="멤버 수" radius={[4, 4, 0, 0]}>
                {participationDistData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 멤버 비교">
          {radarUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" opacity={0.3} />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                {radarUsers.map((u, i) => (
                  <Radar
                    key={u.id}
                    name={u.name}
                    dataKey={u.name}
                    stroke={CHART_COLORS[i]}
                    fill={CHART_COLORS[i]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">데이터 없음</p>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {radarUsers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-1.5 text-[11px]">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i] }}
                />
                <span className="text-muted-foreground">{u.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Rankings side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="이달의 Top 10">
          {monthlyTop.length > 0 ? (
            <div className="space-y-2">
              {monthlyTop.map((u, i) => {
                const maxCount = monthlyTop[0]?.count || 1;
                return (
                  <div key={u.name} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                        i < 3
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          : "bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="truncate text-[12px] font-medium text-foreground">
                          {u.name}
                        </span>
                        <span className="flex-shrink-0 text-[12px] font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                          {u.count}회
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${(u.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              이달 참여 데이터 없음
            </p>
          )}
        </ChartCard>

        <ChartCard title="역대 Top 10">
          {allTimeTop.length > 0 ? (
            <div className="space-y-2">
              {allTimeTop.map((u, i) => {
                const maxCount = allTimeTop[0]?.count || 1;
                return (
                  <div key={u.name} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                        i < 3
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                          : "bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="truncate text-[12px] font-medium text-foreground">
                          {u.name}
                        </span>
                        <span className="flex-shrink-0 text-[12px] font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                          {u.count}회
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${(u.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">데이터 없음</p>
          )}
        </ChartCard>
      </div>

      {/* Full member table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/80">
        <div className="p-5">
          <h4 className="text-[13px] font-semibold text-foreground">전체 멤버 현황</h4>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {totalUsers}명의 멤버 데이터
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-t bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">#</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">이름</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">구분</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                  이달
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                  누적
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                  벙주
                </th>
                <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">
                  가입일
                </th>
                <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">
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
                    className="border-t border-border/40 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{u.name}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          u.is_regular === "신입"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.is_regular}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{u.meetup_count}</td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                      {u.total_meetup_count}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {u.meetup_make_count}
                    </td>
                    <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                      {u.join_date
                        ? new Date(u.join_date).toLocaleDateString("ko-KR", {
                            year: "2-digit",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                      {u.last_meetup_date
                        ? new Date(u.last_meetup_date).toLocaleDateString("ko-KR", {
                            year: "2-digit",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
