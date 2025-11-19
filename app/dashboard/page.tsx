import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatDateString } from "@/lib/utils";
import {
  ArrowUpRight,
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  UserPlus,
  Copy,
} from "lucide-react";
import { getUsers } from "./actions";
import { getAdminStatus } from "@/lib/actions";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/copy-button";

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
    <div className="flex flex-col gap-6 pb-8">


      {/* 인기 멤버 섹션 */}
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-red-500/10 to-orange-500/10">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
       
            <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-accent/50 to-background hover:from-accent hover:shadow-lg transition-all cursor-pointer group">
              <div className="w-16 h-16 md:w-20 md:h-20 relative mb-3 ring-2 ring-primary/20 group-hover:ring-primary/60 rounded-full transition-all">
                <img src="https://d228e474i2d5yf.cloudfront.net/ec95738c-7f8c-11ed-88ca-0af0e54df05d1n.png" alt="member" className="w-full h-full rounded-full object-cover" loading="lazy" />
              </div>
              <p className="text-sm font-bold text-center">뒷방늙은이</p>
              <p className="text-xs text-muted-foreground">이휘원</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-accent/50 to-background hover:from-accent hover:shadow-lg transition-all cursor-pointer group">
              <div className="w-16 h-16 md:w-20 md:h-20 relative mb-3 ring-2 ring-primary/20 group-hover:ring-primary/60 rounded-full transition-all">
                <video
                  src="/subin.mp4"
                  playsInline
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <p className="text-sm font-bold text-center">차기모임장</p>
              <p className="text-xs text-muted-foreground">박수빈</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-accent/50 to-background hover:from-accent hover:shadow-lg transition-all cursor-pointer group">
              <div className="w-16 h-16 md:w-20 md:h-20 relative mb-3 ring-2 ring-primary/20 group-hover:ring-primary/60 rounded-full transition-all">
                <img src="https://d228e474i2d5yf.cloudfront.net/969b9138-cd13-11ef-a2a8-0a94fe4cfbd91n.png" alt="member" className="w-full h-full rounded-full object-cover" loading="lazy" />
              </div>
              <p className="text-sm font-bold text-center">차은욱</p>
              <p className="text-xs text-muted-foreground">박성준</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-accent/50 to-background hover:from-accent hover:shadow-lg transition-all cursor-pointer group">
              <div className="w-16 h-16 md:w-20 md:h-20 relative mb-3 ring-2 ring-primary/20 group-hover:ring-primary/60 rounded-full transition-all">
                <img src="https://d228e474i2d5yf.cloudfront.net/50d9f408-6853-11ee-aba2-0a11f79edfdf1n.png" alt="member" className="w-full h-full rounded-full object-cover" loading="lazy" />
              </div>
              <p className="text-sm font-bold text-center">차희생</p>
              <p className="text-xs text-muted-foreground">차미진</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-accent/50 to-background hover:from-accent hover:shadow-lg transition-all cursor-pointer group">
              <div className="w-16 h-16 md:w-20 md:h-20 relative mb-3 ring-2 ring-primary/20 group-hover:ring-primary/60 rounded-full transition-all">
                <img src="https://d228e474i2d5yf.cloudfront.net/5400c5f0-df12-11ed-b691-0a5b7d2132231n.png" alt="member" className="w-full h-full rounded-full object-cover" loading="lazy" />
              </div>
              <p className="text-sm font-bold text-center">5년만..하</p>
              <p className="text-xs text-muted-foreground">최이윤</p>
            </div>
            {/* <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-accent/50 to-background hover:from-accent hover:shadow-lg transition-all cursor-pointer group">
              <div className="w-16 h-16 md:w-20 md:h-20 relative mb-3 ring-2 ring-primary/20 group-hover:ring-primary/60 rounded-full transition-all">
                <img src="https://d228e474i2d5yf.cloudfront.net/b1923106-ac39-11ed-a6ef-0ae0f7b9e3cb1n.png" alt="member" className="w-full h-full rounded-full object-cover" loading="lazy" />
              </div>
              <p className="text-sm font-bold text-center">할아버지</p>
              <p className="text-xs text-muted-foreground">김석휘</p>
            </div> */}
          </div>
        </CardContent>
      </Card>


      <Image
        src={"/banner2.png"}
        alt="banner"
        width={2000}
        height={500}
        className="flex sm:hidden w-full max-h-[210px] object-cover border border-primary/20 rounded-xl shadow-lg"
      />
      <Tabs defaultValue="overview" className="space-y-4">
        {/* <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="rankings">랭킹</TabsTrigger>
          <TabsTrigger value="statistics">통계</TabsTrigger>
          <TabsTrigger value="activities">활동</TabsTrigger>
        </TabsList> */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary/5 to-transparent">
                <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-red-500 bg-clip-text text-transparent">
                  {totalUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="text-emerald-500 font-semibold flex items-center">
                    +{newUsers} <ArrowUpRight className="h-3 w-3" />
                  </span>
                  지난 30일 신규 가입
                </p>
              </CardContent>
            </Card>
            {/* <Card className="overflow-hidden border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-red-500/5 to-transparent">
                <CardTitle className="text-sm font-medium">
                  이번 달 벙 참여
                </CardTitle>
                <div className="p-2 rounded-full bg-red-500/10">
                  <Calendar className="h-4 w-4 text-red-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  {totalMeetups}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="text-emerald-500 font-semibold flex items-center">
                    {averageMeetups} <ArrowUpRight className="h-3 w-3" />
                  </span>
                  인당 평균 참여
                </p>
              </CardContent>
            </Card> */}
            <Card className="overflow-hidden border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-orange-500/5 to-transparent">
                <CardTitle className="text-sm font-medium">
                  최다 참여자
                </CardTitle>
                <div className="p-2 rounded-full bg-orange-500/10">
                  <Trophy className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  {topUsers.length > 0 ? topUsers[0].name : "-"}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="text-emerald-500 font-semibold flex items-center">
                    {topUsers.length > 0 ? topUsers[0].meetup_count : 0}회{" "}
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                  이번 달 참여
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-amber-500/5 to-transparent">
                <CardTitle className="text-sm font-medium">
                  신규 사용자
                </CardTitle>
                <div className="p-2 rounded-full bg-amber-500/10">
                  <UserPlus className="h-4 w-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  {newUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="text-emerald-500 font-semibold flex items-center">
                    {totalUsers > 0
                      ? Math.round((newUsers / totalUsers) * 100)
                      : 0}
                    % <ArrowUpRight className="h-3 w-3" />
                  </span>
                  전체 사용자 대비
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4 border-primary/20 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  이달의 벙킹 Top 10
                </CardTitle>
                <CardDescription>
                  이번 달 벙 참여 횟수 기준 상위 10명
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {topUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      데이터가 없습니다
                    </p>
                  ) : (
                    topUsers.map((user, index) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-transform group-hover:scale-110 ${index === 0
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg"
                              : index === 1
                                ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md"
                                : index === 2
                                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md"
                                  : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {index + 1}
                          </div>

                          <div className="flex flex-col">
                            <p className="text-sm font-semibold leading-none">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {index === 0 ? "🔥 최고의 참여자" : index === 1 ? "✨ 우수 참여자" : index === 2 ? "⭐ 적극 참여자" : "참여자"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10">
                          <div className="text-sm font-bold text-primary">
                            {user.meetup_count}회
                          </div>
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3 border-primary/20 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-500/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                  최근 벙 참여 활동
                </CardTitle>
                <CardDescription>최근 벙에 참여한 사용자 목록</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {recentActivities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      데이터가 없습니다
                    </p>
                  ) : (
                    recentActivities.map((user) => (
                      <div key={user.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 animate-pulse" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            <span className="text-primary font-semibold">{user.name}</span>님이 벙에 참여했습니다
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.last_meetup_date
                              ? formatDateString(user.last_meetup_date)
                              : "-"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>참여 기한 임박자</CardTitle>
                <CardDescription>
                  마지막 기한이 일주일 남은 사용자
                </CardDescription>
              </div>

              {/* 복사 버튼 */}
              <CopyButton deadlineUsers={deadlineUsers} />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deadlineUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    데이터가 없습니다
                  </p>
                ) : (
                  <div className="flex flex-row items-center gap-[20px] flex-wrap">
                    {deadlineUsers.map((user) => {
                      const isOverdue = user.diffDays < 0;
                      return (
                        <div
                          key={user.id}
                          className={`flex items-center gap-4 rounded-[12px] p-3 ${isOverdue
                            ? "bg-red-500/10 border border-red-500/30"
                            : "bg-orange-500/10 border border-orange-500/30"
                            }`}
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none flex items-center gap-2">
                              {user.name}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${user.is_regular === "신입"
                                ? "bg-blue-500/20 text-blue-600"
                                : "bg-purple-500/20 text-purple-600"
                                }`}>
                                {user.is_regular}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              기한: {formatDateString(user.limitDate.toString())}
                            </p>
                            <p className={`text-xs font-semibold ${isOverdue ? "text-red-600" : "text-orange-600"
                              }`}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
