"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; direction: "up" | "down" };
  icon?: ReactNode;
  color?: string;
  delay?: number;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = "var(--accent-primary)",
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="ov-card flex flex-col gap-3 relative overflow-hidden group"
    >
      {/* Accent glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
        style={{ background: color }}
      />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {title}
        </span>
        {icon && (
          <span
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: `${color}15`, color }}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-end gap-3 relative z-10">
        <motion.span
          key={String(value)}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
          className="text-3xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </motion.span>

        {trend && (
          <span
            className="flex items-center gap-1 text-xs font-semibold pb-1"
            style={{
              color: trend.direction === "up" ? "var(--status-healthy)" : "var(--status-down)",
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="currentColor"
              style={{ transform: trend.direction === "down" ? "rotate(180deg)" : "none" }}
            >
              <path d="M5 0L10 6H0L5 0Z" />
            </svg>
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {subtitle && (
        <span className="text-xs relative z-10" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </span>
      )}
    </motion.div>
  );
}
