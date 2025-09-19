"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RotateCcw, Users, TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { StatsCard } from "@/components/stats-card"
import { RankingCard } from "@/components/ranking-card"
import { getUsers, User } from "../dashboard/actions"
import { SpicyLogo } from "@/components/spicy-logo"

export default function RankingPage() {
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<"monthly" | "total">("monthly")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const userData = await getUsers("join_date", "desc", searchTerm)
      setUsers(userData)
    } catch (error) {
      console.error("사용자 데이터 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    await loadUsers()
  }

  const getSortedUsers = (type: "monthly" | "total") => {
    return [...users].sort((a, b) => {
      const countA = type === "monthly" ? a.meetup_count : a.total_meetup_count
      const countB = type === "monthly" ? b.meetup_count : b.total_meetup_count
      return countB - countA
    })
  }

  const currentUsers = getSortedUsers(activeTab)
  const totalParticipation = currentUsers.reduce(
    (sum, user) => sum + (activeTab === "monthly" ? user.meetup_count : user.total_meetup_count),
    0,
  )
  const averageParticipation = currentUsers.length > 0 ? Math.round(totalParticipation / currentUsers.length) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-6">
            <SpicyLogo />
            <Button
              variant="ghost"
              size="icon"
              onClick={loadUsers}
              disabled={isLoading}
              className="hover:bg-gray-100 bg-transparent"
            >
              <RotateCcw className={`w-5 h-5 text-gray-600 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="멤버 이름으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-12 h-12 bg-gray-50 border-0 rounded-xl text-base placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-5 py-4">
        <div className="bg-gray-100 rounded-xl p-1">
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="ghost"
              onClick={() => setActiveTab("monthly")}
              className={`h-12 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === "monthly"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              이달의 랭킹
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("total")}
              className={`h-12 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === "total"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              전체 랭킹
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            title="총 멤버"
            value={currentUsers.length}
            subtitle="활성 멤버"
            icon={<Users className="w-5 h-5" />}
          />
          <StatsCard
            title={activeTab === "monthly" ? "이달 총 참여" : "전체 총 참여"}
            value={totalParticipation}
            subtitle={`평균 ${averageParticipation}회`}
            icon={<BarChart3 className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Ranking List */}
      <div className="px-5 pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">랭킹을 불러오는 중...</p>
          </div>
        ) : currentUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">검색 결과가 없어요</h3>
            <p className="text-gray-500 text-center">다른 검색어로 다시 시도해보세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentUsers.map((user, index) => (
              <RankingCard key={user.id} user={user} rank={index + 1} type={activeTab} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Safe Area */}
      <div className="h-8"></div>
    </div>
  )
}
