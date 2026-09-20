"use client";

import { useAppContext, type TimeRange } from "@/context/AppContext";

const ranges: { value: TimeRange; label: string }[] = [
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
];

export default function TimeRangePicker() {
  const { timeRange, setTimeRange } = useAppContext();

  return (
    <div
      className="flex items-center gap-0.5 p-1 rounded-lg"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
    >
      {ranges.map((r) => {
        const isActive = timeRange === r.value;
        return (
          <button
            key={r.value}
            onClick={() => setTimeRange(r.value)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: isActive ? "var(--accent-primary)" : "transparent",
              color: isActive ? "#fff" : "var(--text-muted)",
              boxShadow: isActive ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none",
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
