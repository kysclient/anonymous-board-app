import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get('src');

  if (!src) {
    return NextResponse.json({ error: 'Missing src parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(src, {
      method: 'GET',
      headers: {
        // CloudFront가 www.somoim.co.kr에서만 허용하므로 referer 고정
        'Referer': 'https://www.somoim.co.kr/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!res.ok) {
      throw new Error(`CDN fetch failed (${res.status})`);
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 1일 캐시
      },
    });
  } catch (err: any) {
    console.error('Proxy error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
