"use client";

import React from "react";
import { PixelatedCanvas } from "@/components/ui/pixelated-canvas";

const MOBILE_MAX_WIDTH = 640;

export default function MastersStrip() {
  const [size, setSize] = React.useState({ width: 400, height: 500 });

  React.useEffect(() => {
    const updateSize = () => {
      const isMobile = window.innerWidth < MOBILE_MAX_WIDTH;
      setSize(isMobile ? { width: 240, height: 300 } : { width: 400, height: 500 });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <section className="flex rounded-2xl overflow-hidden">
      <div className="w-full flex flex-row items-center scrollbar-hide gap-2 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((item) => (
          <PixelatedCanvas
            key={item}
            src={`/masters/${item}.png`}
            width={size.width}
            height={size.height}
          />
        ))}
      </div>
    </section>
  );
}

