import * as React from "react";

type Segment = { value: number; color: string; label: string };

export function DonutChart({
  segments,
  size = 168,
  thickness = 18,
  centerValue,
  centerLabel,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerValue?: React.ReactNode;
  centerLabel?: React.ReactNode;
}) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let offset = 0;

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={thickness}
        />
        {segments.map((seg, i) => {
          const fraction = total > 0 ? seg.value / total : 0;
          const length = fraction * circumference;
          const node = (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
          offset += length;
          return node;
        })}
      </svg>
      <div className="absolute grid place-items-center text-center">
        {centerValue ? <span className="text-2xl font-black tracking-tight">{centerValue}</span> : null}
        {centerLabel ? (
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            {centerLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function MiniBarChart({
  data,
  max,
  color = "rgb(52 211 153)",
}: {
  data: { label: string; value: number }[];
  max?: number;
  color?: string;
}) {
  const peak = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-36 items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max(5, (d.value / peak) * 100)}%`,
                background: `linear-gradient(180deg, ${color}, ${color}99)`,
              }}
              title={`${d.label}: ${d.value.toLocaleString("vi-VN")}`}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] font-bold text-muted-foreground">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ProgressBar({
  value,
  color = "rgb(52 211 153)",
}: {
  value: number;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}
