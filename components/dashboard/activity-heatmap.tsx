interface Day {
  /** YYYY-MM-DD */
  date: string;
  count: number;
}

/**
 * GitHub-style contribution heatmap.
 * `days` must be ordered oldest → newest and aligned so the first item
 * is a Sunday (start of a week column).
 */
export default function ActivityHeatmap({
  days,
  max,
}: {
  days: Day[];
  max: number;
}) {
  // Chunk into week columns of 7 (Sun→Sat).
  const weeks: Day[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const level = (count: number): number => {
    if (count <= 0) return 0;
    if (max <= 1) return 4;
    const r = count / max;
    if (r <= 0.25) return 1;
    if (r <= 0.5) return 2;
    if (r <= 0.75) return 3;
    return 4;
  };

  const cellTone = [
    "bg-md-surface-container-high",
    "bg-spicy-container",
    "bg-spicy/45",
    "bg-spicy/70",
    "bg-spicy",
  ];

  // Month labels above week columns.
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const first = week.find((d) => d.date);
    if (!first) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        col,
        label: new Intl.DateTimeFormat("ko-KR", { month: "short" }).format(
          new Date(first.date)
        ),
      });
      lastMonth = m;
    }
  });

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div
          className="mb-1.5 grid gap-[3px] pl-7"
          style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
        >
          {weeks.map((_, col) => {
            const label = monthLabels.find((m) => m.col === col)?.label;
            return (
              <span
                key={col}
                className="type-label-small h-3 text-md-on-surface-variant"
              >
                {label ?? ""}
              </span>
            );
          })}
        </div>

        <div className="flex gap-[3px]">
          {/* Weekday labels */}
          <div className="mr-1 flex w-6 flex-col gap-[3px] text-right">
            {["", "월", "", "수", "", "금", ""].map((d, i) => (
              <span
                key={i}
                className="type-label-small flex h-[13px] items-center justify-end text-md-on-surface-variant"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, col) => (
            <div key={col} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, row) => {
                const day = week[row];
                if (!day) {
                  return <div key={row} className="h-[13px] w-[13px]" />;
                }
                const lv = level(day.count);
                const label = new Intl.DateTimeFormat("ko-KR", {
                  month: "long",
                  day: "numeric",
                }).format(new Date(day.date));
                return (
                  <div
                    key={row}
                    title={`${label} · ${day.count}건`}
                    className={`h-[13px] w-[13px] rounded-[3px] ${cellTone[lv]} transition-transform hover:scale-110`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-1.5 pr-1">
          <span className="type-label-small text-md-on-surface-variant">적음</span>
          {cellTone.map((tone, i) => (
            <div key={i} className={`h-[11px] w-[11px] rounded-[3px] ${tone}`} />
          ))}
          <span className="type-label-small text-md-on-surface-variant">많음</span>
        </div>
      </div>
    </div>
  );
}
