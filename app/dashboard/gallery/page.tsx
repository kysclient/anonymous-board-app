"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  ZoomIn,
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
  const inFlight = useRef(false);
  const loadedCursors = useRef(new Set<number>());
  const gid = url.match(/\/([a-f0-9-]+)$/)?.[1] || null;

  /* ── pagination (preserved) ──────────────────────────────────── */
  const fetchNextPage = useCallback(async () => {
    if (!gid || !hasMore || s_t === null) return;
    if (inFlight.current) return; // ref guard: prevents duplicate fetches
    if (loadedCursors.current.has(s_t)) {
      setHasMore(false);
      return;
    }

    inFlight.current = true;
    loadedCursors.current.add(s_t);
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
        setImages((prev) => {
          const existing = new Set(prev);
          const uniqueImages = newImages.filter((image) => {
            if (existing.has(image)) return false;
            existing.add(image);
            return true;
          });
          return [...prev, ...uniqueImages];
        });

        const nextCursor = result.data.nextCursor ?? null;
        setST(nextCursor);
        setHasMore(
          nextCursor !== null && !loadedCursors.current.has(nextCursor)
        );
      } else {
        loadedCursors.current.delete(s_t);
        setError(result.error || "데이터를 가져올 수 없습니다.");
      }
    } catch (err) {
      loadedCursors.current.delete(s_t);
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [gid, hasMore, s_t]);

  /* Initial load — don't wait for the scroll sentinel to intersect.
     (On mobile the sentinel can sit below the fold, so first page never loaded.) */
  useEffect(() => {
    fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
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
      {/* Page header — Apple clean */}
      <header className="border-b border-md-outline-variant pb-7 pt-1 sm:pb-9">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-spicy">
              <ImageIcon className="h-3.5 w-3.5" />
              Spicy Archive
            </p>
            <h1 className="mt-3 text-[34px] font-medium tracking-[-0.035em] text-md-on-surface sm:text-[46px]">
              우리가 함께한 순간들
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-md-on-surface-variant">
              사진의 원래 비율을 그대로 담은 SPICY 아카이브입니다.
            </p>
          </div>

          <div className="flex min-w-[170px] items-center justify-between gap-8 rounded-2xl bg-md-surface-container-lowest px-5 py-4 sm:block sm:text-right">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-md-on-surface-variant">
              Photos loaded
            </span>
            <p className="mt-0 text-[25px] font-medium tabular-nums tracking-[-0.03em] text-md-on-surface sm:mt-1">
              {images.length.toLocaleString()}
              <span className="ml-1 text-[13px] font-normal text-md-on-surface-variant">장</span>
            </p>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-md-error-container px-5 py-4 type-body-medium text-md-on-error-container">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchNextPage}
            className="rounded-full bg-md-on-error-container px-4 py-2 text-[12px] font-medium text-md-error-container"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Masonry grid */}
      <section>
        {images.length === 0 && !error ? (
          <SkeletonGrid count={10} />
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 [grid-auto-flow:dense] [grid-auto-rows:1px] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {images.map((img, idx) => (
              <PhotoTile
                key={`${img}-${idx}`}
                src={img}
                index={idx}
                onClick={() => setLightboxIdx(idx)}
              />
            ))}
          </div>
        ) : null}

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
  index,
  onClick,
}: {
  src: string;
  index: number;
  onClick: () => void;
}) {
  // First screenful loads eagerly so photos appear without scrolling.
  const eager = index < 8;
  const [aspect, setAspect] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [rowSpan, setRowSpan] = useState(24);
  const tileRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const tile = tileRef.current;
    if (!tile) return;

    const updateSpan = () => {
      const grid = tile.parentElement;
      if (!grid) return;

      const gridStyle = window.getComputedStyle(grid);
      const rowHeight = Number.parseFloat(gridStyle.gridAutoRows) || 1;
      const rowGap = Number.parseFloat(gridStyle.rowGap) || 12;
      const tileWidth = tile.getBoundingClientRect().width;
      const desiredHeight = tileWidth / (aspect ?? 4 / 5);
      const nextSpan = Math.max(
        1,
        Math.ceil((desiredHeight + rowGap) / (rowHeight + rowGap))
      );

      setRowSpan((current) => (current === nextSpan ? current : nextSpan));
    };

    updateSpan();
    const resizeObserver = new ResizeObserver(updateSpan);
    resizeObserver.observe(tile);

    return () => resizeObserver.disconnect();
  }, [aspect]);

  return (
    <button
      ref={tileRef}
      type="button"
      onClick={onClick}
      style={{ gridRowEnd: `span ${rowSpan}` }}
      className="group relative block h-full w-full overflow-hidden rounded-2xl bg-md-surface-container-highest text-left opacity-0 animate-m3-fade-in [animation-fill-mode:forwards] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:elev-3"
    >
      {/* Aspect-locked box: matches the image's natural ratio so it always fills */}
      <div
        className="relative h-full w-full"
      >
        {/* Skeleton fills the box until image is decoded */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-md-surface-container-highest" />
        )}

        {failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-md-surface-container-high text-md-on-surface-variant">
            <ImageIcon className="h-5 w-5 opacity-50" />
          </div>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setAspect(img.naturalWidth / img.naturalHeight);
            }
            setLoaded(true);
          }}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500",
            loaded && !failed ? "opacity-100" : "opacity-0",
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
    <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl bg-md-surface-container-highest"
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
