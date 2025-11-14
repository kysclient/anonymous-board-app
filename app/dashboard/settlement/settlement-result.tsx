'use client'

import { useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import html2canvas from 'html2canvas'
import { Download, Copy, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettlementDetail {
    sessionNumber: number
    baseFee: number
    operatingFee: number
    hostBenefit: number
    subtotal: number
}

interface Settlement {
    name: string
    isHost: boolean
    details: SettlementDetail[]
    newbieDeposit: number
    total: number
    payback?: number
}

interface SessionDetail {
    participants: number
    amount: number
    basePerPerson: number
    hostDiscount: number
    operatingCost?: number
}

interface SettlementResultProps {
    data: {
        settlement: Settlement[]
        totalParticipants: number
        hostName: string
        isTravel: boolean
        sessions: SessionDetail[]
        operatingAccount: string
    }
}

export default function SettlementResult({ data }: SettlementResultProps) {
    const resultRef = useRef<HTMLDivElement>(null)

    const getHostname = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin
        }
        return 'https://settlement.ourmeeting.com'
    }

    const generateShareUrl = () => {
        const resultData = btoa(JSON.stringify(data))
        const shareUrl = `${getHostname()}?result=${resultData}`
        return shareUrl
    }

    const copyShareLink = () => {
        const shareUrl = generateShareUrl()
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('공유 링크가 복사되었습니다!')
        })
    }

    const downloadAsImage = async () => {
        if (resultRef.current) {
            const canvas = await html2canvas(resultRef.current, {
                backgroundColor: '#fff8f0',
                scale: 2,
            })
            const link = document.createElement('a')
            link.href = canvas.toDataURL()
            link.download = `정산결과_${new Date().toLocaleDateString('ko-KR')}.png`
            link.click()
        }
    }

    const copyToClipboard = () => {

        navigator.clipboard.writeText('카카오뱅크 79798748510').then(() => {
            alert('클립보드에 복사되었습니다!')
        })
    }

    return (
        <div className="space-y-4">
            <Card className="border border-border bg-background shadow-lg" ref={resultRef}>
                <CardHeader className="bg-secondary border-b border-border">
                    <CardTitle className="text-foreground text-lg sm:text-2xl">정산 결과</CardTitle>
                    <CardDescription className="text-foreground">
                        총 {data.totalParticipants}명 | 벙주: {data.hostName}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-foreground text-lg">차수별 정산 현황</h3>
                        <div className="grid gap-3">
                            {data.sessions.map((session, idx) => (
                                <div key={idx} className="p-3 bg-background border border-primary rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-foreground">차수 {idx + 1}</span>
                                        <span className="text-sm text-foreground">{session.participants}명 | {session.amount.toLocaleString()}원</span>
                                    </div>
                                    <div className="text-xs text-foreground mt-2 space-y-1">
                                        <div>N/1: {session.basePerPerson.toLocaleString()}원</div>
                                        <div className="text-muted-foreground">└ (정산액 {session.amount.toLocaleString()}원 + 운영비 {session.operatingCost?.toLocaleString() || 0}원) ÷ {session.participants}명</div>
                                        {session.hostDiscount > 0 && (
                                            <div className="text-primary font-semibold">벙주 무료</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 참석자별 정산 */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-foreground text-lg">참석자별 정산</h3>
                        {data.settlement.map((person, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg border-2 transition-all ${person.isHost
                                    ? 'bg-background border border-primary'
                                    : 'bg-background border border-border'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-lg text-foreground">
                                        {person.name}
                                        {person.isHost && (
                                            <span className="ml-2 text-sm bg-primary text-white px-3 py-1 rounded-full">
                                                벙주
                                            </span>
                                        )}
                                    </h4>
                                    <span className={cn("text-2xl font-bold text-primary", person.payback && person.payback > 0 && 'text-blue-500')}>
                                        {person.total.toLocaleString()}원
                                    </span>
                                </div>

                                <div className="space-y-2 mb-3 text-sm text-foreground">
                                    {person.details.map((detail, dIdx) => (
                                        <div key={dIdx} className="pl-3 border-l-2 border-primary">
                                            <div className="font-semibold mb-1">차수 {detail.sessionNumber}</div>
                                            <div className="ml-3 space-y-0.5">
                                                <div>인당: {detail.baseFee.toLocaleString()}원</div>
                                                {detail.hostBenefit > 0 && (
                                                    <div className="text-foreground font-semibold">
                                                        -벙주혜택: {detail.hostBenefit.toLocaleString()}원
                                                    </div>
                                                )}
                                                <div className="font-bold text-foreground">소계: {detail.subtotal.toLocaleString()}원</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {person.newbieDeposit > 0 && (
                                    <div className="pt-2 mb-2 border-t border-border">
                                        <div className="text-sm font-semibold text-foreground">
                                            신입 선입금 차감: -{person.newbieDeposit.toLocaleString()}원
                                        </div>
                                    </div>
                                )}

                                {person.payback && (
                                    <div className="pt-2border-t border-border">
                                        <div className="text-sm font-semibold text-blue-500">
                                            신입 페이백: -{person.payback.toLocaleString()}원
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* 운영 계좌 */}
                    <div className="bg-[#fef01b] p-4 rounded-lg">
                        <p className="text-sm text-black mb-1">운영비 입금 계좌</p>
                        <p className="font-bold text-black text-lg">
                            {data.operatingAccount}
                        </p>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            onClick={copyToClipboard}
                            className="bg-black text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2"
                        >
                            <Copy size={18} />
                            운영비 입금계좌 복사
                        </Button>
                        <Button
                            onClick={downloadAsImage}
                            className="bg-primaryhover:bg-primary text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            이미지 저장
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 공유 카드 */}
            {/* <Card className="border-2 border-[#d4a574] bg-gradient-to-br from-[#fff8f0] to-[#fffbf5]">
                <CardHeader>
                    <CardTitle className="text-[#2d1810]">공유하기</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                    <Button
                        onClick={copyShareLink}
                        className="bg-[#a87c4c] hover:bg-[#8b6435] text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2"
                    >
                        <Link2 size={18} />
                        링크 복사
                    </Button>
                    <Button
                        onClick={downloadAsImage}
                        className="bg-[#2d1810] hover:bg-[#1a0f07] text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2"
                    >
                        <Download size={18} />
                        이미지 저장
                    </Button>
                </CardContent>
            </Card> */}
        </div>
    )
}
