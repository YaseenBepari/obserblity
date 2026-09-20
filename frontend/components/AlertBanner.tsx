"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { api, type AlertItem } from "@/lib/api";

export default function AlertBanner() {
  const { currentApp, getTimeFrom } = useAppContext();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchAlerts = async () => {
      try {
        const data = await api.getAlerts(currentApp, 5);
        if (!cancelled) {
          setAlerts(data.alerts);
          setDismissed(new Set()); // Reset dismissed on app switch
        }
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentApp, getTimeFrom]);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

  if (visibleAlerts.length === 0) return null;

  const severityConfig = {
    critical: { bg: "rgba(220, 38, 38, 0.12)", border: "rgba(220, 38, 38, 0.3)", icon: "#fca5a5", text: "#fca5a5" },
    error: { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.25)", icon: "#f87171", text: "#f87171" },
    warning: { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.25)", icon: "#fbbf24", text: "#fbbf24" },
  };

  const topAlert = visibleAlerts[0];
  const config = severityConfig[topAlert.severity] || severityConfig.warning;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        className="rounded-xl overflow-hidden mb-4"
        style={{
          background: config.bg,
          border: `1px solid ${config.border}`,
        }}
      >
        {/* Main alert bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Alert icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={config.icon}
            strokeWidth="2"
            className="shrink-0"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>

          {/* Message */}
          <span className="text-xs flex-1" style={{ color: config.text }}>
            <span className="font-semibold uppercase mr-2">{topAlert.severity}</span>
            {topAlert.message}
            {topAlert.service && (
              <span className="ml-2 font-mono opacity-70">({topAlert.service})</span>
            )}
          </span>

          {/* Count badge */}
          {visibleAlerts.length > 1 && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: config.text,
              }}
            >
              +{visibleAlerts.length - 1} more
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}

          {/* Dismiss */}
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, topAlert.id]))}
            className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: config.text }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Expanded alerts */}
        <AnimatePresence>
          {collapsed && visibleAlerts.length > 1 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t px-4 pb-2"
              style={{ borderColor: config.border }}
            >
              {visibleAlerts.slice(1).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 py-2 text-xs"
                  style={{ color: severityConfig[alert.severity]?.text || config.text }}
                >
                  <span className="font-semibold uppercase w-16">{alert.severity}</span>
                  <span className="flex-1 opacity-80">{alert.message}</span>
                  <span className="font-mono text-[10px] opacity-50">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
                    className="p-0.5 rounded hover:bg-white/10 cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
