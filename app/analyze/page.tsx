"use client";

import type React from "react";

import { useState } from "react";
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

interface UserMessage {
  user: string;
  count: number;
}

interface AnalysisResult {
  userMessages: UserMessage[];
  totalMessages: number;
}

export default function Page() {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [dragActive, setDragActive] = useState(false);
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
    const formData = new FormData();
    formData.append("file", file);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);

    try {
      const response = await fetch("/api/analyze-chat", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
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

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
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
                {analysisResult.userMessages
                  .sort((a, b) => b.count - a.count)
                  .map((user, index) => (
                    <div
                      key={user.user}
                      className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
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
                    </div>
                  ))}
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
      </div>
    </div>
  );
}
