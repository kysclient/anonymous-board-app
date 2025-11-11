'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Image as ImageIcon, Download, ExternalLink, Search, X, Loader2 } from 'lucide-react';

interface SomoimData {
    title: string;
    images: string[];
    nextCursor?: number | null;
}

export default function Page() {
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState('https://www.somoim.co.kr/046f7cba-5ae7-11ee-8483-0ad92de4214b1');
    const [s_t, setST] = useState<number | null>(0);
    const [hasMore, setHasMore] = useState(true);

    const loaderRef = useRef<HTMLDivElement | null>(null);

    const gid = url.match(/\/([a-f0-9-]+)$/)?.[1] || null;

    const fetchNextPage = useCallback(async () => {
        if (!gid || !hasMore || loading || s_t === null) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/somoim?gid=${gid}&s_t=${s_t}`);
            const result: { success: boolean; data?: SomoimData; error?: string } = await response.json();

            if (result.success && result.data) {
                const newImages = result.data.images || [];
                setImages(prev => [...prev, ...newImages]);

                // 다음 커서 업데이트
                const nextCursor = (result.data as any).nextCursor ?? null;
                setST(nextCursor);
                setHasMore(nextCursor !== null);
            } else {
                setError(result.error || '데이터를 가져올 수 없습니다.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류');
        } finally {
            setLoading(false);
        }
    }, [gid, hasMore, loading, s_t]);

    // Intersection Observer로 무한 스크롤 구현
    useEffect(() => {
        if (!loaderRef.current) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                fetchNextPage();
            }
        }, { rootMargin: '200px' });

        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [fetchNextPage]);

    return (
        <div className="min-h-screen bg-background">
            <div className=" mx-auto p-0 sm:px-4 py-8 max-w-7xl">
                {/* Search Bar */}


                {/* Error */}
                {error && <div className="text-red-500 mb-4">{error}</div>}

                {/* Image Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {
                        images.length === 0 && (
                            <>
                                {
                                    [1, 2, 3, 4, 5, 6, 7, 9].map((_, i) => (
                                        <Card key={i} className="overflow-hidden">
                                            <CardContent className="p-0 aspect-square">
                                                <Skeleton className='w-full h-full' />
                                            </CardContent>
                                        </Card>

                                    ))
                                }
                            </>
                        )
                    }
                    {images.map((img, idx) => (
                        <Card key={idx} className="overflow-hidden">
                            <CardContent className="p-0 aspect-square">
                                <img src={img} className="w-full h-full object-cover" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* 로딩 스켈레톤 */}
                {loading && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
                        {[...Array(10)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
                    </div>
                )}

                {/* Intersection Observer 대상 */}
                <div ref={loaderRef} className="h-10"></div>

                {!hasMore && <p className="text-center mt-4 text-muted-foreground">모든 이미지를 불러왔습니다.</p>}
            </div>
        </div>
    );
}
