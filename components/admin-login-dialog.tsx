"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { checkAdminKey } from "@/lib/actions";
import { Spinner } from "@/components/ui/spinner";

export function AdminLoginDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const isAdmin = await checkAdminKey(formData);

    if (isAdmin) {
      setOpen(false);
      window.location.reload();
      // router.refresh();
    } else {
      setError("관리자 키가 올바르지 않습니다.");
    }

    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="m3-btn m3-btn-tonal h-10 px-4 text-[13px]">
          관리자 로그인
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>관리자 인증</DialogTitle>
            <DialogDescription>
              관리자 키를 입력하면 대시보드 권한이 활성화됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminKey">관리자 키</Label>
              <Input
                id="adminKey"
                name="adminKey"
                type="password"
                placeholder="관리자 키를 입력하세요"
                required
                disabled={isSubmitting}
              />
            </div>
            {error && <p className="text-xs text-muted-foreground">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  인증 중...
                </>
              ) : (
                "인증하기"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

