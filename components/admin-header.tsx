"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { logoutAdmin } from "@/lib/actions"

export default function AdminHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">관리자 페이지</h1>
      <Button variant="outline" size="sm" onClick={() => logoutAdmin()}>
        <LogOut className="h-4 w-4 mr-2" />
        로그아웃
      </Button>
    </div>
  )
}
