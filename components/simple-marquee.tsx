"use client";

export default function SimpleMarquee() {
  // 애니메이션 지속 시간을 늘려 속도를 늦춤 (초 단위)
  const animationDuration = "120s"; // 2분 동안 한 번 순환

  return (
    <div className="relative flex overflow-x-hidden bg-black text-white py-2 font-bold sticky top-0 z-50">
      <div
        className="whitespace-nowrap py-1"
        style={{
          animation: `marquee ${animationDuration} linear infinite`,
        }}
      >
        {Array.from({ length: 100 }).map((_, index) => (
          <span key={index} className="mx-4">
            이호준 여미새련
          </span>
        ))}
      </div>


      {/* 애니메이션 키프레임 정의 */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        @keyframes marquee2 {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  );
}
