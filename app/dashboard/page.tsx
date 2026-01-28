import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateString } from "@/lib/utils";
import { Users, Calendar, Trophy, TrendingUp, UserPlus } from "lucide-react";
import { getUsers } from "./actions";
import CopyButton from "@/components/copy-button";
import MastersStrip from "@/components/masters-strip";

export const revalidate = 0;

export default async function DashboardPage() {


  // 사용자 데이터 가져오기
  const users = await getUsers();

  // 통계 계산
  const totalUsers = users.length;
  const totalMeetups = users.reduce((sum, user) => sum + user.meetup_count, 0);
  const averageMeetups =
    totalUsers > 0 ? (totalMeetups / totalUsers).toFixed(1) : "0";

  // 신규 사용자 (최근 30일 이내 가입)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsers = users.filter(
    (user) => user.join_date && new Date(user.join_date) >= thirtyDaysAgo
  ).length;

  // 이달의 벙킹 Top 10 (이번 달 벙 참여 횟수 기준)
  const now = new Date();
  const topUsers = [...users]
    .filter((user) => user.meetup_count > 0)
    .sort((a, b) => b.meetup_count - a.meetup_count)
    .slice(0, 10);

  // 최근 벙 참여 활동 (최근 벙 참석일 기준)
  const recentActivities = [...users]
    .filter((user) => user.last_meetup_date)
    .sort(
      (a, b) =>
        new Date(b.last_meetup_date || "").getTime() -
        new Date(a.last_meetup_date || "").getTime()
    )
    .slice(0, 10);

  // 참여 기한 임박 + 초과 사용자
  const deadlineUsers = users
    .filter((user) => {
      if (user.is_regular === "신입") {
        // 신입: join_date 기준 1개월
        if (!user.join_date) return false;
        const joinDate = new Date(user.join_date);
        const limitDate = new Date(joinDate);
        limitDate.setMonth(limitDate.getMonth() + 1);
        const diffDays = Math.floor(
          (limitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= 7;
      } else if (user.is_regular === "기존") {
        // 기존: last_meetup_date 기준 2개월
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
      // 각 사용자의 기한 날짜 계산
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
    .sort((a, b) => a.diffDays - b.diffDays); // 남은 기한이 적은 순으로 정렬
  return (
    <div className="flex flex-col gap-6 pb-10">
      <MastersStrip />

      <section className="rounded-2xl border bg-card/60 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            운영 대시보드
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              26년도 솔로일 사람들 모임
            </h1>
            <p className="text-xs text-muted-foreground">
              ㅋ
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-background/80 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>총 사용자</span>
                <Users className="h-3.5 w-3.5" />
              </div>
              <p className="mt-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
                {totalUsers}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                최근 30일 +{newUsers}명
              </p>
            </div>
            <div className="rounded-lg border bg-background/80 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>이번 달 참여</span>
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <p className="mt-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
                {totalMeetups}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                인당 평균 {averageMeetups}회
              </p>
            </div>
            <div className="rounded-lg border bg-background/80 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>최다 참여자</span>
                <Trophy className="h-3.5 w-3.5" />
              </div>
              <p className="mt-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
                {topUsers.length > 0 ? topUsers[0].name : "-"}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {topUsers.length > 0 ? topUsers[0].meetup_count : 0}회 참여
              </p>
            </div>
            <div className="rounded-lg border bg-background/80 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>신규 사용자</span>
                <UserPlus className="h-3.5 w-3.5" />
              </div>
              <p className="mt-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
                {newUsers}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {totalUsers > 0
                  ? Math.round((newUsers / totalUsers) * 100)
                  : 0}
                % 비중
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              이달의 벙킹 Top 10
            </CardTitle>
            <CardDescription className="text-xs">
              이번 달 벙 참여 횟수 기준 상위 10명
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                데이터가 없습니다
              </p>
            ) : (
              topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border bg-background/60 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${index < 3
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold leading-none">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        이번 달 {user.meetup_count}회 참여
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>{user.meetup_count}회</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              최근 벙 참여 활동
            </CardTitle>
            <CardDescription className="text-xs">
              최근 벙에 참여한 사용자 목록
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                데이터가 없습니다
              </p>
            ) : (
              recentActivities.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start gap-3 rounded-lg border bg-background/60 px-3 py-2"
                >
                  <div className="mt-2 h-2 w-2 rounded-full bg-blue-500/60" />
                  <div className="flex-1 space-y-1">
                    <p className="text-[13px] font-medium leading-none">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {user.name}
                      </span>
                      님이 벙에 참여했습니다
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {user.last_meetup_date
                        ? formatDateString(user.last_meetup_date)
                        : "-"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="w-full border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">참여 기한 임박자</CardTitle>
            <CardDescription className="text-xs">
              마지막 기한이 일주일 남은 사용자
            </CardDescription>
          </div>
          <CopyButton deadlineUsers={deadlineUsers} />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deadlineUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                데이터가 없습니다
              </p>
            ) : (
              <div className="flex flex-row items-center gap-4 flex-wrap">
                {deadlineUsers.map((user) => {
                  const isOverdue = user.diffDays < 0;
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-4 rounded-lg border p-3 ${isOverdue
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-muted/40 border-border/60"
                        }`}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none flex items-center gap-2">
                          {user.name}
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full ${user.is_regular === "신입"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {user.is_regular}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          기한: {formatDateString(user.limitDate.toString())}
                        </p>
                        <p
                          className={`text-xs font-semibold ${isOverdue
                            ? "text-red-600"
                            : "text-muted-foreground"
                            }`}
                        >
                          {isOverdue
                            ? `${Math.abs(user.diffDays)}일 초과`
                            : `${user.diffDays}일 남음`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
