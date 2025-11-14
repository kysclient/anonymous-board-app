"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Images } from "lucide-react";

const SOMOIM_GID = "e03ab496-0dd3-11ee-8cf5-0a16fe5c82071";

export function GalleryPreview() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const response = await fetch(`/api/somoim?gid=${SOMOIM_GID}&s_t=0`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("이미지를 불러오지 못했어요.");
        }

        const payload = await response.json();
        const fetchedImages: string[] = payload?.data?.images ?? [];

        setImages(fetchedImages.slice(0, 6));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "예상치 못한 오류가 발생했어요."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadImages();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            <Images className="h-4 w-4 mr-1" />
            모임 스냅샷
          </Badge>
          <p className="text-sm text-muted-foreground">
            실제 모임에서 담은 하이라이트 순간들이에요.
          </p>
        </div>
        <Link href="/dashboard/gallery">
          <Button variant="outline" size="sm">
            더 많은 사진 보기
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={`gallery-skeleton-${index}`} className="h-40 animate-pulse">
              <CardContent className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </CardContent>
            </Card>
          ))}

        {!loading && error && (
          <Card className="sm:col-span-2 lg:col-span-3 border-dashed">
            <CardContent className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p>{error}</p>
              <p>잠시 후 다시 시도해 주세요.</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && images.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3 border-dashed">
            <CardContent className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Images className="h-5 w-5" />
              <p>곧 새로운 순간들을 업데이트할 예정이에요.</p>
            </CardContent>
          </Card>
        )}

        {!loading &&
          !error &&
          images.map((src, index) => (
            <Card key={src} className="overflow-hidden border-none shadow-sm">
              <CardContent className="relative h-40 p-0">
                <Image
                  src={src}
                  alt={`모임 사진 ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  priority={index < 2}
                />
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
