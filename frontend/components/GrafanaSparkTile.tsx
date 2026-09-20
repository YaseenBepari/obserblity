"use client";

import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface GrafanaSparkTileProps {
  title: string;
  subtitle?: string;
  value: number | string;
  unit?: string;
  data?: { value: number }[];
  color?: string;
}

export default function GrafanaSparkTile({
  title,
  subtitle = "10 sec, some",
  value,
  unit = "%",
  data = [],
  color = "#38bdf8",
}: GrafanaSparkTileProps) {
  // If no data provided, generate a small fallback sparkline
  const chartData =
    data.length > 0
      ? data
      : [
          { value: 4 },
          { value: 8 },
          { value: 6 },
          { value: 12 },
          { value: 9 },
          { value: 15 },
          { value: 11 },
          { value: 18 },
          { value: 14 },
          { value: 20 },
        ];

  return (
    <div
      className="p-3.5 rounded-xl border flex flex-col justify-between relative overflow-hidden group transition-all duration-200 hover:border-slate-700 select-none min-h-[110px]"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between z-10">
        <p className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
          {title}
        </p>
        {subtitle && (
          <span className="text-[10px] font-mono opacity-50 truncate" style={{ color: "var(--text-muted)" }}>
            ({subtitle})
          </span>
        )}
      </div>

      {/* ─── Large Numeric Readout ─────────────────────────────────────── */}
      <div className="z-10 my-1 flex items-baseline gap-1">
        <span className="text-2xl font-extrabold font-mono tracking-tight" style={{ color: "var(--text-primary)" }}>
          {typeof value === "number" ? value.toFixed(2) : value}
        </span>
        {unit && (
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {unit}
          </span>
        )}
      </div>

      {/* ─── Sparkline in background/footer ────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-12 opacity-40 group-hover:opacity-65 transition-opacity pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`spark-${title.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#spark-${title.replace(/\s+/g, "-")})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
