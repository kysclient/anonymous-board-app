"use client";

import { useEffect } from "react";



export default function KakaoPage() {
    useEffect(() => {
        // Kakao SDK 스크립트 삽입
        const script = document.createElement("script");
        script.src = "https://developers.kakao.com/sdk/js/kakao.js";
        script.async = true;
        script.onload = () => {
            if (window.Kakao && !window.Kakao.isInitialized()) {
                window.Kakao.init('2b7d6d2ed276e8c1e73a1c1dd2f06e77');
            }
        };
        document.body.appendChild(script);
    }, []);

    const handleSendKakao = () => {
        if (window.Kakao) {
            window.Kakao.Link.sendCustom({
                templateId: 124838,
            });
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center flex-col gap-4 max-h-screen">
                <div className="max-w-md mx-auto">
            <img src="/hojun2.jpeg" className="w-full h-full" />

                </div>
            <button
                onClick={handleSendKakao}
                className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500"
            >
                카카오톡 공유하기
            </button>
        </div>
    );
};
