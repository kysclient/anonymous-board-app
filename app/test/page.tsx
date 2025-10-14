// app/components/SomoimFetcher.tsx
'use client';

import { useState } from 'react';

interface SomoimData {
  title: string;
  images: string[];
  rawHtml: string;
}

export default function Page() {
  const [data, setData] = useState<SomoimData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('https://www.somoim.co.kr/e03ab496-0dd3-11ee-8cf5-0a16fe5c82071');

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/somoim?url=${encodeURIComponent(url)}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || '데이터를 가져올 수 없습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Somoim 데이터 가져오기</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Somoim URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.somoim.co.kr/..."
          />
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? '로딩 중...' : '가져오기'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <p className="font-semibold">오류 발생:</p>
          <p>{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">제목</h2>
            <p className="text-gray-700">{data.title}</p>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">이미지 ({data.images.length}개)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.images.slice(0, 12).map((img, idx) => (
                <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={img}
                    alt={`이미지 ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/150?text=Error';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Raw HTML (일부)</h2>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
              {data.rawHtml}
            </pre>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">전체 데이터 (JSON)</h2>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}