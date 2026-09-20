"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, APP_META } from "@/context/AppContext";
import { api, type AlertItem } from "@/lib/api";

export default function AlertsPanel() {
  const { currentApp, getTimeFrom } = useAppContext();
  const meta = APP_META[currentApp];
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "critical" | "error" | "warning">("all");
  const [search, setSearch] = useState("");
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts(currentApp, 50);
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [currentApp, getTimeFrom]);

  const toggleAcknowledge = (id: string) => {
    setAcknowledged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filter !== "all" && alert.severity !== filter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesMsg = alert.message.toLowerCase().includes(query);
        const matchesService = alert.service?.toLowerCase().includes(query);
        const matchesHost = alert.host?.toLowerCase().includes(query);
        if (!matchesMsg && !matchesService && !matchesHost) return false;
      }
      return true;
    });
  }, [alerts, filter, search]);

  const counts = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      error: alerts.filter((a) => a.severity === "error").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
    };
  }, [alerts]);

  const severityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          bg: "rgba(220, 38, 38, 0.15)",
          border: "rgba(220, 38, 38, 0.35)",
          color: "#f87171",
          label: "CRITICAL",
          dot: "#ef4444",
        };
      case "error":
        return {
          bg: "rgba(239, 68, 68, 0.12)",
          border: "rgba(239, 68, 68, 0.3)",
          color: "#fb7185",
          label: "ERROR",
          dot: "#f43f5e",
        };
      default:
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          border: "rgba(245, 158, 11, 0.3)",
          color: "#fbbf24",
          label: "WARN",
          dot: "#f59e0b",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Metric Overview Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-4 rounded-xl border relative overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Total Active Alerts
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
              {counts.total}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              for {meta.label}
            </span>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(220, 38, 38, 0.1), var(--bg-card))",
            borderColor: "rgba(220, 38, 38, 0.3)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: "var(--status-down)" }}>
              Critical
            </p>
            {counts.critical > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--status-down)" }}>
              {counts.critical}
            </span>
            <span className="text-[10px]" style={{ color: "var(--status-down)" }}>
              immediate attention
            </span>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), var(--bg-card))",
            borderColor: "rgba(239, 68, 68, 0.25)",
          }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--status-down)" }}>
            Errors
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--status-down)" }}>
              {counts.error}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              high priority
            </span>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--bg-card))",
            borderColor: "rgba(245, 158, 11, 0.25)",
          }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--status-degraded)" }}>
            Warnings
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--status-degraded)" }}>
              {counts.warning}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              monitor status
            </span>
          </div>
        </div>
      </div>

      {/* ─── Controls & Filters ───────────────────────────────────────── */}
      <div
        className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center gap-2">
          {(["all", "critical", "error", "warning"] as const).map((lvl) => {
            const isSelected = filter === lvl;
            const badgeCount =
              lvl === "all"
                ? counts.total
                : counts[lvl];

            return (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer capitalize"
                style={{
                  background: isSelected ? "var(--accent-primary)" : "var(--bg-secondary)",
                  color: isSelected ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${isSelected ? "var(--accent-primary-light)" : "var(--border-primary)"}`,
                }}
              >
                {lvl}
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{
                    background: isSelected ? "rgba(255,255,255,0.2)" : "var(--bg-tertiary)",
                    color: isSelected ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {badgeCount}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by message, host, service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 pl-8 rounded-lg text-xs w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
              }}
            />
            <svg
              className="absolute left-2.5 top-2.5 text-gray-400"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <button
            onClick={fetchAlerts}
            className="p-2 rounded-lg text-xs transition-colors hover:bg-white/10 cursor-pointer"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-primary)",
            }}
            title="Refresh alerts"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Alerts Stream Table ──────────────────────────────────────── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b text-[11px] font-semibold uppercase tracking-wider"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-muted)",
                  borderColor: "var(--border-primary)",
                }}
              >
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Service / Host</th>
                <th className="px-4 py-3">Event Message</th>
                <th className="px-4 py-3">Metrics</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-primary)" }}>
              <AnimatePresence>
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <p className="font-medium text-sm text-gray-300">All systems operational</p>
                        <p className="text-xs">No active alerts match current criteria for {meta.label}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => {
                    const badge = severityBadge(alert.severity);
                    const isAck = acknowledged.has(alert.id);

                    return (
                      <motion.tr
                        key={alert.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isAck ? 0.45 : 1 }}
                        exit={{ opacity: 0 }}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px]"
                            style={{
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              color: badge.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: badge.dot }}
                            />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          {new Date(alert.timestamp).toLocaleTimeString()}
                          <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {new Date(alert.timestamp).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {alert.service && (
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-mono mr-1.5"
                              style={{
                                background: "var(--bg-tertiary)",
                                color: "var(--accent-primary-light)",
                                border: "1px solid var(--border-primary)",
                              }}
                            >
                              {alert.service}
                            </span>
                          )}
                          {alert.host && (
                            <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                              {alert.host}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5" style={{ color: isAck ? "var(--text-muted)" : "var(--text-primary)" }}>
                          <p className="font-medium text-xs">{alert.message}</p>
                          {alert.pod && (
                            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                              pod: {alert.pod}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px]">
                          {alert.cpu_percent !== null && alert.cpu_percent !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span style={{ color: alert.cpu_percent > 85 ? "#ef4444" : "var(--text-muted)" }}>
                                CPU: {alert.cpu_percent}%
                              </span>
                              {alert.memory_percent !== null && (
                                <span style={{ color: alert.memory_percent > 85 ? "#ef4444" : "var(--text-muted)" }}>
                                  MEM: {alert.memory_percent}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <button
                            onClick={() => toggleAcknowledge(alert.id)}
                            className="px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
                            style={{
                              background: isAck ? "var(--bg-tertiary)" : "rgba(99, 102, 241, 0.15)",
                              color: isAck ? "var(--text-muted)" : "var(--accent-primary-light)",
                              border: `1px solid ${isAck ? "var(--border-primary)" : "rgba(99, 102, 241, 0.3)"}`,
                            }}
                          >
                            {isAck ? "Acknowledged" : "Acknowledge"}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
