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
  const topUsers = [...users]
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
  const now = new Date();

  const deadlineUsers = users.filter((user) => {
    if (!user.join_date) return false;

    const joinDate = new Date(user.join_date);
    let limitDate = new Date(joinDate);

    // 신입은 1개월, 기존은 2개월
    if (user.is_regular === "신입") {
      limitDate.setMonth(limitDate.getMonth() + 1);
    } else if (user.is_regular === "기존") {
      if (!user.last_meetup_date) return false;
      const lasetMeetupDate = new Date(user.last_meetup_date);
      lasetMeetupDate.setMonth(lasetMeetupDate.getMonth() + 2);
      const diffDays = Math.floor(
        (lasetMeetupDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 7;
    } else {
      return false;
    }

    // 남은 일 수 계산 (음수면 이미 초과)
    const diffDays = Math.floor(
      (limitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 이미 초과했거나 앞으로 7일 이내인 경우
    return diffDays <= 7;
  });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row flex-wrap gap-2 items-center">
      <div className="w-[127px] tablet-x:w-[132px] h-[182px] bg-fc_superlight_gray rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-100 transition-colors"><div className="w-[70px] h-[70px] flex-shrink-0 relative mb-3"><img src="https://d228e474i2d5yf.cloudfront.net/ec95738c-7f8c-11ed-88ca-0af0e54df05d1n.png" alt="member face" className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" /></div><div className="flex flex-col items-center"><div className="flex justify-center gap-[5px]"><p className="text-[15px] font-bold text-fc_black text-center line-clamp-1">놀버녀</p></div><p className="mt-2 text-xs text-gray-400 text-center line-clamp-1 min-h-[16px]">이휘원</p></div></div>
      <div className="w-[127px] tablet-x:w-[132px] h-[182px] bg-fc_superlight_gray rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-100 transition-colors"><div className="w-[70px] h-[70px] flex-shrink-0 relative mb-3"><img src="https://d228e474i2d5yf.cloudfront.net/2958d6a6-cf72-11ef-9ce2-0a11cf6b2d491n.png" alt="member face" className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" /></div><div className="flex flex-col items-center"><div className="flex justify-center gap-[5px]"><p className="text-[15px] font-bold text-fc_black text-center line-clamp-1">여자김유신</p></div><p className="mt-2 text-xs text-gray-400 text-center line-clamp-1 min-h-[16px]">박수빈</p></div></div>
      <div className="w-[127px] tablet-x:w-[132px] h-[182px] bg-fc_superlight_gray rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-100 transition-colors"><div className="w-[70px] h-[70px] flex-shrink-0 relative mb-3"><img src="https://d228e474i2d5yf.cloudfront.net/969b9138-cd13-11ef-a2a8-0a94fe4cfbd91n.png" alt="member face" className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" /></div><div className="flex flex-col items-center"><div className="flex justify-center gap-[5px]"><p className="text-[15px] font-bold text-fc_black text-center line-clamp-1">차은욱</p></div><p className="mt-2 text-xs text-gray-400 text-center line-clamp-1 min-h-[16px]">박성준</p></div></div>
      <div className="w-[127px] tablet-x:w-[132px] h-[182px] bg-fc_superlight_gray rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-100 transition-colors"><div className="w-[70px] h-[70px] flex-shrink-0 relative mb-3"><img src="https://d228e474i2d5yf.cloudfront.net/50d9f408-6853-11ee-aba2-0a11f79edfdf1n.png" alt="member face" className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" /></div><div className="flex flex-col items-center"><div className="flex justify-center gap-[5px]"><p className="text-[15px] font-bold text-fc_black text-center line-clamp-1">차희생</p></div><p className="mt-2 text-xs text-gray-400 text-center line-clamp-1 min-h-[16px]">차미진</p></div></div>
      <div className="w-[127px] tablet-x:w-[132px] h-[182px] bg-fc_superlight_gray rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-100 transition-colors"><div className="w-[70px] h-[70px] flex-shrink-0 relative mb-3"><img src="https://d228e474i2d5yf.cloudfront.net/5400c5f0-df12-11ed-b691-0a5b7d2132231n.png" alt="member face" className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" /></div><div className="flex flex-col items-center"><div className="flex justify-center gap-[5px]"><p className="text-[15px] font-bold text-fc_black text-center line-clamp-1">5년만..하</p></div><p className="mt-2 text-xs text-gray-400 text-center line-clamp-1 min-h-[16px]">최이윤</p></div></div>
      <div className="w-[127px] tablet-x:w-[132px] h-[182px] bg-fc_superlight_gray rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-100 transition-colors"><div className="w-[70px] h-[70px] flex-shrink-0 relative mb-3"><img src="https://d228e474i2d5yf.cloudfront.net/b1923106-ac39-11ed-a6ef-0ae0f7b9e3cb1n.png" alt="member face" className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" /></div><div className="flex flex-col items-center"><div className="flex justify-center gap-[5px]"><p className="text-[15px] font-bold text-fc_black text-center line-clamp-1">할아버지</p></div><p className="mt-2 text-xs text-gray-400 text-center line-clamp-1 min-h-[16px]">김석휘</p></div></div>

      </div>
      <Image
        src={"/banner2.png"}
        alt="banner"
        width={2000}
        height={500}
        className="flex sm:hidden w-full max-h-[210px] object-cover border border-border rounded-xl"
      />
      <Tabs defaultValue="overview" className="space-y-4">
        {/* <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="rankings">랭킹</TabsTrigger>
          <TabsTrigger value="statistics">통계</TabsTrigger>
          <TabsTrigger value="activities">활동</TabsTrigger>
        </TabsList> */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-500 flex items-center">
                    +{newUsers} <ArrowUpRight className="h-3 w-3 ml-1" />
                  </span>{" "}
                  지난 30일 신규 가입
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  이번 달 벙 참여
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMeetups}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-500 flex items-center">
                    {averageMeetups} <ArrowUpRight className="h-3 w-3 ml-1" />
                  </span>{" "}
                  인당 평균 참여
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  최다 참여자
                </CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {topUsers.length > 0 ? topUsers[0].name : "-"}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-500 flex items-center">
                    {topUsers.length > 0 ? topUsers[0].meetup_count : 0}회{" "}
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </span>{" "}
                  이번 달 참여
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  신규 사용자
                </CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{newUsers}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-500 flex items-center">
                    {totalUsers > 0
                      ? Math.round((newUsers / totalUsers) * 100)
                      : 0}
                    % <ArrowUpRight className="h-3 w-3 ml-1" />
                  </span>{" "}
                  전체 사용자 대비
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>이달의 벙킹 Top 10</CardTitle>
                <CardDescription>
                  이번 달 벙 참여 횟수 기준 상위 10명
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      데이터가 없습니다
                    </p>
                  ) : (
                    topUsers.map((user, index) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : index === 1
                                ? "bg-gray-100 text-gray-700"
                                : index === 2
                                ? "bg-amber-100 text-amber-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div className="flex flex-row items-center gap-2">
                            <p className="text-sm font-medium leading-none">
                              {user.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-sm font-medium">
                            {user.meetup_count}회
                          </div>
                          <TrendingUp className="h-4 w-4 ml-2 text-emerald-500" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-4 sm:col-span-3">
              <CardHeader>
                <CardTitle>최근 벙 참여 활동</CardTitle>
                <CardDescription>최근 벙에 참여한 사용자 목록</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      데이터가 없습니다
                    </p>
                  ) : (
                    recentActivities.map((user) => (
                      <div key={user.id} className="flex items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.name}님이 벙에 참여했습니다
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
                                      <p className="text-center text-muted-foreground py-8">
                                        오빠 요새 바쁘니까 좀 이따 개발함
                                        </p>
                    {/* {deadlineUsers.map((user) => {
                      const joinDate = new Date(user.join_date || "");
                      const limitDate = new Date(joinDate);
                      if (user.is_regular === "신입") {
                        limitDate.setMonth(limitDate.getMonth() + 1);
                      } else if (user.is_regular === "기존") {
                        limitDate.setMonth(limitDate.getMonth() + 2);
                      }

                      return (
                        <div
                          key={user.id}
                          className="flex items-center gap-4 rounded-[12px] bg-muted p-2"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-medium leading-none">
                              {user.name} ({user.is_regular})
                            </p>
                            <p className="text-xs text-muted-foreground">
                              기한: {formatDateString(limitDate.toString())}
                            </p>
                          </div>
                        </div>
                      );
                    })} */}
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
