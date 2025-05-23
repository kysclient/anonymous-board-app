import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import PostForm from "@/components/post-form"

export default function SubmitPage() {
  return (
    <main className="container max-w-2xl py-10 space-y-8">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">새 글 작성</h1>
      </div>

      <PostForm />
    </main>
  )
}
