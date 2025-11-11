"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Settings, Trophy, ArrowLeft, RotateCcw } from "lucide-react";

type GenderType = "남" | "여" | "기타";

type Candidate = {
  id: number;
  name: string;
  profile_image: string;
  gender: GenderType;
};

type User = {
  id: number;
  name: string;
  profile_image?: string;
  gender?: GenderType;
};

function WorldCupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentRound, setCurrentRound] = useState<Candidate[]>([]);
  const [currentPair, setCurrentPair] = useState<[Candidate, Candidate] | null>(
    null
  );
  const [winners, setWinners] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roundNumber, setRoundNumber] = useState(16);
  const [pairIndex, setPairIndex] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [finalWinner, setFinalWinner] = useState<Candidate | null>(null);

  useEffect(() => {
    if (searchParams) {
      checkUserProfile();
    }
  }, [searchParams]);

  const checkUserProfile = async () => {
    try {
      const userId = searchParams.get("userId");
      console.log("🔍 Checking user profile for userId:", userId);

      if (!userId) {
        console.log("❌ No userId found, redirecting to profile");
        router.push("/dashboard/worldcup/profile");
        return;
      }

      console.log("📡 Fetching user data...");
      const response = await fetch(`/api/worldcup/users/${userId}`);
      if (!response.ok) {
        console.log("❌ User fetch failed, redirecting to profile");
        router.push("/dashboard/worldcup/profile");
        return;
      }

      const data = await response.json();
      console.log("✅ User data received:", data);

      if (!data.user.gender || !data.user.profile_image) {
        console.log(
          "⚠️ User missing gender or profile image, redirecting to profile setup"
        );
        router.push(`/dashboard/worldcup/profile?userId=${userId}`);
        return;
      }

      console.log("✅ User profile verified, loading candidates...");
      setCurrentUser(data.user);
      await loadCandidates(data.user.gender, parseInt(userId));
    } catch (error) {
      console.error("❌ 프로필 확인 오류:", error);
      router.push("/dashboard/worldcup/profile");
    }
  };

  const loadCandidates = async (userGender: GenderType, userId: number) => {
    try {
      const response = await fetch(
        `/api/worldcup/candidates?userGender=${userGender}&userId=${userId}`
      );
      if (!response.ok) {
        throw new Error("후보자 불러오기 실패");
      }

      const data = await response.json();

      if (data.candidates.length < 2) {
        setIsLoading(false);
        window.alert("이상형 월드컵을 진행할 수 있는 후보자가 부족합니다.");
        return;
      }

      // 후보자를 랜덤하게 섞기
      const shuffled = [...data.candidates].sort(() => Math.random() - 0.5);

      let selected = shuffled;

      // 무조건 짝수로 맞추기
      // if (selected.length % 2 !== 0) {
      //   selected = selected.slice(0, -1);
      // }

      setCandidates(selected);
      setCurrentRound(selected);
      setRoundNumber(selected.length);
      setCurrentPair([selected[0], selected[1]]);
      setPairIndex(0);
      setIsLoading(false);
    } catch (error) {
      console.error("후보자 불러오기 오류:", error);
      window.alert("후보자를 불러오는데 실패했습니다.");
      setIsLoading(false);
    }
  };

  const handleChoice = (winner: Candidate) => {
    const newWinners = [...winners, winner];
    setWinners(newWinners);

    const nextPairIndex = pairIndex + 2;

    // 🔹 현재 라운드 끝났을 경우
    if (nextPairIndex >= currentRound.length) {
      let nextRound = [...newWinners];

      // 🔹 부전승 처리
      if (currentRound.length % 2 !== 0) {
        const byeCandidate = currentRound[currentRound.length - 1];
        if (!nextRound.some((c) => c.id === byeCandidate.id)) {
          nextRound.push(byeCandidate);
        }
      }

      // 🔹 우승자 확정
      if (nextRound.length === 1) {
        setFinalWinner(nextRound[0]);
        setGameFinished(true);
        saveResult(nextRound[0].id);
        return;
      }

      // 🔹 다음 라운드로
      setCurrentRound(nextRound);
      setWinners([]);
      setRoundNumber(nextRound.length);
      setPairIndex(0);

      if (nextRound.length >= 2) {
        setCurrentPair([nextRound[0], nextRound[1]]);
      } else {
        // 짝이 안 되면 null로
        setCurrentPair(null);
      }

      return;
    }

    // 🔹 아직 라운드가 남아 있을 때
    const next1 = currentRound[nextPairIndex];
    const next2 = currentRound[nextPairIndex + 1];

    if (!next2) {
      // 홀수일 때 짝이 없는 경우 → 부전승 처리
      const nextRound = [...newWinners, next1];
      setWinners([]);
      setCurrentRound(nextRound);
      setRoundNumber(nextRound.length);
      setPairIndex(0);

      if (nextRound.length >= 2) {
        setCurrentPair([nextRound[0], nextRound[1]]);
      } else {
        setCurrentPair(null);
      }

      return;
    }

    // 🔹 다음 대결 세팅
    setPairIndex(nextPairIndex);
    setCurrentPair([next1, next2]);
  };

  const saveResult = async (winnerId: number) => {
    try {
      await fetch("/api/worldcup/result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ winnerId }),
      });
    } catch (error) {
      console.error("결과 저장 오류:", error);
    }
  };

  const handleRestart = () => {
    setGameFinished(false);
    setFinalWinner(null);
    setWinners([]);
    setPairIndex(0);
    if (currentUser?.gender && currentUser?.id) {
      loadCandidates(currentUser.gender, currentUser.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (gameFinished && finalWinner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="space-y-2">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">
                우승!
              </h1>
              <p className="text-muted-foreground">당신의 이상형은...</p>
            </div>

            <Card className="border-primary/20 shadow-2xl overflow-hidden">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-48 h-48 border-4 border-yellow-500 shadow-lg">
                    <AvatarImage src={finalWinner.profile_image} />
                    <AvatarFallback>{finalWinner.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold">{finalWinner.name}</h2>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                      <span>최종 선택</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleRestart}
                size="lg"
                className="flex-1 bg-gradient-to-r from-primary to-pink-500"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                다시 하기
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                size="lg"
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              이상형 월드컵
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {roundNumber}강 {pairIndex / 2 + 1}/{currentRound.length / 2}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/worldcup/profile")}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* 대결 카드 */}
        {currentPair && (
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {currentPair.map((candidate, index) => (
              <div
                key={`${candidate.id}-${pairIndex}`}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card
                  className="border-primary/20 shadow-xl hover:shadow-2xl transition-all cursor-pointer group overflow-hidden"
                  onClick={() => handleChoice(candidate)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-accent/20 to-accent/5">
                      <img
                        src={candidate?.profile_image}
                        alt={candidate?.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {candidate?.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-pink-500" />
                          <span className="text-white/90 text-sm">
                            선택하기
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* VS 표시 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block pointer-events-none">
          <div className="text-6xl font-bold text-primary/20">VS</div>
        </div>
      </div>
    </div>
  );
}

export default function WorldCupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      }
    >
      <WorldCupContent />
    </Suspense>
  );
}
