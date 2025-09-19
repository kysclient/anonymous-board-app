import { User } from "@/app/dashboard/actions"
import { Badge } from "@/components/ui/badge"
import { Crown, Medal, Award } from "lucide-react"

interface RankingCardProps {
    user: User
    rank: number
    type: "monthly" | "total"
}

export function RankingCard({ user, rank, type }: RankingCardProps) {
    const count = type === "monthly" ? user.meetup_count : user.total_meetup_count

    const getRankDisplay = (rank: number) => {
        if (rank === 1) {
            return (
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-md">
                    <Crown className="w-5 h-5 text-white" />
                </div>
            )
        } else if (rank === 2) {
            return (
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full shadow-md">
                    <Medal className="w-5 h-5 text-white" />
                </div>
            )
        } else if (rank === 3) {
            return (
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full shadow-md">
                    <Award className="w-5 h-5 text-white" />
                </div>
            )
        } else {
            return (
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                    <span className="text-lg font-bold text-gray-600">{rank}</span>
                </div>
            )
        }
    }

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {getRankDisplay(rank)}
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                            <Badge
                                variant="secondary"
                                className={`text-xs px-2 py-1 ${user.is_regular === "신입"
                                        ? "bg-blue-50 text-blue-600 border-blue-200"
                                        : "bg-gray-50 text-gray-600 border-gray-200"
                                    }`}
                            >
                                {user.is_regular}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                            {user.join_date ? `${new Date(user.join_date).toLocaleDateString("ko-KR")} 가입` : "가입일 미상"}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{count}</div>
                    <p className="text-xs text-gray-500 font-medium">{type === "monthly" ? "이달 참여" : "총 참여"}</p>
                </div>
            </div>
        </div>
    )
}
