"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  ZoomIn,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SomoimData {
  title: string;
  images: string[];
  nextCursor?: number | null;
}

export default function GalleryPage() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url] = useState(
    "https://www.somoim.co.kr/e03ab496-0dd3-11ee-8cf5-0a16fe5c82071"
  );
  const [s_t, setST] = useState<number | null>(0);
  const [hasMore, setHasMore] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const gid = url.match(/\/([a-f0-9-]+)$/)?.[1] || null;

  /* ── pagination (preserved) ──────────────────────────────────── */
  const fetchNextPage = useCallback(async () => {
    if (!gid || !hasMore || loading || s_t === null) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/somoim?gid=${gid}&s_t=${s_t}`);
      const result: {
        success: boolean;
        data?: SomoimData;
        error?: string;
      } = await response.json();

      if (result.success && result.data) {
        const newImages = result.data.images || [];
        setImages((prev) => [...prev, ...newImages]);

        const nextCursor = (result.data as any).nextCursor ?? null;
        setST(nextCursor);
        setHasMore(nextCursor !== null);
      } else {
        setError(result.error || "데이터를 가져올 수 없습니다.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }, [gid, hasMore, loading, s_t]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  /* ── lightbox keyboard ───────────────────────────────────────── */
  useEffect(() => {
    if (lightboxIdx === null) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      else if (e.key === "ArrowLeft")
        setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)));
      else if (e.key === "ArrowRight")
        setLightboxIdx((i) =>
          i === null ? null : Math.min(images.length - 1, i + 1)
        );
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [lightboxIdx, images.length]);

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Hero */}
      <header className="m3-card-feature relative overflow-hidden bg-md-tertiary-container p-7 sm:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-md-primary-container opacity-50" />
        <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-md-secondary-container opacity-60" />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="m3-pill m3-pill-primary">
              <ImageIcon className="h-3 w-3" />
              Gallery · Photos
            </span>
            {images.length > 0 && (
              <span className="m3-pill">
                <Sparkles className="h-3 w-3" />총 {images.length}장
              </span>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="type-display-medium text-md-on-tertiary-container">
              모임 갤러리
            </h1>
            <p className="type-body-large max-w-xl text-md-on-tertiary-container/85">
              SPICY가 함께한 순간들. 사진을 누르면 크게 볼 수 있어요.
            </p>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-md-error-container px-5 py-4 type-body-medium text-md-on-error-container">
          {error}
        </div>
      )}

      {/* Masonry grid */}
      <section>
        {images.length === 0 && !loading ? (
          <SkeletonGrid count={10} />
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5 [column-fill:_balance]">
            {images.map((img, idx) => (
              <PhotoTile
                key={`${img}-${idx}`}
                src={img}
                index={idx}
                onClick={() => setLightboxIdx(idx)}
              />
            ))}
          </div>
        )}

        {/* Load-more sentinel + spinner */}
        <div ref={loaderRef} className="h-12" />
        {loading && images.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-6 text-md-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="type-label-large">더 불러오는 중…</span>
          </div>
        )}

        {!hasMore && images.length > 0 && (
          <p className="mt-6 text-center type-body-small text-md-on-surface-variant">
            ✦ 모든 사진을 불러왔어요 ·{" "}
            <span className="font-medium text-md-on-surface">
              {images.length}장
            </span>
          </p>
        )}
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)))}
          onNext={() =>
            setLightboxIdx((i) =>
              i === null ? null : Math.min(images.length - 1, i + 1)
            )
          }
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */

function PhotoTile({
  src,
  onClick,
}: {
  src: string;
  index: number;
  onClick: () => void;
}) {
  const [aspect, setAspect] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-md-surface-container-highest text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:elev-3 sm:mb-4"
    >
      {/* Aspect-locked box: matches the image's natural ratio so it always fills */}
      <div
        className="relative w-full"
        style={{ aspectRatio: aspect ?? 4 / 5 }}
      >
        {/* Skeleton fills the box until image is decoded */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-md-surface-container-highest" />
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          loading="lazy"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setAspect(img.naturalWidth / img.naturalHeight);
            }
            setLoaded(true);
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500",
            loaded ? "opacity-100" : "opacity-0",
            "group-hover:scale-[1.04]"
          )}
        />

        {/* Hover overlay with zoom hint (sits inside the aspect box so it's always crisp) */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-md-on-surface elev-2 backdrop-blur">
            <ZoomIn className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-md-surface-container-highest sm:mb-4"
          style={{ aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "1/1" : "4/5" }}
        >
          <div className="h-full w-full animate-pulse bg-md-surface-container-highest" />
        </div>
      ))}
    </div>
  );
}

/* ── Lightbox ─────────────────────────────────────────────────────── */

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const src = images[index];
  const isFirst = index === 0;
  const isLast = index === images.length - 1;

  // reset load state when index changes
  useEffect(() => {
    setImgLoaded(false);
  }, [index]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(src, { mode: "cors" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spicy-gallery-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab
      window.open(src, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-m3-fade-in sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Top toolbar */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center justify-between gap-2 px-4 py-4 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="rounded-full bg-white/10 px-4 py-1.5 type-label-large text-white backdrop-blur">
          {index + 1} <span className="opacity-50">/ {images.length}</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="이미지 다운로드"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Prev */}
      {!isFirst && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:flex sm:left-6"
          aria-label="이전 이미지"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next */}
      {!isLast && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:flex sm:right-6"
          aria-label="다음 이미지"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative flex max-h-full max-w-full items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {!imgLoaded && (
          <Loader2 className="absolute h-8 w-8 animate-spin text-white/70" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          src={src}
          alt=""
          onLoad={() => setImgLoaded(true)}
          className={cn(
            "max-h-[88vh] max-w-full rounded-2xl object-contain transition-opacity duration-300",
            imgLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      {/* Mobile prev/next bottom bar */}
      <div
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 sm:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="이전"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isLast}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 disabled:opacity-30"
          aria-label="다음"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
