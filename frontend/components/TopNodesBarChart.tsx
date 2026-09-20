"use client";

import { motion } from "framer-motion";

interface TopNodeItem {
  host: string;
  value: number;
}

interface TopNodesBarChartProps {
  title: string;
  items: TopNodeItem[];
  unit?: string;
  max?: number;
}

const colorPalette = [
  { bg: "rgba(129, 140, 248, 0.15)", text: "#818cf8", border: "rgba(129, 140, 248, 0.3)", bar: "#6366f1" },
  { bg: "rgba(52, 211, 153, 0.15)", text: "#34d399", border: "rgba(52, 211, 153, 0.3)", bar: "#10b981" },
  { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24", border: "rgba(251, 191, 36, 0.3)", bar: "#f59e0b" },
  { bg: "rgba(56, 189, 248, 0.15)", text: "#38bdf8", border: "rgba(56, 189, 248, 0.3)", bar: "#0284c7" },
  { bg: "rgba(244, 114, 182, 0.15)", text: "#f472b6", border: "rgba(244, 114, 182, 0.3)", bar: "#db2777" },
  { bg: "rgba(167, 139, 250, 0.15)", text: "#a78bfa", border: "rgba(167, 139, 250, 0.3)", bar: "#8b5cf6" },
];

export default function TopNodesBarChart({
  title,
  items,
  unit = "%",
  max = 100,
}: TopNodesBarChartProps) {
  const displayItems = items.slice(0, 6);

  return (
    <div
      className="p-4 rounded-xl border flex flex-col justify-between"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border-primary)" }}>
        <h4 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h4>
        <div className="flex items-center gap-6 text-[10px] font-mono text-slate-400">
          <span>Dimension</span>
          <span>Value {unit}</span>
        </div>
      </div>

      {/* ─── Bars List ─────────────────────────────────────────────────── */}
      <div className="mt-3 space-y-2.5">
        {displayItems.length === 0 ? (
          <p className="text-xs text-center py-4 text-slate-500">No nodes reporting</p>
        ) : (
          displayItems.map((item, idx) => {
            const colors = colorPalette[idx % colorPalette.length];
            const pct = Math.min(100, Math.max(0, (item.value / max) * 100));

            return (
              <div key={item.host} className="group flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  {/* Host tag pill */}
                  <span
                    className="px-2 py-0.5 rounded font-mono text-[11px] truncate max-w-[220px]"
                    style={{
                      background: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {item.host}
                  </span>

                  {/* Value */}
                  <span className="font-mono font-bold text-xs" style={{ color: "var(--text-primary)" }}>
                    {item.value.toFixed(1)} {unit}
                  </span>
                </div>

                {/* Horizontal Progress Bar Track */}
                <div
                  className="h-1.5 w-full rounded-full overflow-hidden"
                  style={{ background: "rgba(255, 255, 255, 0.06)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                    style={{
                      background: colors.bar,
                      boxShadow: `0 0 8px ${colors.bar}60`,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      {items.length > 6 && (
        <div className="mt-3 pt-2 border-t text-[10px] text-slate-500 font-mono" style={{ borderColor: "var(--border-primary)" }}>
          +{items.length - 6} more nodes in cluster
        </div>
      )}
    </div>
  );
}
