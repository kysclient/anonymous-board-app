'use client'

import { useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
            // 테이블을 감싸는 div의 overflow를 임시로 visible로 변경하여 전체 너비 캡처
            const originalOverflow = resultRef.current.style.overflow
            resultRef.current.style.overflow = 'visible'
            
            // 약간의 지연 후 캡처 (렌더링 완료 대기)
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // 테이블의 실제 너비 계산
            const table = resultRef.current.querySelector('table') as HTMLElement
            if (!table) return
            
            const tableScrollWidth = table.scrollWidth
            const tableHeight = resultRef.current.scrollHeight
            
            // 컨테이너의 실제 너비 계산 (테이블 전체 너비 고려)
            const calculatedWidth = Math.max(
                resultRef.current.scrollWidth,
                tableScrollWidth,
                800 // 최소 너비 보장
            )
            
            // 컨테이너의 너비를 임시로 조정하여 전체 테이블이 보이도록
            const originalWidth = resultRef.current.style.width
            const originalMaxWidth = resultRef.current.style.maxWidth
            resultRef.current.style.width = `${calculatedWidth}px`
            resultRef.current.style.maxWidth = 'none'
            
            // 추가 지연 (레이아웃 재계산 대기)
            await new Promise(resolve => setTimeout(resolve, 300))
            
            try {
                const canvas = await html2canvas(resultRef.current, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    width: calculatedWidth,
                    height: tableHeight,
                    scrollX: 0,
                    scrollY: 0,
                    allowTaint: false,
                })
                const link = document.createElement('a')
                link.href = canvas.toDataURL('image/png', 1.0)
                link.download = `정산결과_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '')}.png`
                link.click()
            } finally {
                // 원래 스타일 복원
                resultRef.current.style.width = originalWidth
                resultRef.current.style.maxWidth = originalMaxWidth
                resultRef.current.style.overflow = originalOverflow
            }
        }
    }

    const copyToClipboard = () => {

        navigator.clipboard.writeText('카카오뱅크 79798748510').then(() => {
            alert('클립보드에 복사되었습니다!')
        })
    }

    return (
        <div className="space-y-4">
            <Card className="border border-border shadow-lg">
                <CardHeader className="bg-secondary border-b border-border">
                    <CardTitle className="text-foreground text-xl sm:text-2xl font-bold">정산 결과</CardTitle>
                    <CardDescription className="text-foreground text-base mt-2">
                        총 {data.totalParticipants}명 | 벙주: <span className="font-semibold text-primary">{data.hostName}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* 차수별 정산 현황 - 표 형식 */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-foreground text-lg">차수별 정산 현황</h3>
                        <div className="rounded-lg border border-border overflow-hidden shadow-sm">
                            <Table className='min-w-[768px]'>
                                <TableHeader>
                                    <TableRow className="">
                                        <TableHead className="font-bold text-foreground">차수</TableHead>
                                        <TableHead className="font-bold text-center text-foreground">참석자</TableHead>
                                        <TableHead className="font-bold text-right text-foreground">정산액</TableHead>
                                        <TableHead className="font-bold text-right text-foreground">운영비</TableHead>
                                        <TableHead className="font-bold text-right text-foreground">인당 금액</TableHead>
                                        <TableHead className="font-bold text-center text-foreground">비고</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.sessions.map((session, idx) => (
                                        <TableRow key={idx} className="border-b hover:bg-muted/30">
                                            <TableCell className="font-semibold text-base">차수 {idx + 1}</TableCell>
                                            <TableCell className="text-center font-medium">{session.participants}명</TableCell>
                                            <TableCell className="text-right font-medium">{session.amount.toLocaleString()}원</TableCell>
                                            <TableCell className="text-right font-medium">{session.operatingCost?.toLocaleString() || 0}원</TableCell>
                                            <TableCell className="text-right font-bold text-primary">{session.basePerPerson.toLocaleString()}원</TableCell>
                                            <TableCell className="text-center">
                                                {session.hostDiscount > 0 && (
                                                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-semibold">벙주 무료</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* 참석자별 정산 - 표 형식 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-foreground text-lg">참석자별 입금 금액</h3>
                            <span className="text-xs text-muted-foreground">* 벙주는 파란색 배경으로 표시됩니다</span>
                        </div>
                        <div className="rounded-lg border border-border overflow-hidden shadow-sm" ref={resultRef}>
                            <Table className='min-w-[768px]'>
                                <TableHeader>
                                    <TableRow className="bg-secondary">
                                        <TableHead className="font-bold w-[120px] text-foreground">이름</TableHead>
                                        <TableHead className="font-bold text-center text-foreground">참석 차수</TableHead>
                                        <TableHead className="font-bold text-right text-foreground">차수별 금액</TableHead>
                                        <TableHead className="font-bold text-right text-foreground">신입 차감</TableHead>
                                        <TableHead className="font-bold text-right text-foreground">페이백</TableHead>
                                        <TableHead className="font-bold text-right text-lg text-primary">최종 입금액</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.settlement.map((person, idx) => {
                                        const detailText = person.details.map(d => `차수${d.sessionNumber}`).join(', ')
                                        const detailAmount = person.details.reduce((sum, d) => sum + d.subtotal, 0)
                                        const finalAmount = person.total
                                        const isPayback = person.payback && person.payback > 0
                                        
                                        return (
                                            <TableRow 
                                                key={idx}
                                                className={cn(
                                                    "border-b",
                                                    person.isHost && "bg-primary/10 border-primary/30",
                                                    isPayback && "bg-blue-50 border-blue-200"
                                                )}
                                            >
                                                <TableCell className="font-semibold text-base">
                                                    <div className="flex items-center gap-2">
                                                        {person.name}
                                                        {person.isHost && (
                                                            <span className="text-xs bg-primary text-white px-2 py-1 rounded-full font-bold">
                                                                벙주
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center text-sm font-medium">{detailText || '-'}</TableCell>
                                                <TableCell className="text-right font-medium">{detailAmount.toLocaleString()}원</TableCell>
                                                <TableCell className="text-right">
                                                    {person.newbieDeposit > 0 ? (
                                                        <span className="text-orange-600 font-semibold">-{person.newbieDeposit.toLocaleString()}원</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isPayback ? (
                                                        <span className="text-blue-600 font-bold">+{person.payback?.toLocaleString()}원</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right bg-primary/5">
                                                    <div className={cn(
                                                        "text-2xl font-extrabold py-2",
                                                        isPayback ? "text-blue-600" : "text-primary"
                                                    )}>
                                                        {isPayback ? (
                                                            <span className="text-blue-600">
                                                                페이백 {person.payback?.toLocaleString()}원
                                                            </span>
                                                        ) : (
                                                            <span className="text-primary">
                                                                {finalAmount.toLocaleString()}원
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* 상세 내역 (접을 수 있는 형태) */}
                    <div className="space-y-3">
                        <details className="group">
                            <summary className="cursor-pointer font-bold text-foreground text-lg list-none">
                                <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                                    <span>상세 내역 보기</span>
                                    <span className="text-sm text-muted-foreground group-open:hidden">▼</span>
                                    <span className="text-sm text-muted-foreground hidden group-open:inline">▲</span>
                                </div>
                            </summary>
                            <div className="mt-3 space-y-3">
                                {data.settlement.map((person, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "p-4 rounded-lg border",
                                            person.isHost ? "border-primary bg-primary/5" : "border-border bg-background"
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-lg text-foreground">
                                                {person.name}
                                                {person.isHost && (
                                                    <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">
                                                        벙주
                                                    </span>
                                                )}
                                            </h4>
                                        </div>

                                        <div className="space-y-2 text-sm text-foreground">
                                            {person.details.map((detail, dIdx) => (
                                                <div key={dIdx} className="pl-3 border-l-2 border-primary">
                                                    <div className="font-semibold mb-1">차수 {detail.sessionNumber}</div>
                                                    <div className="ml-3 space-y-0.5">
                                                        <div>인당: {detail.baseFee.toLocaleString()}원</div>
                                                        {detail.hostBenefit > 0 && (
                                                            <div className="text-primary font-semibold">
                                                                -벙주혜택: {detail.hostBenefit.toLocaleString()}원
                                                            </div>
                                                        )}
                                                        <div className="font-bold text-foreground">소계: {detail.subtotal.toLocaleString()}원</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {person.newbieDeposit > 0 && (
                                            <div className="pt-2 mt-2 border-t border-border">
                                                <div className="text-sm font-semibold text-orange-600">
                                                    신입 선입금 차감: -{person.newbieDeposit.toLocaleString()}원
                                                </div>
                                            </div>
                                        )}

                                        {person.payback && person.payback > 0 && (
                                            <div className="pt-2 mt-2 border-t border-border">
                                                <div className="text-sm font-semibold text-blue-600">
                                                    신입 페이백: +{person.payback.toLocaleString()}원
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </details>
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
                            className="bg-primary hover:bg-primary/90 text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2"
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
