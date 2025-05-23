import { AvatarFallback } from "@/components/ui/avatar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { getUsers } from "./\bactions";
import { getAdminStatus } from "@/lib/actions";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function DashboardPage() {
  const isAdmin = await getAdminStatus();

  if (!isAdmin) {
    redirect("/");
  }

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

  return (
    <div className="flex flex-col gap-6">
      <Image
        src={"/banner.png"}
        alt="banner"
        width={2000}
        height={500}
        className="w-full max-h-[210px] object-cover border border-border rounded-lg"
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
            <Card className="col-span-3">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
