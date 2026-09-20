"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type InfraMetrics } from "@/lib/api";
import { type AppName } from "@/context/AppContext";
import { motion } from "framer-motion";

interface AppHealth {
  name: AppName;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  metrics: InfraMetrics | null;
  loading: boolean;
}

const APPS_CONFIG = [
  { name: "netra" as AppName, label: "Netra", icon: "N", color: "#6366f1", subtitle: "Data Analytics & Pipeline Platform" },
  { name: "kavacha" as AppName, label: "Kavacha", icon: "K", color: "#06b6d4", subtitle: "Security & Compliance Engine" },
  { name: "blackline" as AppName, label: "Blackline", icon: "B", color: "#8b5cf6", subtitle: "Financial Reconciliation Suite" },
];

export default function PlatformOverview() {
  const router = useRouter();
  const [apps, setApps] = useState<AppHealth[]>(
    APPS_CONFIG.map((a) => ({ ...a, metrics: null, loading: true }))
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    let isMounted = true;
    
    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          APPS_CONFIG.map((app) => 
            api.getInfraMetrics(app.name).catch(() => null)
          )
        );

        if (isMounted) {
          setApps(APPS_CONFIG.map((app, i) => ({
            ...app,
            metrics: results[i],
            loading: false
          })));
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Failed to fetch platform metrics", err);
      }
    };

    fetchAll();
    
    const interval = setInterval(fetchAll, 10000); // 10s auto-refresh
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalCritical = apps.reduce((acc, app) => acc + (app.metrics?.summary?.down || 0), 0);
  const totalWarning = apps.reduce((acc, app) => acc + (app.metrics?.summary?.degraded || 0), 0);
  const totalStable = apps.reduce((acc, app) => acc + (app.metrics?.summary?.healthy || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16zm0 0l-2-2m18 2l2-2" />
              <path d="M14 8h-4v4h4V8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Platform Overview</h1>
            <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
              All Environments <span className="opacity-50">•</span> {APPS_CONFIG.length} Applications
            </p>
          </div>
        </div>
      </div>

      {/* Global Status Bar */}
      <div className="flex items-center gap-3 py-2">
        <div className="px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {totalCritical} Critical
        </div>
        <div className="px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {totalWarning} Warning
        </div>
        <div className="px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          {totalStable} Stable
        </div>
      </div>

      {/* Grid of App Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {apps.map((app, i) => {
          const isCritical = (app.metrics?.summary?.down || 0) > 0;
          const isWarning = (app.metrics?.summary?.degraded || 0) > 0;
          const statusText = isCritical ? "CRITICAL" : isWarning ? "WARNING" : "STABLE";
          const statusColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981";
          const statusBg = `${statusColor}15`;

          return (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="ov-card flex flex-col hover:border-[var(--glass-border-highlight)] transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/${app.name}`)}
            >
              <div 
                className="h-1 w-full rounded-t-xl" 
                style={{ background: `linear-gradient(90deg, ${app.color}, ${statusColor})` }}
              />
              
              <div className="p-5 flex-1 flex flex-col">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
                      style={{ background: app.color }}
                    >
                      {app.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[var(--text-primary)] leading-tight">{app.label}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[180px]">{app.subtitle}</p>
                    </div>
                  </div>
                  <div 
                    className="px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow-sm"
                    style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}40` }}
                  >
                    {statusText}
                  </div>
                </div>

                {/* Environment Info */}
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-5 px-1">
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                    Prod Cluster
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {app.label} Admin
                  </span>
                </div>

                {/* Metrics Grid (Like Vitals) */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg p-3 flex flex-col items-center justify-center text-center">
                    <svg className="mb-2 text-[#ef4444]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    <span className="text-xl font-bold text-[var(--text-primary)]">
                      {app.loading ? "-" : (app.metrics?.quick_gauges?.cpu_busy_percent || 0).toFixed(1)}<span className="text-sm font-normal">%</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-wider">CPU Load</span>
                  </div>
                  
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg p-3 flex flex-col items-center justify-center text-center">
                    <svg className="mb-2 text-[#3b82f6]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
                    <span className="text-xl font-bold text-[var(--text-primary)]">
                      {app.loading ? "-" : (app.metrics?.quick_gauges?.ram_used_percent || 0).toFixed(1)}<span className="text-sm font-normal">%</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-wider">Memory</span>
                  </div>

                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg p-3 flex flex-col items-center justify-center text-center">
                    <svg className="mb-2 text-[#f59e0b]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                    <span className="text-xl font-bold text-[var(--text-primary)]">
                      {app.loading ? "-" : (app.metrics?.summary?.total_nodes || 0)}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-wider">Nodes</span>
                  </div>
                </div>

                {/* Alert/Status Text & Footer */}
                <div className="mt-auto border-t border-[var(--border-primary)] pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {isCritical ? (
                      <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-red-500">Node failures detected</span></>
                    ) : isWarning ? (
                      <><span className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-orange-500">High resource usage</span></>
                    ) : (
                      <><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[var(--text-muted)]">All systems operational</span></>
                    )}
                  </div>
                  
                  <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] text-sm font-medium text-blue-500 transition-colors">
                    View
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="text-center text-xs text-[var(--text-muted)] pt-8 flex items-center justify-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}
