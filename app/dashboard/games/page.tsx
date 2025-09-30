"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dice1,
  Dice3,
  Heart,
  Flame,
  Sparkles,
  RefreshCw,
  Users,
  Trophy,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  is_regular?: string;
}

export default function GamesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [compatibilityUser1, setCompatibilityUser1] = useState<User | null>(
    null
  );
  const [compatibilityUser2, setCompatibilityUser2] = useState<User | null>(
    null
  );
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(
    null
  );

  useEffect(() => {
    // 실제로는 API에서 가져오지만, 여기서는 더미 데이터 사용
    const dummyUsers: User[] = [
      { id: 1, name: "놀버녀", is_regular: "기존" },
      { id: 2, name: "여자김유신", is_regular: "기존" },
      { id: 3, name: "차은욱", is_regular: "신입" },
      { id: 4, name: "차희생", is_regular: "기존" },
      { id: 5, name: "5년만..하", is_regular: "기존" },
      { id: 6, name: "할아버지", is_regular: "기존" },
    ];
    setUsers(dummyUsers);
  }, []);

  const spinRoulette = () => {
    if (isSpinning || users.length === 0) return;

    setIsSpinning(true);
    setSelectedUser(null);

    // 랜덤하게 멤버를 여러 번 보여주는 애니메이션
    let count = 0;
    const interval = setInterval(() => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      setSelectedUser(randomUser);
      count++;

      if (count > 15) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const calculateCompatibility = () => {
    if (!compatibilityUser1 || !compatibilityUser2) return;

    // 재미있는 궁합 계산 알고리즘
    const name1 = compatibilityUser1.name;
    const name2 = compatibilityUser2.name;
    const sum =
      name1.length * name2.length +
      name1.charCodeAt(0) +
      name2.charCodeAt(0);
    const score = (sum % 50) + 50; // 50~100 사이의 점수

    setCompatibilityScore(score);
  };

  const getCompatibilityMessage = (score: number) => {
    if (score >= 90) return "🔥 환상의 케미! 최고의 궁합이에요!";
    if (score >= 80) return "✨ 아주 좋은 궁합입니다!";
    if (score >= 70) return "😊 좋은 친구가 될 수 있어요!";
    if (score >= 60) return "👍 나쁘지 않은 궁합이에요!";
    return "🤔 노력이 필요할 수도...?";
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* 헤더 */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent">
            미니 게임
          </h1>
          <p className="text-muted-foreground mt-2">
            멤버들과 함께 즐기는 재미있는 게임들
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 랜덤 멤버 뽑기 */}
        <Card className="border-primary/20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-red-500/10 to-orange-500/10">
            <CardTitle className="flex items-center gap-2">
              <Dice3 className="h-5 w-5 text-primary" />
              랜덤 멤버 뽑기
            </CardTitle>
            <CardDescription>
              오늘의 행운의 멤버는 누구일까요?
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6">
              {selectedUser && (
                <div
                  key={selectedUser.id}
                  className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-red-500/20 w-full animate-in fade-in zoom-in duration-300"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-red-500 flex items-center justify-center">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser.is_regular}
                    </p>
                  </div>
                </div>
              )}

              {!selectedUser && (
                <div className="flex items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed border-primary/30">
                  <p className="text-muted-foreground">
                    버튼을 눌러 멤버를 뽑아보세요!
                  </p>
                </div>
              )}

              <Button
                onClick={spinRoulette}
                disabled={isSpinning}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-red-500 hover:from-primary/90 hover:to-red-500/90"
              >
                {isSpinning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    뽑는 중...
                  </>
                ) : (
                  <>
                    <Dice1 className="mr-2 h-4 w-4" />
                    멤버 뽑기
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 궁합 테스트 */}
        <Card className="border-primary/20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-pink-500/10 via-red-500/10 to-orange-500/10">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              궁합 테스트
            </CardTitle>
            <CardDescription>
              두 멤버의 케미를 확인해보세요!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="w-full p-2 rounded-lg border bg-background"
                  value={compatibilityUser1?.id || ""}
                  onChange={(e) => {
                    const user = users.find(
                      (u) => u.id === parseInt(e.target.value)
                    );
                    setCompatibilityUser1(user || null);
                    setCompatibilityScore(null);
                  }}
                >
                  <option value="">멤버 1 선택</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full p-2 rounded-lg border bg-background"
                  value={compatibilityUser2?.id || ""}
                  onChange={(e) => {
                    const user = users.find(
                      (u) => u.id === parseInt(e.target.value)
                    );
                    setCompatibilityUser2(user || null);
                    setCompatibilityScore(null);
                  }}
                >
                  <option value="">멤버 2 선택</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={calculateCompatibility}
                disabled={!compatibilityUser1 || !compatibilityUser2}
                size="lg"
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                궁합 확인하기
              </Button>

              {compatibilityScore !== null && (
                <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-red-500/20 animate-in fade-in zoom-in duration-500">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      궁합 점수
                    </p>
                    <p className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                      {compatibilityScore}%
                    </p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-1000 ease-out"
                      style={{ width: `${compatibilityScore}%` }}
                    />
                  </div>
                  <p className="text-center text-sm font-medium">
                    {getCompatibilityMessage(compatibilityScore)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이달의 MVP */}
      <Card className="border-primary/20 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            이달의 MVP 예측
          </CardTitle>
          <CardDescription>
            다음 달 최고 참여자가 될 멤버를 예측해보세요!
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {users.map((user) => (
              <button
                key={user.id}
                className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-accent/50 to-background hover:from-amber-500/20 hover:to-orange-500/20 hover:shadow-lg transition-all group border border-transparent hover:border-amber-500/50"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-bold text-center">{user.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.is_regular}
                </p>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            💡 예측 기능은 곧 추가될 예정입니다!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}