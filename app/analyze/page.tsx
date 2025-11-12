"use client";

import type React from "react";

import { useState, useMemo, useCallback } from "react";
import {
  Upload,
  FileText,
  Users,
  MessageCircle,
  Trophy,
  Medal,
  Award,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { SpicyLogo } from "@/components/spicy-logo";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserMessage {
  user: string;
  count: number;
}

interface WordCount {
  word: string;
  count: number;
}

interface ConversationMessage {
  timestamp: string;
  text: string;
}

interface UserConversationSummary {
  name: string;
  totalMessages: number;
  topWords: WordCount[];
  sampleMessages: ConversationMessage[];
}

interface TargetUserSummary {
  name: string;
  totalMessages: number;
  topWords: WordCount[];
  chronologicalMessages: ConversationMessage[];
}

interface AnalysisResult {
  userMessages: UserMessage[];
  totalMessages: number;
  analysisTable: UserConversationSummary[];
  targetUserSummary: TargetUserSummary | null;
  sessionId: string;
}

export default function Page() {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [dragActive, setDragActive] = useState(false);
  const [targetUser, setTargetUser] = useState("이호준");
  const [stopWords, setStopWords] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<UserConversationSummary | null>(null);
  const [modalMessages, setModalMessages] = useState<ConversationMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const oneMonthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );
    return oneMonthAgo.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setSearchTerm("");
    setSelectedParticipant(null);
    setModalMessages([]);
    setMessagesError(null);
    setIsDialogOpen(false);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("targetUser", targetUser);
    if (stopWords.trim().length > 0) {
      formData.append("stopWords", stopWords);
    }

    try {
      const response = await fetch("/api/analyze-chat", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          typeof errorData?.error === "string"
            ? errorData.error
            : "파일 처리에 실패했습니다."
        );
      }
      const data = (await response.json()) as AnalysisResult;
      setAnalysisResult(data);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">
            {index + 1}
          </span>
        );
    }
  };

  const filteredUserMessages = useMemo(() => {
    if (!analysisResult) {
      return [];
    }
    const needle = searchTerm.trim().toLowerCase();
    const base = analysisResult.userMessages;
    if (!needle) {
      return [...base];
    }
    return base.filter(({ user }) => user.toLowerCase().includes(needle));
  }, [analysisResult, searchTerm]);

  const filteredParticipants = useMemo(() => {
    if (!analysisResult) {
      return [];
    }
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) {
      return analysisResult.analysisTable;
    }
    return analysisResult.analysisTable.filter(({ name }) =>
      name.toLowerCase().includes(needle)
    );
  }, [analysisResult, searchTerm]);

  const participantMap = useMemo(() => {
    if (!analysisResult) {
      return new Map<string, UserConversationSummary>();
    }

    return new Map(
      analysisResult.analysisTable.map((summary) => [summary.name, summary] as const)
    );
  }, [analysisResult]);

  const handleParticipantClick = useCallback(
    async (participant: UserConversationSummary) => {
      if (!analysisResult?.sessionId) {
        return;
      }

      setSelectedParticipant(participant);
      setIsDialogOpen(true);
      setMessagesLoading(true);
      setMessagesError(null);
      setModalMessages([]);

      try {
        const response = await fetch(
          `/api/chat-analysis/messages?sessionId=${analysisResult.sessionId}&participant=${encodeURIComponent(
            participant.name
          )}`
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : "메시지를 불러오지 못했습니다."
          );
        }

        const data = await response.json();
        setModalMessages(data.messages ?? []);
      } catch (error) {
        console.error("Failed to load participant messages:", error);
        setMessagesError("메시지를 불러오지 못했습니다.");
      } finally {
        setMessagesLoading(false);
      }
    },
    [analysisResult]
  );

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedParticipant(null);
      setModalMessages([]);
      setMessagesError(null);
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-row gap-3 items-center">
              <SpicyLogo />
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                Kakao Chat Analyzer
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Upload Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-md sm:text-2xl font-bold text-gray-800 mb-2">
              채팅 파일을 업로드하세요
            </h2>
            <p className="text-sm sm:text-md text-gray-600">
              카카오톡 대화 내용을 분석하여 통계를 확인할 수 있습니다
            </p>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragActive
                ? "border-yellow-300 bg-yellow-50"
                : "border-gray-300 hover:border-yellow-300 hover:bg-yellow-50"
            } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleInputChange}
              accept=".txt,.csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />

            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                {isUploading ? (
                  <RotateCcw className={`w-8 h-8 text-gray-600 animate-spin`} />
                ) : (
                  <Upload className="w-8 h-8 text-yellow-600" />
                )}
              </div>

              <div>
                <p className="text-md sm:text-lg font-semibold text-gray-700 mb-1">
                  {isUploading ? (
                    <span>업로드 중...</span>
                  ) : (
                    <span>파일을 드래그하거나 클릭하여 업로드</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">지원 형식: .txt, .csv</p>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-yellow-600" />
              <span>분석 기간 설정</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  시작일
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  종료일
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const oneWeekAgo = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() - 7
                  );
                  setStartDate(oneWeekAgo.toISOString().split("T")[0]);
                  setEndDate(today.toISOString().split("T")[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                최근 1주일
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const oneMonthAgo = new Date(
                    today.getFullYear(),
                    today.getMonth() - 1,
                    today.getDate()
                  );
                  setStartDate(oneMonthAgo.toISOString().split("T")[0]);
                  setEndDate(today.toISOString().split("T")[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                최근 1개월
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const threeMonthsAgo = new Date(
                    today.getFullYear(),
                    today.getMonth() - 3,
                    today.getDate()
                  );
                  setStartDate(threeMonthsAgo.toISOString().split("T")[0]);
                  setEndDate(today.toISOString().split("T")[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                최근 3개월
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Options */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              분석 옵션
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="targetUser"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  집중 분석 대상
                </label>
                <input
                  id="targetUser"
                  type="text"
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  placeholder="예: 이호준"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  비워두면 자동으로 &ldquo;이호준&rdquo;을 사용합니다.
                </p>
              </div>
              <div>
                <label
                  htmlFor="stopWords"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  제외할 단어 목록
                </label>
                <textarea
                  id="stopWords"
                  value={stopWords}
                  onChange={(e) => setStopWords(e.target.value)}
                  placeholder="쉼표 또는 줄바꿈으로 단어를 구분하세요"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  기본 제외 단어에 더해 요청마다 동적으로 반영됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                참여자 검색
              </h3>
              <div className="space-y-2">
                <Input
                  placeholder="이름을 입력해 참여자를 검색하세요"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <p className="text-xs text-gray-500">
                  총 {analysisResult.userMessages.length.toLocaleString()}명 중{" "}
                  {filteredParticipants.length.toLocaleString()}명 표시 중
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">전체 메시지</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {analysisResult.totalMessages.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">참여자 수</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {analysisResult.userMessages.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ranking */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4" style={{ backgroundColor: "#FAE100" }}>
                <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>메시지 랭킹</span>
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredUserMessages
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((user, index) => {
                    const summary = participantMap.get(user.user);
                    return (
                      <button
                        key={user.user}
                        type="button"
                        onClick={() =>
                          summary ? handleParticipantClick(summary) : undefined
                        }
                        className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left ${
                          index < 3 ? "bg-yellow-50" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getRankIcon(index)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {user.user}
                            </p>
                            <p className="text-sm text-gray-500">
                              전체의{" "}
                              {(
                                (user.count / analysisResult.totalMessages) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-800">
                            {user.count.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">메시지</p>
                        </div>
                      </button>
                    );
                  })}
                {filteredUserMessages.length === 0 && (
                  <div className="px-6 py-8 text-center text-sm text-gray-500">
                    일치하는 참여자가 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* Target User Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  집중 분석: {analysisResult.targetUserSummary?.name ?? targetUser}
                </h3>
                <p className="text-sm text-gray-500">
                  메시지{" "}
                  {analysisResult.targetUserSummary
                    ? analysisResult.targetUserSummary.totalMessages.toLocaleString()
                    : "0"}
                  건
                </p>
              </div>
              <div className="p-6 space-y-6">
                {analysisResult.targetUserSummary ? (
                  <>
                    <section>
                      <h4 className="text-md font-semibold text-gray-700 mb-3">
                        많이 사용한 단어 TOP 10
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.targetUserSummary.topWords.slice(0, 10).map((word) => (
                          <span
                            key={word.word}
                            className="inline-flex items-center space-x-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{word.word}</span>
                            <span className="text-xs text-yellow-600">
                              {word.count.toLocaleString()}
                            </span>
                          </span>
                        ))}
                      </div>
                    </section>
                    <section>
                      <h4 className="text-md font-semibold text-gray-700 mb-3">
                        최근 대화 (최대 20건)
                      </h4>
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {analysisResult.targetUserSummary.chronologicalMessages
                          .slice(-20)
                          .map((message) => (
                            <div
                              key={`${message.timestamp}-${message.text}`}
                              className="border border-gray-100 rounded-lg px-4 py-3 bg-gray-50"
                            >
                              <p className="text-xs text-gray-500 mb-1">
                                {new Date(message.timestamp).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {message.text || "메시지 내용 없음"}
                              </p>
                            </div>
                          ))}
                      </div>
                    </section>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    대상 사용자의 메시지를 찾지 못했습니다. 이름을 다시 확인해주세요.
                  </p>
                )}
              </div>
            </div>

            {/* Per-user Detail Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  사용자별 상세 분석
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  각 사용자에 대한 단어 빈도와 최근 메시지를 빠르게 확인할 수 있습니다.
                </p>
              </div>
              <div className="p-6 space-y-6">
                {filteredParticipants.map((userSummary) => (
                  <button
                    key={userSummary.name}
                    type="button"
                    onClick={() => handleParticipantClick(userSummary)}
                    className="w-full text-left focus:outline-none"
                  >
                    <div className="border border-gray-100 rounded-xl p-4 hover:border-yellow-200 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                          <h4 className="text-md font-semibold text-gray-800">
                            {userSummary.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            총 {userSummary.totalMessages.toLocaleString()}건
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          상위 {Math.min(userSummary.topWords.length, 5)}개 단어
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {userSummary.topWords.slice(0, 5).map((word) => (
                          <span
                            key={`${userSummary.name}-${word.word}`}
                            className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{word.word}</span>
                            <span className="text-xs text-gray-500">
                              {word.count.toLocaleString()}
                            </span>
                          </span>
                        ))}
                        {userSummary.topWords.length === 0 && (
                          <span className="text-xs text-gray-400">
                            표시할 단어가 없습니다.
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                          최근 메시지 샘플
                        </p>
                        {userSummary.sampleMessages.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {userSummary.sampleMessages.map((message) => (
                              <div
                                key={`${userSummary.name}-${message.timestamp}-${message.text}`}
                                className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
                              >
                                <p className="text-[11px] text-gray-500 mb-1">
                                  {new Date(message.timestamp).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {message.text || "메시지 내용 없음"}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            표시할 메시지가 없습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredParticipants.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">
                    검색 결과가 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!analysisResult && !isUploading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500">
              파일을 업로드하면 분석 결과가 여기에 표시됩니다
            </p>
          </div>
        )}

        {analysisResult && (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedParticipant?.name ?? "참여자 메시지"}
                </DialogTitle>
                <DialogDescription>
                  {selectedParticipant
                    ? `총 ${selectedParticipant.totalMessages.toLocaleString()}건의 메시지 기록`
                    : "선택한 참여자의 모든 메시지를 확인합니다."}
                </DialogDescription>
              </DialogHeader>

              {messagesLoading ? (
                <div className="py-12 flex justify-center">
                  <RotateCcw className="w-6 h-6 text-gray-500 animate-spin" />
                </div>
              ) : messagesError ? (
                <p className="text-sm text-red-500">{messagesError}</p>
              ) : (
                <ScrollArea className="max-h-[60vh] pr-2">
                  <div className="space-y-3">
                    {modalMessages.map((message, index) => (
                      <div
                        key={`${message.timestamp}-${index}`}
                        className="border border-gray-100 rounded-lg px-4 py-3 bg-gray-50"
                      >
                        <p className="text-xs text-gray-500 mb-1">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {message.text || "메시지 내용 없음"}
                        </p>
                      </div>
                    ))}
                    {modalMessages.length === 0 && (
                      <p className="text-sm text-gray-500">
                        표시할 메시지가 없습니다.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
