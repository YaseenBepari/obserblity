"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppContext, APP_META } from "@/context/AppContext";
import { api, type UserDetailAnalytics } from "@/lib/api";

interface UserDetailPageProps {
  email: string;
  onBack: () => void;
  onApprovalChanged?: (email: string, status: "approved" | "pending" | "rejected") => void;
}

export default function UserDetailPage({
  email,
  onBack,
  onApprovalChanged,
}: UserDetailPageProps) {
  const { currentApp } = useAppContext();
  const meta = APP_META[currentApp];
  const [detail, setDetail] = useState<UserDetailAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await api.getUserDetail(currentApp, email);
      setDetail(data);
    } catch (err) {
      console.error("Failed to fetch user detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [currentApp, email]);

  const handleApprovalAction = async (status: "approved" | "pending" | "rejected") => {
    try {
      setUpdating(true);
      await api.updateUserApproval(currentApp, email, status);
      setDetail((prev) => (prev ? { ...prev, approval_status: status } : null));
      onApprovalChanged?.(email, status);
      setToastMessage(`User status updated to ${status.toUpperCase()}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("Failed to update approval:", err);
      setToastMessage("Failed to update status");
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !detail) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          ← Back to Users Directory
        </button>
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse h-44" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>User not found</p>
        <button onClick={onBack} className="mt-4 text-xs text-indigo-400 underline">
          ← Back to Users Directory
        </button>
      </div>
    );
  }

  const { profile, metrics, approval_status, cost_timeline, resource_breakdown, session_history, recent_logs } = detail;

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bg: "rgba(34, 197, 94, 0.15)",
          border: "rgba(34, 197, 94, 0.35)",
          text: "#4ade80",
          label: "ACCESS APPROVED",
          dot: "#22c55e",
        };
      case "rejected":
        return {
          bg: "rgba(239, 68, 68, 0.15)",
          border: "rgba(239, 68, 68, 0.35)",
          text: "#f87171",
          label: "ACCESS REJECTED",
          dot: "#ef4444",
        };
      default:
        return {
          bg: "rgba(245, 158, 11, 0.15)",
          border: "rgba(245, 158, 11, 0.35)",
          text: "#fbbf24",
          label: "APPROVAL PENDING",
          dot: "#f59e0b",
        };
    }
  };

  const badge = statusBadge(approval_status);

  return (
    <div className="space-y-6">
      {/* ─── Back Navigation & Toast ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
        >
          <span>← Back to Users Directory</span>
        </button>

        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Profile Header Banner ────────────────────────────────────── */}
      <div
        className="p-6 rounded-2xl border relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl border shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${meta.color}30, rgba(99, 102, 241, 0.2))`,
              color: meta.color,
              borderColor: `${meta.color}50`,
            }}
          >
            {profile.avatar}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h3 className="text-xl font-bold tracking-tight text-white">{profile.name}</h3>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono"
                style={{
                  background: badge.bg,
                  border: `1px solid ${badge.border}`,
                  color: badge.text,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.dot }} />
                {badge.label}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              {profile.role} · <span className="text-slate-400">{profile.department}</span>
            </p>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              {email} · Member since {profile.joined_date}
            </p>
          </div>
        </div>

        {/* Admin Approval Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6 border-slate-800">
          <span className="text-[11px] uppercase font-semibold text-slate-400 font-mono tracking-wider">
            Admin Action:
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApprovalAction("approved")}
              disabled={updating || approval_status === "approved"}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: approval_status === "approved" ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.12)",
                color: "#4ade80",
                border: "1px solid rgba(34, 197, 94, 0.35)",
              }}
            >
              <span>✓</span>
              <span>Approve Access</span>
            </button>

            <button
              onClick={() => handleApprovalAction("rejected")}
              disabled={updating || approval_status === "rejected"}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: approval_status === "rejected" ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.12)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.35)",
              }}
            >
              <span>✕</span>
              <span>Reject Access</span>
            </button>

            <button
              onClick={() => handleApprovalAction("pending")}
              disabled={updating || approval_status === "pending"}
              className="p-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Reset to Pending Approval"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4 Top Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total API Cost */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between relative overflow-hidden"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-accent)",
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-300">Total API Cost</span>
              <span className="text-[10px] font-mono text-indigo-400 font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                USD
              </span>
            </div>
            <div className="mt-2 text-3xl font-extrabold font-mono text-white tracking-tight">
              ${metrics.total_cost_usd.toFixed(2)}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">
            Avg ${(metrics.total_cost_usd / Math.max(1, metrics.total_sessions)).toFixed(2)} per session
          </p>
        </div>

        {/* Card 2: Total API Calls */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total API Calls</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {metrics.success_rate}% success
              </span>
            </div>
            <div className="mt-2 text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
              {metrics.total_api_calls.toLocaleString()}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">
            {metrics.total_events} total telemetry events
          </p>
        </div>

        {/* Card 3: Total Login Times / Sessions */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Login Sessions</span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">Active user</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
              {metrics.total_sessions}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">
            Total active time: {Math.round(metrics.total_duration_seconds / 60)} mins
          </p>
        </div>

        {/* Card 4: Bandwidth / Data Transferred */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Data Transferred</span>
              <span className="text-[10px] font-mono text-purple-400 font-bold">Network</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
              {(metrics.total_bytes_transferred / (1024 * 1024)).toFixed(2)}
              <span className="text-sm font-normal text-slate-400 ml-1">MB</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">
            {metrics.total_exports} report exports generated
          </p>
        </div>
      </div>

      {/* ─── API Cost Trend & Resource Breakdown Grid ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Over Time Area Chart */}
        <div
          className="lg:col-span-2 p-5 rounded-2xl border flex flex-col justify-between"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white">API Cost & Usage Trend ($ USD)</h4>
              <p className="text-[11px] text-slate-400">Daily cost accumulation based on pipeline executions</p>
            </div>
            <span className="text-xs font-mono text-indigo-400 font-semibold px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
              {cost_timeline.length} Days Window
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cost_timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-secondary)", borderRadius: 8, fontSize: 11, color: "var(--text-primary)" }}
                  formatter={(val: any) => [`$${Number(val || 0).toFixed(2)}`, "Cost USD"]}
                />
                <Area type="monotone" dataKey="cost_usd" stroke="#818cf8" strokeWidth={2} fill="url(#costGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline / Endpoint Cost Ranking */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
        >
          <div className="mb-3">
            <h4 className="text-sm font-bold text-white">Cost by Pipeline Resource</h4>
            <p className="text-[11px] text-slate-400">Endpoints generating the highest API cost</p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
            {resource_breakdown.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No resource telemetry recorded</p>
            ) : (
              resource_breakdown.map((res, i) => {
                const maxCost = resource_breakdown[0]?.cost_usd || 1;
                const pct = Math.min(100, (res.cost_usd / maxCost) * 100);

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 truncate max-w-[180px]" title={res.resource}>
                        {res.resource}
                      </span>
                      <span className="text-indigo-300 font-bold">${res.cost_usd.toFixed(2)}</span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{res.calls} calls</span>
                      <span>{(res.bytes_transferred / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── Total Login Times & Session History Details ───────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
      >
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "var(--border-primary)" }}>
          <div>
            <h4 className="text-sm font-bold text-white">Total Login Times & Session Details</h4>
            <p className="text-[11px] text-slate-400">Complete audit trail of user logins, session durations, and client IPs</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total {session_history.length} Sessions Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
              >
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Login Time</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3">Session Duration</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Telemetry</th>
                <th className="px-4 py-3">Session ID</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-300 font-mono text-[11px]" style={{ borderColor: "var(--border-primary)" }}>
              {session_history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No session logs found for this user
                  </td>
                </tr>
              ) : (
                session_history.map((s, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === "Active"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.status === "Active" ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                      {new Date(s.login_time).toLocaleTimeString()}
                      <span className="block text-[10px] text-slate-500">
                        {new Date(s.login_time).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                      {new Date(s.last_activity).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-200">
                      {s.duration_seconds < 60
                        ? `${s.duration_seconds}s`
                        : `${Math.floor(s.duration_seconds / 60)}m ${s.duration_seconds % 60}s`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-cyan-400">{s.ip_address}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                      <span className="text-indigo-400 font-bold">{s.api_calls}</span> API ·{" "}
                      <span className="text-slate-300">{s.pages_viewed}</span> Views
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 truncate max-w-[140px]" title={s.session_id}>
                      {s.session_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Recent Audit Event Logs ──────────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-primary)" }}>
          <h4 className="text-sm font-bold text-white">Recent Activity Stream for {profile.name}</h4>
          <span className="text-xs font-mono text-slate-400">{recent_logs.length} Recent Events</span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b text-[10px] font-semibold uppercase tracking-wider text-slate-400 sticky top-0"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
              >
                <th className="px-4 py-2.5">Event</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Resource Target</th>
                <th className="px-4 py-2.5">Status Code</th>
                <th className="px-4 py-2.5">Bytes</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-300 font-mono text-[11px]" style={{ borderColor: "var(--border-primary)" }}>
              {recent_logs.map((log, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.event_type === "API_CALL"
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                        : log.event_type === "EXPORT"
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        : log.event_type === "LOGIN"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                    }`}>
                      {log.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-200">
                    {log.resource}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={log.status_code >= 400 ? "text-red-400 font-bold" : "text-emerald-400"}>
                      {log.status_code}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-400">
                    {log.bytes_transferred ? `${(log.bytes_transferred / 1024).toFixed(1)} KB` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
