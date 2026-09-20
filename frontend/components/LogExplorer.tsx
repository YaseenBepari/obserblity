"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { api, createLogWebSocket, type InfraLogEntry, type UserLogEntry } from "@/lib/api";

type LogTab = "infra" | "user";
type LogLevel = "INFO" | "WARN" | "ERROR" | "CRITICAL";

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  INFO: { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.25)" },
  WARN: { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.25)" },
  ERROR: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.25)" },
  CRITICAL: { bg: "rgba(220, 38, 38, 0.2)", text: "#fca5a5", border: "rgba(220, 38, 38, 0.35)" },
};

interface LogEntry {
  id: string;
  timestamp: string;
  level?: string;
  source: string;
  message: string;
  raw: Record<string, unknown>;
  type: "infra" | "user";
}

export default function LogExplorer() {
  const { currentApp, getTimeFrom } = useAppContext();
  const [activeTab, setActiveTab] = useState<LogTab>("infra");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(new Set());
  const [liveTail, setLiveTail] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const level = activeFilters.size > 0 ? Array.from(activeFilters).join(",") : undefined;

      if (activeTab === "infra") {
        const result = await api.getInfraLogs(currentApp, {
          level,
          search: search || undefined,
          timeFrom: getTimeFrom(),
          limit: 100,
        });
        setLogs(
          result.entries.map((e: InfraLogEntry) => ({
            id: `${e.timestamp}-${e.host}-${e.service}-${e.event}`,
            timestamp: e.timestamp,
            level: e.level,
            source: `${e.service} @ ${e.host}`,
            message: e.event,
            raw: e as unknown as Record<string, unknown>,
            type: "infra" as const,
          }))
        );
      } else {
        const result = await api.getUserLogs(currentApp, {
          search: search || undefined,
          timeFrom: getTimeFrom(),
          limit: 100,
        });
        setLogs(
          result.entries.map((e: UserLogEntry) => ({
            id: `${e.timestamp}-${e.email}-${e.session_id}`,
            timestamp: e.timestamp,
            level: e.status_code >= 500 ? "ERROR" : e.status_code >= 400 ? "WARN" : "INFO",
            source: e.email,
            message: `${e.event_type} ${e.resource} [${e.status_code}]`,
            raw: e as unknown as Record<string, unknown>,
            type: "user" as const,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }, [currentApp, activeTab, search, activeFilters, getTimeFrom]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // WebSocket live tail
  useEffect(() => {
    if (!liveTail) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const ws = createLogWebSocket(currentApp, (data) => {
      const raw = data as unknown as Record<string, unknown>;
      const isInfra = "host" in data;
      const entry: LogEntry = isInfra
        ? {
            id: `live-${Date.now()}-${Math.random()}`,
            timestamp: (data as InfraLogEntry).timestamp,
            level: (data as InfraLogEntry).level,
            source: `${(data as InfraLogEntry).service} @ ${(data as InfraLogEntry).host}`,
            message: (data as InfraLogEntry).event,
            raw,
            type: "infra",
          }
        : {
            id: `live-${Date.now()}-${Math.random()}`,
            timestamp: (data as UserLogEntry).timestamp,
            level:
              (data as UserLogEntry).status_code >= 500
                ? "ERROR"
                : (data as UserLogEntry).status_code >= 400
                ? "WARN"
                : "INFO",
            source: (data as UserLogEntry).email,
            message: `${(data as UserLogEntry).event_type} ${(data as UserLogEntry).resource}`,
            raw,
            type: "user",
          };

      // Only show if matching active tab
      if (
        (activeTab === "infra" && entry.type === "infra") ||
        (activeTab === "user" && entry.type === "user")
      ) {
        setLogs((prev) => [entry, ...prev].slice(0, 200));
      }
    });

    wsRef.current = ws;
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [liveTail, currentApp, activeTab]);

  // Toggle level filter
  const toggleFilter = (level: LogLevel) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  return (
    <div className="ov-panel">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="ov-panel-header flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Log Explorer
          </h3>

          {/* Tab switcher */}
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
            {(["infra", "user"] as LogTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setExpandedRow(null); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: activeTab === tab ? "var(--accent-primary)" : "transparent",
                  color: activeTab === tab ? "#fff" : "var(--text-muted)",
                }}
              >
                {tab === "infra" ? "Infrastructure" : "User Activity"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg text-xs w-56 outline-none transition-all focus:ring-1"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Level filters */}
          <div className="flex gap-1.5">
            {(["INFO", "WARN", "ERROR", "CRITICAL"] as LogLevel[]).map((level) => {
              const isActive = activeFilters.has(level);
              const colors = LEVEL_COLORS[level];
              return (
                <button
                  key={level}
                  onClick={() => toggleFilter(level)}
                  className="px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition-all cursor-pointer"
                  style={{
                    background: isActive ? colors.bg : "transparent",
                    color: isActive ? colors.text : "var(--text-muted)",
                    border: `1px solid ${isActive ? colors.border : "var(--border-primary)"}`,
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  {level}
                </button>
              );
            })}
          </div>

          {/* Live tail toggle */}
          <button
            onClick={() => setLiveTail(!liveTail)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            style={{
              background: liveTail ? "rgba(34, 197, 94, 0.15)" : "var(--bg-secondary)",
              color: liveTail ? "#22c55e" : "var(--text-muted)",
              border: `1px solid ${liveTail ? "rgba(34, 197, 94, 0.3)" : "var(--border-primary)"}`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: liveTail ? "#22c55e" : "var(--text-muted)",
                boxShadow: liveTail ? "0 0 8px rgba(34, 197, 94, 0.5)" : "none",
                animation: liveTail ? "blink-red 1s ease-in-out infinite" : "none",
              }}
            />
            Live Tail
          </button>
        </div>
      </div>

      {/* ─── Log Entries ───────────────────────────────────────────────── */}
      <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-shimmer h-4 w-48 mx-auto rounded mb-3" />
            <div className="animate-shimmer h-4 w-64 mx-auto rounded mb-3" />
            <div className="animate-shimmer h-4 w-56 mx-auto rounded" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center" style={{ color: "var(--text-muted)" }}>
            <svg
              className="mx-auto mb-3"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p className="text-sm">No log entries found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-primary)" }}>
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Log row */}
                  <div
                    className="flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-white/[0.02]"
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  >
                    {/* Timestamp */}
                    <span
                      className="text-[11px] font-mono whitespace-nowrap pt-0.5"
                      style={{ color: "var(--text-muted)", minWidth: 150 }}
                    >
                      {formatTimestamp(log.timestamp)}
                    </span>

                    {/* Level badge */}
                    {log.level && (
                      <span
                        className="log-level shrink-0"
                        style={{
                          background: LEVEL_COLORS[log.level]?.bg || "transparent",
                          color: LEVEL_COLORS[log.level]?.text || "var(--text-muted)",
                          border: `1px solid ${LEVEL_COLORS[log.level]?.border || "transparent"}`,
                        }}
                      >
                        {log.level}
                      </span>
                    )}

                    {/* Source */}
                    <span
                      className="text-xs font-mono shrink-0"
                      style={{ color: "var(--accent-primary-light)", minWidth: 160 }}
                    >
                      {log.source}
                    </span>

                    {/* Separator */}
                    <span style={{ color: "var(--text-muted)" }}>—</span>

                    {/* Message */}
                    <span className="text-xs flex-1 break-all" style={{ color: "var(--text-secondary)" }}>
                      {log.message}
                    </span>

                    {/* Expand icon */}
                    <svg
                      className="shrink-0 transition-transform duration-200"
                      style={{
                        color: "var(--text-muted)",
                        transform: expandedRow === log.id ? "rotate(180deg)" : "rotate(0)",
                      }}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>

                  {/* Expanded JSON */}
                  <AnimatePresence>
                    {expandedRow === log.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-3"
                      >
                        <pre
                          className="text-[11px] font-mono p-4 rounded-lg overflow-x-auto"
                          style={{
                            background: "var(--bg-primary)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-primary)",
                          }}
                        >
                          {JSON.stringify(log.raw, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ts: string): string {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toISOString().replace("T", " ").substring(0, 19);
  } catch {
    return ts;
  }
}

