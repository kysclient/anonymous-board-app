"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { checkAdminKey } from "@/lib/actions"

export default function AdminForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const isAdmin = await checkAdminKey(formData)

    if (isAdmin) {
      router.refresh()
    } else {
      setError("관리자 키가 올바르지 않습니다.")
    }

    setIsSubmitting(false)
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>관리자 인증</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminKey">관리자 키</Label>
              <Input id="adminKey" name="adminKey" type="password" placeholder="관리자 키를 입력하세요" required />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "인증 중..." : "인증하기"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
