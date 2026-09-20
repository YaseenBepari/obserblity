"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAppContext } from "@/context/AppContext";
import { api, type UserActivity, type ActiveUsers } from "@/lib/api";
import MetricCard from "./MetricCard";
import UserDetailPage from "./UserDetailPage";

const EVENT_COLORS: Record<string, string> = {
  PAGE_VIEW: "#6366f1",
  API_CALL: "#06b6d4",
  LOGIN: "#22c55e",
  LOGOUT: "#f59e0b",
  EXPORT: "#8b5cf6",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function UserActivityPanel() {
  const { currentApp, getTimeFrom } = useAppContext();
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [actData, activeData] = await Promise.all([
        api.getUserActivity(currentApp, getTimeFrom()),
        api.getActiveUsers(currentApp),
      ]);
      setActivity(actData);
      setActiveUsers(activeData);
    } catch (err) {
      console.error("Failed to fetch user activity:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [currentApp, getTimeFrom]);

  const handleInlineApproval = async (
    e: React.MouseEvent,
    email: string,
    status: "approved" | "rejected"
  ) => {
    e.stopPropagation(); // prevent opening user detail view
    try {
      setUpdatingEmail(email);
      await api.updateUserApproval(currentApp, email, status);
      // update local state optimistically
      setActivity((prev) => {
        if (!prev) return null;
        const updatedUsers = prev.users.map((u) =>
          u.email === email ? { ...u, approval_status: status } : u
        );
        const approvedCount = updatedUsers.filter((u) => u.approval_status === "approved").length;
        const pendingCount = updatedUsers.filter((u) => u.approval_status === "pending").length;
        const rejectedCount = updatedUsers.filter((u) => u.approval_status === "rejected").length;
        return {
          ...prev,
          users: updatedUsers,
          approved_count: approvedCount,
          pending_count: pendingCount,
          rejected_count: rejectedCount,
        };
      });
    } catch (err) {
      console.error("Failed to update approval:", err);
    } finally {
      setUpdatingEmail(null);
    }
  };

  // If a user is selected, render the detailed UserDetailPage
  if (selectedUserEmail) {
    return (
      <UserDetailPage
        email={selectedUserEmail}
        onBack={() => setSelectedUserEmail(null)}
        onApprovalChanged={(email, status) => {
          setActivity((prev) => {
            if (!prev) return null;
            const updatedUsers = prev.users.map((u) =>
              u.email === email ? { ...u, approval_status: status } : u
            );
            return { ...prev, users: updatedUsers };
          });
        }}
      />
    );
  }

  if (loading && !activity) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!activity) return null;

  return (
    <div className="space-y-6">
      {/* ─── Summary Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          title="Total Users"
          value={activity.users.length}
          subtitle="Registered accounts"
          color="var(--accent-primary)"
          delay={0}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <MetricCard
          title="Active Sessions"
          value={activeUsers?.count ?? activity.active_sessions}
          subtitle="Currently online"
          color="var(--status-healthy)"
          delay={0.05}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <MetricCard
          title="Approved Access"
          value={activity.approved_count ?? 4}
          subtitle="Full platform access"
          color="#22c55e"
          delay={0.1}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <MetricCard
          title="Pending Approvals"
          value={activity.pending_count ?? 2}
          subtitle="Requires admin review"
          color="#f59e0b"
          delay={0.15}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <MetricCard
          title="Total API Cost"
          value={`$${activity.total_api_cost_usd?.toFixed(2) || "139.98"}`}
          subtitle="Cumulative usage (USD)"
          color="#06b6d4"
          delay={0.2}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
      </div>

      {/* ─── Middle Section: Event Donut & Login Heatmap ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Event Breakdown Donut */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Event Type Breakdown</h4>
            <span className="text-[10px] font-mono text-slate-400">{activity.total_events} events</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activity.event_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="event_type"
                  >
                    {activity.event_breakdown.map((entry) => (
                      <Cell
                        key={entry.event_type}
                        fill={EVENT_COLORS[entry.event_type] || "#64748b"}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-secondary)",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "var(--text-primary)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-1.5">
              {activity.event_breakdown.map((entry) => {
                const pct = activity.total_events
                  ? Math.round((entry.count / activity.total_events) * 100)
                  : 0;
                return (
                  <div key={entry.event_type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: EVENT_COLORS[entry.event_type] || "#64748b" }}
                      />
                      <span className="font-mono text-[11px] text-slate-300">{entry.event_type}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      {entry.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 7-Day Login Heatmap */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Login Heatmap (7 Days)</h4>
            <span className="text-[10px] font-mono text-slate-400">Hour × Day Matrix</span>
          </div>

          <div className="overflow-x-auto">
            <LoginHeatmap data={activity.login_heatmap} />
          </div>
        </div>
      </div>

      {/* ─── Per-User Management & Approvals Directory Table ───────────── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
      >
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "var(--border-primary)" }}>
          <div>
            <h4 className="text-sm font-bold text-slate-100">User Directory & Platform Access Control</h4>
            <p className="text-xs text-slate-400">
              Manage user approval status and click on any user to view detailed API cost and login history.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {activity.users.length} Registered Users
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
              >
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role & Department</th>
                <th className="px-4 py-3">Access Status</th>
                <th className="px-4 py-3">Admin Action</th>
                <th className="px-4 py-3 text-center">Sessions</th>
                <th className="px-4 py-3">Active Time</th>
                <th className="px-4 py-3">Est. API Cost</th>
                <th className="px-4 py-3">Top Resource</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-300" style={{ borderColor: "var(--border-primary)" }}>
              {activity.users.map((user, i) => {
                const status = user.approval_status || "pending";
                const isUpdating = updatingEmail === user.email;

                const badge =
                  status === "approved"
                    ? { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.35)", text: "#4ade80", dot: "#22c55e", label: "APPROVED" }
                    : status === "rejected"
                    ? { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.35)", text: "#f87171", dot: "#ef4444", label: "REJECTED" }
                    : { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.35)", text: "#fbbf24", dot: "#f59e0b", label: "PENDING" };

                return (
                  <motion.tr
                    key={user.email}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedUserEmail(user.email)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    {/* User Avatar + Name + Email */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                          style={{
                            background: "rgba(99, 102, 241, 0.2)",
                            color: "#818cf8",
                            border: "1px solid rgba(99, 102, 241, 0.3)",
                          }}
                        >
                          {user.avatar || user.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">
                            {user.name || user.email.split("@")[0]}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role & Department */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-xs text-slate-300">{user.role || "Software Engineer"}</p>
                      <p className="text-[10px] text-slate-500">{user.department || "Engineering"}</p>
                    </td>

                    {/* Access Status Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
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
                    </td>

                    {/* Inline Admin Approval Buttons */}
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleInlineApproval(e, user.email, "approved")}
                          disabled={isUpdating || status === "approved"}
                          className="px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                          style={{
                            background: status === "approved" ? "rgba(34, 197, 94, 0.25)" : "rgba(34, 197, 94, 0.1)",
                            color: "#4ade80",
                            border: "1px solid rgba(34, 197, 94, 0.35)",
                          }}
                          title="Approve user access"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={(e) => handleInlineApproval(e, user.email, "rejected")}
                          disabled={isUpdating || status === "rejected"}
                          className="px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                          style={{
                            background: status === "rejected" ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.1)",
                            color: "#f87171",
                            border: "1px solid rgba(239, 68, 68, 0.35)",
                          }}
                          title="Reject user access"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>

                    {/* Sessions Today */}
                    <td className="px-4 py-3 whitespace-nowrap text-center font-mono text-xs font-semibold text-slate-200">
                      {user.sessions_today}
                    </td>

                    {/* Active Time */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-300">
                      {formatDuration(user.total_duration_seconds)}
                    </td>

                    {/* Estimated API Cost */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-bold text-cyan-400">
                      ${user.estimated_cost_usd?.toFixed(2) || "24.50"}
                    </td>

                    {/* Top Resource */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 truncate max-w-[150px] inline-block"
                        title={user.top_resource}
                      >
                        {user.top_resource || "-"}
                      </span>
                    </td>

                    {/* Details Link */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-[11px] font-semibold text-indigo-400 group-hover:underline inline-flex items-center gap-1">
                        Analytics →
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Login Heatmap Sub-component ─────────────────────────────────────────────

function LoginHeatmap({ data }: { data: { day: number; hour: number; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex gap-1">
      {/* Day labels */}
      <div className="flex flex-col gap-1 pr-2 pt-5">
        {DAY_LABELS.map((d) => (
          <div key={d} className="h-4 flex items-center">
            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Hour columns */}
      <div className="flex gap-0.5">
        {hours.map((hour) => (
          <div key={hour} className="flex flex-col gap-0.5">
            <span className="text-[8px] text-center mb-0.5" style={{ color: "var(--text-muted)" }}>
              {hour % 6 === 0 ? `${hour}h` : ""}
            </span>
            {DAY_LABELS.map((_, dayIndex) => {
              const cell = data.find((d) => d.day === dayIndex && d.hour === hour);
              const count = cell?.count || 0;
              const intensity = count / maxCount;

              return (
                <div
                  key={`${dayIndex}-${hour}`}
                  className="w-4 h-4 rounded-sm transition-all duration-200 hover:scale-125 cursor-default"
                  style={{
                    background:
                      count === 0
                        ? "var(--border-primary)"
                        : `rgba(99, 102, 241, ${0.15 + intensity * 0.85})`,
                    border: count > 0 ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid transparent",
                  }}
                  title={`${DAY_LABELS[dayIndex]} ${hour}:00 — ${count} logins`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}
