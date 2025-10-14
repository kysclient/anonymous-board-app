import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gid = searchParams.get('gid');
    const s_t_param = searchParams.get('s_t');
    const s_t: number | null = s_t_param ? parseInt(s_t_param, 10) : 0;

    const pw = "800d0bd544bb44f7360159dbd55c9fef39929fcbdd3a0871de340bcd5";
    const g_t = 687091414;

    if (!gid) {
        return NextResponse.json({ error: 'Missing gid parameter' }, { status: 400 });
    }

    try {
        // 한 페이지만 요청
        const apiResponse = await fetch(
            'https://sm-members.fcfc-1.com/photos/select_photos/892138f2-69e1-11ec-b3b1-0a0cd0c49dff1.json',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                body: JSON.stringify({
                    os: "i1",
                    ver: 559,
                    it: "190000",
                    s_t: s_t,
                    pw,
                    g_t,
                    gid,
                }),
            }
        );

        if (!apiResponse.ok) {
            throw new Error(`API error! status: ${apiResponse.status}`);
        }

        const apiData = await apiResponse.json();

        const images = apiData.ps?.map((item: any) => `https://d3vo2hyhx9t76k.cloudfront.net/${item.id}.png`) || [];

        // 다음 페이지 s_t 반환
        const nextCursor = apiData.s_t ?? null;

        return NextResponse.json(
            {
                success: true,
                data: {
                    title: `모임 ID: ${gid}`,
                    images,
                    photos: images,
                    nextCursor, // 클라이언트에서 다음 페이지 요청용
                },
            },
            {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                },
            }
        );
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
