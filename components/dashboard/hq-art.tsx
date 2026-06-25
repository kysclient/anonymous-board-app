/**
 * Ambient generative art for the HQ command bar.
 * Sits behind the hero text — kept subtle so copy stays legible.
 * Pure SVG + CSS animation (no JS).
 */
export default function HqArt() {
  // Right-side cluster of pulsing rounded squares.
  const cols = 6;
  const rows = 4;
  const size = 34;
  const gap = 14;
  const startX = 1200 - (cols * (size + gap)) + gap - 40;
  const startY = 36;
  const cells: { x: number; y: number; on: boolean; i: number }[] = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = (c * 2 + r * 3) % 5 === 0 || (c === 5 && r === 1);
      cells.push({ x: startX + c * (size + gap), y: startY + r * (size + gap), on, i: i++ });
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 1200 320"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <pattern id="hq-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M44 0H0V44" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
          <radialGradient id="hq-fade" cx="100%" cy="0%" r="90%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="hq-mask">
            <rect width="1200" height="320" fill="url(#hq-fade)" />
          </mask>
        </defs>

        {/* faint grid texture */}
        <rect width="1200" height="320" fill="url(#hq-grid)" />

        {/* drifting blue glow */}
        <circle className="art-float" cx="1050" cy="70" r="160" fill="rgba(10,132,255,0.22)" style={{ filter: "blur(60px)" }} />

        {/* concentric rings, right side */}
        <g mask="url(#hq-mask)">
          {[60, 120, 190].map((r) => (
            <circle key={r} cx="1080" cy="120" r={r} fill="none" stroke="rgba(120,180,255,0.12)" strokeWidth="1.2" />
          ))}
          <circle cx="1080" cy="120" r="46" fill="none" stroke="rgba(120,180,255,0.4)" strokeWidth="1.4" className="art-ping" />
        </g>

        {/* pulsing square cluster */}
        <g mask="url(#hq-mask)">
          {cells.map((cell) =>
            cell.on ? (
              <rect
                key={cell.i}
                className="art-sq"
                x={cell.x}
                y={cell.y}
                width={size}
                height={size}
                rx="9"
                fill="rgba(120,180,255,0.85)"
                style={{
                  animationDelay: `${(cell.i % 6) * 0.35}s`,
                  filter: "drop-shadow(0 0 10px rgba(10,132,255,0.7))",
                }}
              />
            ) : (
              <rect
                key={cell.i}
                x={cell.x}
                y={cell.y}
                width={size}
                height={size}
                rx="9"
                fill="none"
                stroke="rgba(150,190,255,0.14)"
                strokeWidth="1.2"
              />
            )
          )}
        </g>
      </svg>
    </div>
  );
}
