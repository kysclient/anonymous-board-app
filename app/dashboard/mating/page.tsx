"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Users, Shuffle, Download } from "lucide-react"
import Image from "next/image"

interface Participant {
    id: string
    name: string
    gender: "male" | "female"
}

interface TableSeat {
    participant: string
    gender: "male" | "female"
    position: number
}

export default function Page() {
    const [participants, setParticipants] = useState<Participant[]>([])
    const [newParticipantName, setNewParticipantName] = useState("")
    const [newParticipantGender, setNewParticipantGender] = useState<"male" | "female">("male")
    const [tableSeats, setTableSeats] = useState<TableSeat[]>([])
    const [isMatching, setIsMatching] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const resultsRef = useRef<HTMLDivElement>(null)

    const addParticipant = () => {
        if (newParticipantName.trim() && participants.length < 50) {
            const newParticipant: Participant = {
                id: Date.now().toString(),
                name: newParticipantName.trim(),
                gender: newParticipantGender,
            }
            setParticipants([...participants, newParticipant])
            setNewParticipantName("")
        }
    }

    const removeParticipant = (id: string) => {
        setParticipants(participants.filter((p) => p.id !== id))
        setShowResults(false)
        setTableSeats([])
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
        await new Promise((resolve) => setTimeout(resolve, 700))

        const males = participants.filter((p) => p.gender === "male")
        const females = participants.filter((p) => p.gender === "female")

        // 각 성별을 섞어줌
        const shuffledMales = shuffleArray(males)
        const shuffledFemales = shuffleArray(females)

        const newTableSeats: TableSeat[] = []
        const totalSeats = participants.length

        // 개선된 남녀 배치 알고리즘 - 소수 성별을 균등하게 분산
        let maleIndex = 0
        let femaleIndex = 0

        const maleCount = shuffledMales.length
        const femaleCount = shuffledFemales.length

        // 소수 성별과 다수 성별 구분
        const isFemaleLess = femaleCount < maleCount
        const minorCount = Math.min(maleCount, femaleCount)
        const majorCount = Math.max(maleCount, femaleCount)

        // 소수 성별을 배치할 간격 계산 (균등하게 분산)
        const interval = minorCount > 0 ? totalSeats / (minorCount + 1) : totalSeats + 1

        let consecutiveCount = 0
        let lastGender: "male" | "female" | null = null

        for (let position = 0; position < totalSeats; position++) {
            let selectedGender: "male" | "female" | null = null

            const malesLeft = maleCount - maleIndex
            const femalesLeft = femaleCount - femaleIndex
            const remainingSeats = totalSeats - position

            // 둘 중 하나가 다 떨어졌으면 나머지 성별 배치
            if (malesLeft === 0) {
                selectedGender = "female"
            } else if (femalesLeft === 0) {
                selectedGender = "male"
            } else {
                // 같은 성별이 2명 연속이면 다른 성별을 우선 배치
                if (consecutiveCount >= 2 && lastGender) {
                    selectedGender = lastGender === "male" ? "female" : "male"
                } else {
                    // 남은 좌석과 남은 인원의 비율을 고려하여 배치
                    // 소수 성별이 남은 좌석 대비 부족하면 우선 배치
                    const maleRatio = malesLeft / remainingSeats
                    const femaleRatio = femalesLeft / remainingSeats

                    // 이전과 다른 성별을 우선하되, 비율이 너무 낮으면 강제 배치
                    if (lastGender === "male") {
                        // 여성 비율이 0.3 이상이면 여성 배치
                        if (femaleRatio >= 0.3) {
                            selectedGender = "female"
                        } else {
                            selectedGender = "male"
                        }
                    } else if (lastGender === "female") {
                        // 남성 비율이 0.3 이상이면 남성 배치
                        if (maleRatio >= 0.3) {
                            selectedGender = "male"
                        } else {
                            selectedGender = "female"
                        }
                    } else {
                        // 첫 번째 자리는 더 많은 성별부터
                        selectedGender = malesLeft >= femalesLeft ? "male" : "female"
                    }
                }
            }

            // 선택된 성별 배치
            if (selectedGender === "male" && maleIndex < shuffledMales.length) {
                newTableSeats.push({
                    participant: shuffledMales[maleIndex].name,
                    gender: "male",
                    position
                })
                maleIndex++
            } else if (selectedGender === "female" && femaleIndex < shuffledFemales.length) {
                newTableSeats.push({
                    participant: shuffledFemales[femaleIndex].name,
                    gender: "female",
                    position
                })
                femaleIndex++
            }

            // 연속 카운트 업데이트
            if (selectedGender === lastGender) {
                consecutiveCount++
            } else {
                consecutiveCount = 1
                lastGender = selectedGender
            }
        }

        setTableSeats(newTableSeats)
        setIsMatching(false)
        setShowResults(true)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            addParticipant()
        }
    }

    const getMaleCount = () => participants.filter((p) => p.gender === "male").length
    const getFemaleCount = () => participants.filter((p) => p.gender === "female").length

    // 이미지로 다운로드하는 함수
    const downloadAsImage = async () => {
        if (!resultsRef.current || tableSeats.length === 0) return

        try {
            // html2canvas를 동적으로 로드
            const html2canvas = await import('html2canvas').then(module => module.default)

            const canvas = await html2canvas(resultsRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true
            })

            const link = document.createElement('a')
            link.download = `테이블배치_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '')}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch (error) {
            // html2canvas가 없을 경우 대체 방법
            console.log('html2canvas not available, using alternative method')

            // SVG를 사용한 대체 이미지 생성
            const svgData = createSVGImage()
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' })
            const url = URL.createObjectURL(svgBlob)

            const link = document.createElement('a')
            link.download = `테이블배치_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '')}.svg`
            link.href = url
            link.click()

            URL.revokeObjectURL(url)
        }
    }

    // SVG 이미지 생성 함수
    const createSVGImage = () => {
        const leftSeats = tableSeats.filter((seat) => seat.position < Math.ceil(tableSeats.length / 2))
        const rightSeats = tableSeats.filter((seat) => seat.position >= Math.ceil(tableSeats.length / 2))

        const maxSeats = Math.max(leftSeats.length, rightSeats.length)
        const svgHeight = Math.max(400, maxSeats * 60 + 200)

        return `
            <svg width="600" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#ffffff"/>
                
                <!-- 제목 -->
                <text x="300" y="40" text-anchor="middle" fill="#1f2937" font-size="24" font-weight="bold">🍻 테이블 배치 결과 🍻</text>
                <text x="300" y="65" text-anchor="middle" fill="#6b7280" font-size="14">총 ${tableSeats.length}명 • 남성 ${tableSeats.filter(s => s.gender === "male").length}명 • 여성 ${tableSeats.filter(s => s.gender === "female").length}명</text>
                
                <!-- 테이블 배경 -->
                <rect x="50" y="100" width="500" height="${svgHeight - 150}" rx="12" fill="#fef7cd" stroke="#f59e0b" stroke-width="2"/>
                
                <!-- 테이블 중앙 원 -->
                <circle cx="300" cy="${svgHeight / 2}" r="40" fill="#f59e0b"/>
                <text x="300" y="${svgHeight / 2 - 5}" text-anchor="middle" fill="white" font-size="12" font-weight="bold">테이블</text>
                <text x="300" y="${svgHeight / 2 + 25}" text-anchor="middle" font-size="16">🍻🥘</text>
                
                <!-- 왼쪽 열 제목 -->
                <text x="150" y="130" text-anchor="middle" fill="#6b7280" font-size="12" font-weight="bold">왼쪽</text>
                
                <!-- 왼쪽 좌석들 -->
                ${leftSeats.map((seat, index) => `
                    <rect x="80" y="${150 + index * 50}" width="140" height="35" rx="8" 
                          fill="${seat.gender === 'male' ? '#dbeafe' : '#fce7f3'}" 
                          stroke="${seat.gender === 'male' ? '#93c5fd' : '#f9a8d4'}" stroke-width="2"/>
                    <text x="100" y="${170 + index * 50}" fill="${seat.gender === 'male' ? '#1e40af' : '#be185d'}" font-size="16">${seat.gender === 'male' ? '👨' : '👩'}</text>
                    <text x="125" y="${175 + index * 50}" fill="${seat.gender === 'male' ? '#1e40af' : '#be185d'}" font-size="12" font-weight="bold">${seat.participant}</text>
                `).join('')}
                
                <!-- 오른쪽 열 제목 -->
                <text x="450" y="130" text-anchor="middle" fill="#6b7280" font-size="12" font-weight="bold">오른쪽</text>
                
                <!-- 오른쪽 좌석들 -->
                ${rightSeats.map((seat, index) => `
                    <rect x="380" y="${150 + index * 50}" width="140" height="35" rx="8" 
                          fill="${seat.gender === 'male' ? '#dbeafe' : '#fce7f3'}" 
                          stroke="${seat.gender === 'male' ? '#93c5fd' : '#f9a8d4'}" stroke-width="2"/>
                    <text x="400" y="${170 + index * 50}" fill="${seat.gender === 'male' ? '#1e40af' : '#be185d'}" font-size="16">${seat.gender === 'male' ? '👨' : '👩'}</text>
                    <text x="425" y="${175 + index * 50}" fill="${seat.gender === 'male' ? '#1e40af' : '#be185d'}" font-size="12" font-weight="bold">${seat.participant}</text>
                `).join('')}
            </svg>
        `
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-3 sm:p-4">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                {/* Add Participant Section */}
                <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            {newParticipantGender === "male" ? "여성" : "남성"} 추가
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                        <div className="flex gap-2">
                            <Select
                                value={newParticipantGender}
                                onValueChange={(value: "male" | "female") => setNewParticipantGender(value)}
                            >
                                <SelectTrigger className="w-20 sm:w-24 h-11 sm:h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">
                                        <div className="flex flex-row items-center gap-1">
                                            <svg className="w-4 h-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5" /><path d="m21 3-6.75 6.75" /><circle cx="10" cy="14" r="6" /></svg>
                                            남
                                        </div>
                                    </SelectItem>

                                    <SelectItem value="female">
                                        <div className="flex flex-row items-center gap-1">
                                            <svg className="w-4 h-4 text-red-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15v7" /><path d="M9 19h6" /><circle cx="12" cy="9" r="6" /></svg>
                                            여
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
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
                                disabled={!newParticipantName.trim() || participants.length >= 50}
                                className="shrink-0 h-11 w-11 sm:h-10 sm:w-auto sm:px-4"
                                size="sm"
                            >
                                <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline ml-1">추가</span>
                            </Button>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            {participants.length}/50명 • 남성 {getMaleCount()}명, 여성 {getFemaleCount()}명 • 최소 2명 이상 필요
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
                                        variant={participant.gender === "male" ? "default" : "secondary"}
                                        className="text-sm py-2.5 px-3 sm:py-2 sm:px-3 animate-in fade-in-0 slide-in-from-bottom-2 min-h-[36px] sm:min-h-auto flex items-center"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <span className="mr-2">
                                            {participant.gender === "male" ? "👨" : "👩"} {participant.name}
                                        </span>
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
                                    배치 중...
                                </>
                            ) : (
                                <>
                                    <Shuffle className="w-5 h-5 mr-2" />
                                    테이블 배치 시작!
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {showResults && tableSeats.length > 0 && (
                    <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4">
                        <div ref={resultsRef}>
                            <CardHeader className="pb-3 sm:pb-6">
                                <CardTitle className="text-center text-xl sm:text-2xl">🍻 테이블 배치 결과 🍻</CardTitle>
                                <p className="text-center text-sm text-muted-foreground">
                                    총 {tableSeats.length}명 • 남성 {tableSeats.filter(s => s.gender === "male").length}명 •
                                    여성 {tableSeats.filter(s => s.gender === "female").length}명
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4 sm:space-y-6">
                                {/* 2열 테이블 시각화 */}
                                <div className="relative w-full max-w-lg mx-auto">
                                    {/* 테이블 표면 */}
                                    <div className="bg-gradient-to-r from-amber-100 to-amber-50 border-2 border-amber-200 rounded-lg p-4 shadow-inner">
                                        <div className="flex justify-between items-start min-h-[200px]">
                                            {/* 왼쪽 열 */}
                                            <div className="flex flex-col gap-3 w-[45%]">
                                                <h4 className="text-xs text-center text-muted-foreground font-medium mb-2">왼쪽</h4>
                                                {tableSeats
                                                    .filter((seat) => seat.position < Math.ceil(tableSeats.length / 2))
                                                    .map((seat, index) => (
                                                        <div
                                                            key={seat.position}
                                                            className="animate-in fade-in-0 slide-in-from-left-4"
                                                            style={{ animationDelay: `${index * 150}ms` }}
                                                        >
                                                            <div
                                                                className={`
                                  px-3 py-2 rounded-lg text-sm font-medium shadow-md text-center
                                  ${seat.gender === "male"
                                                                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                                                                        : "bg-pink-100 text-pink-800 border border-pink-200"
                                                                    }
                                `}
                                                            >
                                                                <div className="text-lg mb-1">{seat.gender === "male" ? "👨" : "👩"}</div>
                                                                <div className="text-xs">{seat.participant}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>

                                            {/* 테이블 중앙 */}
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mb-2">
                                                        <span className="text-xs text-amber-800 font-medium">테이블</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">🍻🥘</div>
                                                </div>
                                            </div>

                                            {/* 오른쪽 열 */}
                                            <div className="flex flex-col gap-3 w-[45%]">
                                                <h4 className="text-xs text-center text-muted-foreground font-medium mb-2">오른쪽</h4>
                                                {tableSeats
                                                    .filter((seat) => seat.position >= Math.ceil(tableSeats.length / 2))
                                                    .map((seat, index) => (
                                                        <div
                                                            key={seat.position}
                                                            className="animate-in fade-in-0 slide-in-from-right-4"
                                                            style={{ animationDelay: `${(index + Math.ceil(tableSeats.length / 2)) * 150}ms` }}
                                                        >
                                                            <div
                                                                className={`
                                  px-3 py-2 rounded-lg text-sm font-medium shadow-md text-center
                                  ${seat.gender === "male"
                                                                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                                                                        : "bg-pink-100 text-pink-800 border border-pink-200"
                                                                    }
                                `}
                                                            >
                                                                <div className="text-lg mb-1">{seat.gender === "male" ? "👨" : "👩"}</div>
                                                                <div className="text-xs">{seat.participant}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 리스트 형태 결과 */}
                                <div className="space-y-2">
                                    <h4 className="text-center font-medium text-muted-foreground">좌석 배치 순서</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <h5 className="text-sm font-medium text-muted-foreground mb-2 text-center">왼쪽 열</h5>
                                            {tableSeats
                                                .filter((seat) => seat.position < Math.ceil(tableSeats.length / 2))
                                                .map((seat, index) => (
                                                    <div
                                                        key={seat.position}
                                                        className="flex items-center gap-2 p-2 bg-card rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-left-4 mb-1"
                                                        style={{ animationDelay: `${index * 100}ms` }}
                                                    >
                                                        <span className="text-xs text-muted-foreground w-8">#{seat.position + 1}</span>
                                                        <span className="text-lg">{seat.gender === "male" ? "👨" : "👩"}</span>
                                                        <span className="font-medium text-sm">{seat.participant}</span>
                                                    </div>
                                                ))}
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-muted-foreground mb-2 text-center">오른쪽 열</h5>
                                            {tableSeats
                                                .filter((seat) => seat.position >= Math.ceil(tableSeats.length / 2))
                                                .map((seat, index) => (
                                                    <div
                                                        key={seat.position}
                                                        className="flex items-center gap-2 p-2 bg-card rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-right-4 mb-1"
                                                        style={{ animationDelay: `${(index + Math.ceil(tableSeats.length / 2)) * 100}ms` }}
                                                    >
                                                        <span className="text-xs text-muted-foreground w-8">#{seat.position + 1}</span>
                                                        <span className="text-lg">{seat.gender === "male" ? "👨" : "👩"}</span>
                                                        <span className="font-medium text-sm">{seat.participant}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </div>

                        <CardContent className="pt-0">
                            <div className="text-center pt-2 sm:pt-4 space-y-2">
                                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                    <Button
                                        onClick={downloadAsImage}
                                        variant="default"
                                        className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto min-h-[44px]"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        이미지 다운로드
                                    </Button>
                                    <Button
                                        onClick={startMatching}
                                        variant="outline"
                                        className="hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent w-full sm:w-auto min-h-[44px]"
                                    >
                                        <Shuffle className="w-4 h-4 mr-2" />
                                        다시 배치하기
                                    </Button>
                                </div>
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