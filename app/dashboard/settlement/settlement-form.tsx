// Updated SettlementForm with automatic session participant count setting
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ParticipantInput from './participant-input'

interface SessionData {
    participants: number
    amount: number
    id: string  // 추가

}

interface Participant {
    name: string
    isNew: boolean
    sessionIds: number[]
}

export default function SettlementForm({ onCalculate }: { onCalculate: (data: any) => void }) {
    const [participants, setParticipants] = useState<Participant[]>([
        { name: '', isNew: false, sessionIds: [] }
    ])
    const [hostName, setHostName] = useState('')
    const [isTravel, setIsTravel] = useState(false)
    const [hostIndex, setHostIndex] = useState(0)
    const [sessions, setSessions] = useState<SessionData[]>([
        { participants: 0, amount: 0, id: Date.now().toString() }  // id 추가
    ])
    const [sessionIdCounter, setSessionIdCounter] = useState(1)  // 추가

    const updateSessionParticipants = () => {
        const updated = sessions.map((s, idx) => ({
            ...s,
            participants: participants.filter(p => p.sessionIds.includes(idx)).length
        }))
        setSessions(updated)
    }

    const handleAddParticipant = () => {
        setParticipants(prev => [...prev, { name: '', isNew: false, sessionIds: [] }])
        setTimeout(updateSessionParticipants, 0)
    }

    const handleRemoveParticipant = (index: number) => {
        const newParticipants = participants.filter((_, i) => i !== index)
        setParticipants(newParticipants)
        if (hostIndex === index && hostIndex > 0) setHostIndex(hostIndex - 1)
        if (hostIndex === index && newParticipants.length > 0) setHostIndex(0)
        setTimeout(updateSessionParticipants, 0)
    }

    const handleParticipantChange = (index: number, field: string, value: any) => {
        const newParticipants = [...participants]
        newParticipants[index] = { ...newParticipants[index], [field]: value }
        setParticipants(newParticipants)
    }

    const handleFirstParticipantName = (value: string) => {
        handleParticipantChange(0, 'name', value)
        if (value.trim() && hostName === '') setHostName(value)
    }

    const handleAddSession = () => {
        setSessions(prev => [...prev, {
            participants: 0,
            amount: 0,
            id: (Date.now() + sessionIdCounter).toString()  // id 추가
        }])
        setSessionIdCounter(prev => prev + 1)  // 추가
    }

    const handleRemoveSession = (index: number) => {
        const newSessions = sessions.filter((_, i) => i !== index)

        const newParticipants = participants.map(p => ({
            ...p,
            sessionIds: p.sessionIds
                .filter(id => id !== index)
                .map(id => (id > index ? id - 1 : id))
        }))

        setSessions(newSessions)
        setParticipants(newParticipants)
        setTimeout(updateSessionParticipants, 0)
    }

    const handleSessionChange = (index: number, field: string, value: any) => {
        const newSessions = [...sessions]
        newSessions[index] = { ...newSessions[index], [field]: value }
        setSessions(newSessions)
    }

    const handleParticipantSessionToggle = (participantIdx: number, sessionIdx: number) => {
        const newParticipants = [...participants]
        const ids = newParticipants[participantIdx].sessionIds
        const pos = ids.indexOf(sessionIdx)
        if (pos > -1) ids.splice(pos, 1)
        else ids.push(sessionIdx)
        setParticipants(newParticipants)
        setTimeout(updateSessionParticipants, 0)
    }

    const toggleAllParticipantsForSession = (sessionIdx: number) => {
        const allSelected = participants.every(p => p.sessionIds.includes(sessionIdx))
        const newParticipants = participants.map(p => {
            const exists = p.sessionIds.includes(sessionIdx)
            return {
                ...p,
                sessionIds: allSelected
                    ? p.sessionIds.filter(id => id !== sessionIdx)
                    : exists ? p.sessionIds : [...p.sessionIds, sessionIdx]
            }
        })
        setParticipants(newParticipants)
        setTimeout(updateSessionParticipants, 0)
    }

    const getSessionParticipantCount = (sessionIdx: number) => participants.filter(p => p.sessionIds.includes(sessionIdx)).length

    const calculateSettlement = () => {
        const updatedSessions = sessions.map((s, idx) => ({
            ...s,
            participants: getSessionParticipantCount(idx)
        }))
        setSessions(updatedSessions)

        if (
            participants.some(p => !p.name) ||
            !hostName ||
            updatedSessions.some(s => s.participants === 0 || s.amount === 0)
        ) {
            alert('모든 필드를 입력해주세요!')
            return
        }

        // 🔥 운영비: 전체 참여자 수 * 500 (1번만 계산)
        const totalParticipantsCount = participants.length
        const operatingCostPerSession = totalParticipantsCount * 500

        const sessionDetails = updatedSessions.map((session, idx) => {
            const operatingCost = operatingCostPerSession // 세션 참여자 수 무관하게 동일 적용
            const totalWithOperating = session.amount + operatingCost
            const basePerPerson = Math.floor(totalWithOperating / session.participants)
            const remainder = totalWithOperating % session.participants

            return {
                ...session,
                operatingCost,
                totalWithOperating,
                basePerPerson,
                remainder,
                hostDiscount: 0
            }
        })

        // --- 이하 기존 로직 동일 ---
        if (!isTravel) {
            const maxP = Math.max(...sessionDetails.map(s => s.participants))
            const maxIdx = sessionDetails.findIndex(s => s.participants === maxP)

            sessionDetails.forEach(s => {
                if (s.participants >= 10) s.hostDiscount = s.basePerPerson
            })

            if (sessions.length >= 2) {
                const hasLarge = sessionDetails.some(s => s.participants >= 5)
                if (
                    hasLarge &&
                    sessionDetails[maxIdx].participants >= 5 &&
                    sessionDetails[maxIdx].participants < 10
                ) {
                    sessionDetails[maxIdx].hostDiscount = sessionDetails[maxIdx].basePerPerson
                }
            }
        }

        const settlement = participants.map((p, pIdx) => {
            let totalFee = 0
            const details: any[] = []

            p.sessionIds.forEach(sessionIdx => {
                const session = sessionDetails[sessionIdx]
                let fee = session.basePerPerson
                if (session.remainder > 0) {
                    fee += 1
                    session.remainder--
                }
                const hostBenefit = pIdx === hostIndex ? session.hostDiscount : 0
                const sessionTotal = fee - hostBenefit
                details.push({
                    sessionNumber: sessionIdx + 1,
                    baseFee: fee,
                    operatingFee: 0,
                    hostBenefit,
                    subtotal: sessionTotal
                })
                totalFee += sessionTotal
            })

            let newbieDeposit = p.isNew ? 50000 : 0
            if (p.isNew) totalFee -= newbieDeposit

            // 🔥 음수면 페이백 처리
            const payback = totalFee < 0 ? Math.abs(totalFee) : undefined

            return {
                name: p.name,
                isHost: pIdx === hostIndex,
                details,
                newbieDeposit,
                total: totalFee, // 음수 포함
                payback          // 페이백 금액 (양수)
            }
        })

        onCalculate({
            settlement,
            totalParticipants: participants.length,
            hostName: participants[hostIndex].name,
            isTravel,
            sessions: sessionDetails,
            operatingAccount: 'KK: 79798748510 이휘원'
        })
    }

    return (
        <div className="space-y-6">

            {/* 모임 유형 선택 */}
            <Card className="border border-border bg-background shadow-lg">
                <CardHeader className="bg-secondary border-b border-border">
                    <CardTitle className="text-foreground text-lg sm:text-2xl">모임 유형</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsTravel(false)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all flex-1 ${!isTravel
                                ? 'bg-primary text-white border border-primar'
                                : 'bg-background text-foreground border border-border'
                                }`}
                        >
                            일반 모임
                        </button>
                        <button
                            onClick={() => setIsTravel(true)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all flex-1 ${isTravel
                                ? 'bg-primary text-white border border-primar'
                                : 'bg-background text-foreground border border-border'
                                }`}
                        >
                            여행벙
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* 참석자 정보 */}
            <Card className="border border-border bg-background shadow-lg">
                <CardHeader className="bg-secondary border-b border-border">
                    <CardTitle className="text-foreground text-lg sm:text-2xl">참석자 정보</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {participants.map((p, idx) => (
                            <ParticipantInput
                                key={idx}
                                index={idx}
                                participant={p}
                                isHost={idx === hostIndex}
                                onHostChange={() => {
                                    setHostIndex(idx)
                                    setHostName(participants[idx].name)
                                }}
                                onNameChange={(value) => {
                                    if (idx === 0) {
                                        handleFirstParticipantName(value)
                                    } else {
                                        handleParticipantChange(idx, 'name', value)
                                    }
                                }}
                                onNewChange={(value) =>
                                    handleParticipantChange(idx, 'isNew', value)
                                }
                                onRemove={() => handleRemoveParticipant(idx)}
                                canRemove={participants.length > 1}
                            />
                        ))}
                    </div>
                    <Button
                        onClick={handleAddParticipant}
                        variant="outline"
                        className="w-full bg-primary text-white h-10 font-semibold"
                    >
                        + 참석자 추가
                    </Button>
                </CardContent>
            </Card>



            {/* 차수별 정산 정보 */}
            <Card className="border border-border bg-background shadow-lg">
                <CardHeader className="bg-secondary border-b border-border">
                    <CardTitle className="text-foreground text-lg sm:text-2xl">차수별 정산 정보</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {sessions.map((session, idx) => {
                            const participantCount = getSessionParticipantCount(idx)
                            const allSelected = participantCount === participants.length && participants.length > 0

                            return (
                                <div key={session.id} className="p-4 border border-primary rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-foreground">차수 {idx + 1}</h4>
                                        {sessions.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveSession(idx)}
                                                className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200"
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                정산액 (원)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={session.amount}
                                                onChange={(e) => handleSessionChange(idx, 'amount', parseInt(e.target.value))}
                                                className="border border-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-sm font-semibold text-foreground">이 차수에 참석한 사람 ({participantCount}명)</p>
                                            <button
                                                onClick={() => toggleAllParticipantsForSession(idx)}
                                                className="text-xs bg-primary text-white px-2 py-1 rounded  font-semibold"
                                            >
                                                {allSelected ? '전체 해제' : '전체 선택'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {participants.map((p, pIdx) => (
                                                <label key={pIdx} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={participants[pIdx].sessionIds.includes(idx)}
                                                        onChange={() => handleParticipantSessionToggle(pIdx, idx)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm text-foreground">{p.name || '(입력 대기)'}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <Button
                        onClick={handleAddSession}
                        variant="outline"
                        className="w-full bg-primary text-white h-10 font-semibold"
                    >
                        + 차수 추가
                    </Button>
                </CardContent>
            </Card>

            {/* 계산 버튼 */}
            <Button
                onClick={calculateSettlement}
                className="w-full bg-background border border-primary text-primary hover:text-white h-12 font-bold text-lg rounded-lg transition-all shadow-md"
            >
                정산 계산하기
            </Button>
        </div >
    )
}
