"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface GrafanaGaugeProps {
  title: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  thresholds?: {
    warn?: number;
    danger?: number;
  };
  variant?: "semi" | "circular";
  color?: string;
  info?: string;
}

export default function GrafanaGauge({
  title,
  value,
  unit = "%",
  min = 0,
  max = 100,
  thresholds = { warn: 60, danger: 80 },
  variant = "semi",
  color,
  info,
}: GrafanaGaugeProps) {
  const clampValue = Math.min(max, Math.max(min, value));
  const percentage = (clampValue - min) / (max - min);

  // Compute color based on thresholds unless custom color is provided
  const arcColor = useMemo(() => {
    if (color) return color;
    if (thresholds.danger !== undefined && clampValue >= thresholds.danger) {
      return "#ef4444"; // red
    }
    if (thresholds.warn !== undefined && clampValue >= thresholds.warn) {
      return "#f59e0b"; // amber / yellow
    }
    return "#22c55e"; // green
  }, [clampValue, thresholds, color]);

  // Semi-circle SVG coordinates (radius 60, center (75, 75))
  const radius = 54;
  const cx = 75;
  const cy = 70;
  const strokeWidth = 9;
  const circumference = Math.PI * radius; // for half-circle
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div
      className="p-3.5 rounded-xl border flex flex-col justify-between relative group transition-all duration-200 hover:border-slate-700 select-none"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* ─── Title & Info ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span
          className="text-xs font-medium truncate"
          style={{ color: "var(--text-secondary)" }}
          title={title}
        >
          {title}
        </span>
        {info && (
          <span
            className="text-[10px] opacity-40 hover:opacity-100 cursor-help transition-opacity"
            title={info}
          >
            ⓘ
          </span>
        )}
      </div>

      {/* ─── Gauge SVG Area ────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center my-1">
        <svg
          width="150"
          height="85"
          viewBox="0 0 150 85"
          className="overflow-visible"
        >
          {/* Background track arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value filled arc */}
          <motion.path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            style={{
              filter: `drop-shadow(0 0 6px ${arcColor}50)`,
            }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute top-10 flex flex-col items-center justify-center text-center">
          <span
            className="text-xl font-bold font-mono tracking-tight"
            style={{ color: arcColor }}
          >
            {value.toLocaleString(undefined, {
              minimumFractionDigits: value % 1 !== 0 ? (value < 10 ? 2 : 1) : 0,
              maximumFractionDigits: 2,
            })}
            <span className="text-xs font-normal ml-0.5 opacity-80" style={{ color: "var(--text-muted)" }}>
              {unit}
            </span>
          </span>
        </div>

        {/* Min / Max labels */}
        <div className="w-full flex items-center justify-between px-3 text-[9px] font-mono -mt-1 text-slate-500">
          <span>{min}</span>
          <span>{max}{unit === "%" ? "%" : ""}</span>
        </div>
      </div>
    </div>
  );
}
