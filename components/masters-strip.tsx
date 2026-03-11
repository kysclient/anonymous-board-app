"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";

const MASTERS: { id: number; name: string; src: string | null }[] = [
  { id: 1, name: "Master 1", src: "/masters/1.png" },
  { id: 2, name: "Master 2", src: "/masters/2.png" },
  { id: 3, name: "Master 3", src: "/masters/3.png" },
  { id: 4, name: "Master 4", src: "/masters/4.png" },
  { id: 5, name: "Master 5", src: "/masters/5.png" },
  { id: 6, name: "김우경", src: null },
];

function HolographicCard({
  src,
  name,
  index,
}: {
  src: string | null;
  name: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(800px) rotateX(0deg) rotateY(0deg)");
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const card = cardRef.current;
    if (!card) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotateY = (x - 0.5) * 24;
      const rotateX = (0.5 - y) * 24;

      setTransform(
        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`
      );
      setGlare({ x: x * 100, y: y * 100, opacity: 0.35 });
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTransform("perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlare({ x: 50, y: 50, opacity: 0 });
    setIsHovered(false);
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const delay = index * 120;

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      className="relative flex-shrink-0 cursor-pointer select-none"
      style={{
        width: "clamp(100px, 15vw, 140px)",
        aspectRatio: "1 / 1",
        transform,
        transformStyle: "preserve-3d",
        transition: isHovered
          ? "transform 0.08s ease-out"
          : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
        animation: `masterCardIn 0.7s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms both`,
      }}
    >
      {/* Animated border gradient */}
      <div
        className="absolute -inset-[2px] rounded-xl opacity-60"
        style={{
          background: isHovered
            ? "conic-gradient(from var(--border-angle, 0deg), #3b82f6, #8b5cf6, #ec4899, #f59e0b, #3b82f6)"
            : "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))",
          animation: isHovered ? "borderSpin 3s linear infinite" : "none",
          transition: "opacity 0.4s ease",
        }}
      />

      {/* Card body */}
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-white/80 dark:bg-zinc-900">
        {/* Image or placeholder */}
        {src ? (
          <Image
            src={src}
            alt={name}
            fill
            sizes="(max-width: 640px) 100px, 140px"
            className="object-cover"
            unoptimized
            style={{
              filter: isHovered
                ? "saturate(1.1) contrast(1.05)"
                : "saturate(0.85) contrast(0.95)",
              transition: "filter 0.4s ease",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2">
            <span className="text-[13px] font-semibold text-foreground">{name}</span>
            <span className="text-center text-[9px] leading-tight text-muted-foreground">
              죄송해요{"\n"}시간나면 사진{"\n"}넣어드릴게요
            </span>
          </div>
        )}

        {/* Holographic shimmer overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              linear-gradient(
                ${glare.y * 1.8 + 100}deg,
                transparent 20%,
                rgba(120, 160, 255, 0.08) 40%,
                rgba(200, 140, 255, 0.12) 50%,
                rgba(120, 160, 255, 0.08) 60%,
                transparent 80%
              )
            `,
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />

        {/* Glare spotlight */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(
              circle at ${glare.x}% ${glare.y}%,
              rgba(255, 255, 255, ${glare.opacity}) 0%,
              transparent 60%
            )`,
            transition: isHovered ? "none" : "opacity 0.4s ease",
          }}
        />

        {/* Scan line effect */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
            opacity: isHovered ? 1 : 0.3,
            transition: "opacity 0.3s ease",
          }}
        />

        {/* Bottom gradient fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
          }}
        />

        {/* Noise texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </div>
  );
}

export default function MastersStrip() {
  return (
    <>
      <style jsx global>{`
        @keyframes masterCardIn {
          from {
            opacity: 0;
            transform: perspective(800px) rotateY(-12deg) translateY(30px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: perspective(800px) rotateY(0deg) translateY(0px) scale(1);
          }
        }
        @property --border-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes borderSpin {
          to {
            --border-angle: 360deg;
          }
        }
      `}</style>
      <section className="relative overflow-hidden rounded-2xl border border-border/40 p-6 sm:p-8">
        {/* Light mode gradient bg */}
        <div
          className="pointer-events-none absolute inset-0 dark:hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(220 20% 97%) 0%, hsl(230 25% 95%) 30%, hsl(250 20% 96%) 60%, hsl(220 20% 97%) 100%)",
          }}
        />
        {/* Dark mode gradient bg */}
        <div
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{
            background:
              "linear-gradient(135deg, hsl(220 15% 10%) 0%, hsl(240 15% 12%) 30%, hsl(260 12% 11%) 60%, hsl(220 15% 10%) 100%)",
          }}
        />

        {/* Ambient background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-1/4 -top-1/4 h-2/3 w-2/3 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute -bottom-1/4 -right-1/4 h-2/3 w-2/3 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute left-1/3 top-1/4 h-1/2 w-1/2 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 60%)",
              filter: "blur(70px)",
            }}
          />
        </div>

        {/* Title */}
        <div className="relative mb-6 sm:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Operations
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            SPICY Masters
          </h2>
        </div>

        {/* Cards row */}
        <div className="relative flex justify-center gap-3 overflow-x-auto pb-2 scrollbar-hide sm:gap-5">
          {MASTERS.map((master, i) => (
            <HolographicCard
              key={master.id}
              src={master.src}
              name={master.name}
              index={i}
            />
          ))}
        </div>
      </section>
    </>
  );
}
