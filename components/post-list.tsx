import type { Post } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

interface PostListProps {
  posts: Post[]
}

export default function PostList({ posts }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>게시물이 없습니다.</p>
        </div>
      ) : (
        posts.map((post) => (
          <Card key={post.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>{formatDate(new Date(post.created_at))}</div>
                  <div className="text-right">IP: {post.ip}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{post.content}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
