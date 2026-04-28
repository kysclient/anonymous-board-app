"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isNum } from "@/lib/investment/format";

interface Props {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  /** 가격 변동 시 빨강/파랑 깜빡임 */
  flash?: boolean;
}

/**
 * 숫자가 부드럽게 카운트업/다운되는 컴포넌트.
 * 가격, 등락률 등에 사용.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 400,
  className,
  flash = false,
}: Props) {
  const [display, setDisplay] = useState(value);
  const [flashClass, setFlashClass] = useState<string>("");
  const startVal = useRef(value);
  const startTime = useRef(0);
  const rafRef = useRef<number | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isNum(value)) return;

    // 첫 진입: 즉시 set, 애니메이션 X
    if (!initialized.current) {
      initialized.current = true;
      setDisplay(value);
      startVal.current = value;
      return;
    }

    if (value === display) return;

    // flash 효과
    if (flash && value !== display) {
      const isUp = value > display;
      setFlashClass(isUp ? "text-[#f04452]" : "text-[#3182f6]");
      window.setTimeout(() => setFlashClass(""), 500);
    }

    startVal.current = display;
    startTime.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startVal.current + (value - startVal.current) * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, flash, display]);

  if (!isNum(value)) {
    return <span className={className}>—</span>;
  }

  return (
    <span className={cn(className, flashClass, "transition-colors duration-500")}>
      {format ? format(display) : Math.round(display).toString()}
    </span>
  );
}
