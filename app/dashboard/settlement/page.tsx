'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SettlementForm from './settlement-form'
import SettlementResult from './settlement-result'

export default function Home() {
    const [showResult, setShowResult] = useState(false)
    const [result, setResult] = useState<any>(null)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const resultParam = params.get('result')

        if (resultParam) {
            try {
                const decodedData = JSON.parse(atob(resultParam))
                setResult(decodedData)
                setShowResult(true)
            } catch (error) {
                console.log("[v0] 정산 결과 파싱 실패")
            }
        }
    }, [])

    const handleCalculate = (data: any) => {
        setResult(data)
        setShowResult(true)
    }

    const handleReset = () => {
        setShowResult(false)
        setResult(null)
        window.history.replaceState({}, document.title, window.location.pathname)
    }

    return (
        <main className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
          

                {/* Main Content */}
                <div className="space-y-6">
                    {!showResult ? (
                        <SettlementForm onCalculate={handleCalculate} />
                    ) : (
                        <>
                            <SettlementResult data={result} />
                            <Button
                                onClick={handleReset}
                                className="w-full h-12 text-lg font-semibold rounded-lg transition-all"
                            >
                                처음부터 다시
                            </Button>
                        </>
                    )}
                </div>

                {/* Footer Info */}
                <div className="mt-12 bg-background/60 backdrop-blur-sm rounded-lg p-6 border border-border">
                    <h3 className="font-bold text-freground mb-3">정산 규칙</h3>
                    <ul className="text-sm text-foreground space-y-2">
                        <li>✓ 늦참 상관없이 모두 1/n 계산</li>
                        <li>✓ 신입: 첫 참석 시 5만원 선입금 (정산 후 페이백)</li>
                        <li>✓ 벙주 혜택: 10인 이상 무료, 5-9인 가장 많은 1차 무료</li>
                        <li>✓ 운영비: 참석 인원 × 500원 추가</li>
                    </ul>
                </div>
            </div>
        </main>
    )
}
