'use client';
import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Users, Shuffle, Heart } from "lucide-react"

interface Participant {
    id: string
    name: string
}

interface Match {
    person1: string
    person2: string
}

export default function Page() {
    const [participants, setParticipants] = useState<Participant[]>([])
    const [newParticipantName, setNewParticipantName] = useState("")
    const [matches, setMatches] = useState<Match[]>([])
    const [isMatching, setIsMatching] = useState(false)
    const [showResults, setShowResults] = useState(false)

    const addParticipant = () => {
        if (newParticipantName.trim() && participants.length < 20) {
            const newParticipant: Participant = {
                id: Date.now().toString(),
                name: newParticipantName.trim(),
            }
            setParticipants([...participants, newParticipant])
            setNewParticipantName("")
        }
    }

    const removeParticipant = (id: string) => {
        setParticipants(participants.filter((p) => p.id !== id))
        setShowResults(false)
        setMatches([])
    }

    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }

    const startMatching = async () => {
        if (participants.length < 2) return

        setIsMatching(true)
        setShowResults(false)

        // 애니메이션을 위한 딜레이
        await new Promise((resolve) => setTimeout(resolve, 500))

        const shuffledParticipants = shuffleArray(participants)
        const newMatches: Match[] = []

        for (let i = 0; i < shuffledParticipants.length; i += 2) {
            if (i + 1 < shuffledParticipants.length) {
                newMatches.push({
                    person1: shuffledParticipants[i].name,
                    person2: shuffledParticipants[i + 1].name,
                })
            }
        }

        // 홀수인 경우 마지막 사람은 "행운의 주인공"
        if (shuffledParticipants.length % 2 === 1) {
            newMatches.push({
                person1: shuffledParticipants[shuffledParticipants.length - 1].name,
                person2: "행운의 주인공 ✨",
            })
        }

        setMatches(newMatches)
        setIsMatching(false)
        setShowResults(true)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            addParticipant()
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-3 sm:p-4">
            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="text-center space-y-2 pt-4 sm:pt-8">
                    <h1 className="text-2xl sm:text-4xl font-bold text-foreground text-balance">짝짓기</h1>
                </div>

                {/* Add Participant Section */}
                <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            참가자 추가
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="참가자 이름을 입력하세요"
                                value={newParticipantName}
                                onChange={(e) => setNewParticipantName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="flex-1 h-11 sm:h-10 text-base sm:text-sm"
                                maxLength={20}
                            />
                            <Button
                                onClick={addParticipant}
                                disabled={!newParticipantName.trim() || participants.length >= 20}
                                className="shrink-0 h-11 w-11 sm:h-10 sm:w-auto sm:px-4"
                                size="sm"
                            >
                                <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline ml-1">추가</span>
                            </Button>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            {participants.length}/20명 • 최소 2명 이상 필요
                        </div>
                    </CardContent>
                </Card>

                {/* Participants List */}
                {participants.length > 0 && (
                    <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
                        <CardHeader className="pb-3 sm:pb-6">
                            <CardTitle className="text-lg sm:text-xl">참가자 목록 ({participants.length}명)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 sm:gap-2">
                                {participants.map((participant, index) => (
                                    <Badge
                                        key={participant.id}
                                        variant="secondary"
                                        className="text-sm py-2.5 px-3 sm:py-2 sm:px-3 animate-in fade-in-0 slide-in-from-bottom-2 min-h-[36px] sm:min-h-auto flex items-center"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <span className="mr-2">{participant.name}</span>
                                        <button
                                            onClick={() => removeParticipant(participant.id)}
                                            className="hover:text-destructive transition-colors p-1 -m-1"
                                            aria-label={`${participant.name} 삭제`}
                                        >
                                            <X className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Start Matching Button */}
                {participants.length >= 2 && (
                    <div className="text-center px-4 sm:px-0">
                        <Button
                            onClick={startMatching}
                            disabled={isMatching}
                            size="lg"
                            className="text-base sm:text-lg px-8 py-4 sm:px-8 sm:py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto min-h-[56px]"
                        >
                            {isMatching ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                                    매칭 중...
                                </>
                            ) : (
                                <>
                                    <Shuffle className="w-5 h-5 mr-2" />
                                    짝짓기 시작!
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Results */}
                {showResults && matches.length > 0 && (
                    <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4">
                        <CardHeader className="pb-3 sm:pb-6">
                            <CardTitle className="text-center text-xl sm:text-2xl">🎉 매칭 결과 🎉</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                            {matches.map((match, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-center p-3 sm:p-4 bg-card rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-left-4"
                                    style={{ animationDelay: `${index * 200}ms` }}
                                >
                                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
                                        <div className="flex items-center gap-2 sm:gap-4 text-base sm:text-lg font-medium">
                                            <span className="text-primary font-semibold text-sm sm:text-base">{match.person1}</span>
                                            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 animate-pulse flex-shrink-0" />
                                            <span className="text-primary font-semibold text-sm sm:text-base">{match.person2}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="text-center pt-2 sm:pt-4">
                                <Button
                                    onClick={startMatching}
                                    variant="outline"
                                    className="hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent w-full sm:w-auto min-h-[44px]"
                                >
                                    <Shuffle className="w-4 h-4 mr-2" />
                                    다시 매칭하기
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {participants.length === 0 && (
                    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                        <CardContent className="text-center py-8 sm:py-12 px-4">
                            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">참가자를 추가해주세요</h3>
                            <p className="text-sm sm:text-base text-muted-foreground">최소 2명 이상의 참가자가 필요합니다</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}