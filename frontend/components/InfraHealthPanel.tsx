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
  ReferenceLine,
} from "recharts";
import { useAppContext } from "@/context/AppContext";
import { api, type InfraMetrics } from "@/lib/api";
import GrafanaGauge from "./GrafanaGauge";
import GrafanaSparkTile from "./GrafanaSparkTile";
import TopNodesBarChart from "./TopNodesBarChart";

export default function InfraHealthPanel() {
  const { currentApp, getTimeFrom } = useAppContext();
  const [data, setData] = useState<InfraMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHost, setSelectedHost] = useState<string>("all");

  // Collapsible drawers state
  const [showBasicCharts, setShowBasicCharts] = useState(true);
  const [showPressure, setShowPressure] = useState(true);
  const [showTopNodes, setShowTopNodes] = useState(true);
  const [showClusterDetails, setShowClusterDetails] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await api.getInfraMetrics(currentApp, getTimeFrom(), selectedHost);
        if (!cancelled) setData(result);
      } catch (err) {
        console.error("Failed to fetch infra metrics:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentApp, getTimeFrom, selectedHost]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          <div className="h-64 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    available_hosts = [],
    quick_gauges = {
      cpu_busy_percent: data.summary?.avg_cpu || 0,
      sys_load_1m: 1.85,
      sys_load_5m: 1.62,
      sys_load_15m: 1.45,
      ram_used_percent: data.summary?.avg_memory || 0,
      swap_used_percent: 1.2,
      rootfs_used_percent: 42.5,
      disk_read_mibs: 26.5,
      disk_write_mibs: 61.8,
      net_in_mbps: 23.8,
      net_out_mbps: 35.6,
    },
    system_specs = {
      cpu_cores: selectedHost !== "all" ? 4 : 8,
      uptime_days: 18.4,
      rootfs_total_gb: 120.0,
      ram_total_gb: 32.0,
      swap_total_gb: 8.0,
    },
    pressure_stats = {
      disk_io_pressure: 7.98,
      cpu_pressure: 19.84,
      memory_pressure: 1.69,
      sys_load_1m: 2.91,
    },
    cpu_breakdown = [],
    memory_breakdown = [],
    network_traffic = [],
    disk_partitions = [],
    pressure_history = [],
    top_nodes_cpu = [],
    top_nodes_ram = [],
    nodes = [],
    services = [],
  } = data;

  // Latest point from cpu breakdown for legend readout
  const latestCpu = cpu_breakdown[cpu_breakdown.length - 1] || {
    user: 35,
    system: 15,
    iowait: 2,
    irq: 0.5,
    idle: 47.5,
  };

  const latestMem = memory_breakdown[memory_breakdown.length - 1] || {
    ram_total: 32,
    ram_used: 16.4,
    ram_cache_buffer: 8.2,
    ram_free: 7.4,
    swap_used: 0.8,
  };

  const latestNet = network_traffic[network_traffic.length - 1] || {
    rx_kbps: 1450,
    tx_kbps: -880,
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Control Toolbar (Grafana Variable Bar) ───────────────── */}
      <div
        className="p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Datasource Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-slate-800 text-[11px] font-mono">
            <span className="text-orange-400">🔥</span>
            <span className="text-slate-400">datasource:</span>
            <span className="text-slate-200 font-semibold">Prometheus</span>
          </div>

          {/* Job Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">job:</span>
            <span className="text-slate-200 font-semibold">node</span>
          </div>

          {/* Host Selector Dropdown */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-black/50 border border-indigo-500/40 text-xs">
            <label htmlFor="host-select" className="text-indigo-300 font-medium font-mono text-[11px]">
              Host:
            </label>
            <select
              id="host-select"
              value={selectedHost}
              onChange={(e) => setSelectedHost(e.target.value)}
              className="bg-transparent text-slate-100 text-xs font-mono font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-100">
                All Hosts (Cluster Aggregated)
              </option>
              {available_hosts.map((h) => (
                <option key={h} value={h} className="bg-slate-900 text-slate-100">
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Port Pill */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span>port:</span>
            <span className="text-slate-300 font-semibold">9100</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Scraping 15s</span>
        </div>
      </div>

      {/* ─── SECTION 1: Quick CPU / Mem / Disk (Gauges & Specs) ───────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Quick CPU / Mem / Disk</span>
          </h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {/* Gauge 1: CPU Busy */}
          <GrafanaGauge
            title="CPU Busy"
            value={quick_gauges.cpu_busy_percent}
            unit="%"
            thresholds={{ warn: 65, danger: 85 }}
            info="Percentage of CPU capacity currently utilized"
          />

          {/* Gauge 2: Sys Load (5m avg) */}
          <GrafanaGauge
            title="Sys Load (5m avg)"
            value={quick_gauges.sys_load_5m}
            unit=""
            min={0}
            max={8}
            thresholds={{ warn: 4, danger: 6.5 }}
            info="5-minute system load average"
          />

          {/* Gauge 3: Sys Load (15m avg) */}
          <GrafanaGauge
            title="Sys Load (15m avg)"
            value={quick_gauges.sys_load_15m}
            unit=""
            min={0}
            max={8}
            thresholds={{ warn: 4, danger: 6.5 }}
            info="15-minute system load average"
          />

          {/* Gauge 4: RAM Used */}
          <GrafanaGauge
            title="RAM Used"
            value={quick_gauges.ram_used_percent}
            unit="%"
            thresholds={{ warn: 70, danger: 88 }}
            info="Physical RAM consumption percentage"
          />

          {/* Gauge 5: SWAP Used */}
          <GrafanaGauge
            title="SWAP Used"
            value={quick_gauges.swap_used_percent}
            unit="%"
            thresholds={{ warn: 20, danger: 50 }}
            info="Swap memory usage percentage"
          />

          {/* Gauge 6: Root FS Used */}
          <GrafanaGauge
            title="Root FS Used"
            value={quick_gauges.rootfs_used_percent}
            unit="%"
            thresholds={{ warn: 75, danger: 90 }}
            info="Root filesystem partition utilization"
          />

          {/* Right Specs Card */}
          <div
            className="col-span-2 md:col-span-3 lg:col-span-6 xl:col-span-1 p-3.5 rounded-xl border flex flex-col justify-between"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-primary)",
            }}
          >
            <p className="text-[11px] font-medium text-slate-400 mb-2">Hardware Specs</p>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">CPU Cores</span>
                <span className="font-bold text-slate-200">{system_specs.cpu_cores}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">Uptime</span>
                <span className="font-bold text-emerald-400">{system_specs.uptime_days}d</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">RootFS</span>
                <span className="font-bold text-slate-200">{system_specs.rootfs_total_gb} GiB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">RAM Total</span>
                <span className="font-bold text-indigo-400">{system_specs.ram_total_gb} GiB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">SWAP Total</span>
                <span className="font-bold text-slate-300">{system_specs.swap_total_gb} GiB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: Basic CPU / Mem / Net / Disk (4-Quadrant Graphs) ─ */}
      <div className="space-y-3">
        <button
          onClick={() => setShowBasicCharts(!showBasicCharts)}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-[10px] transform transition-transform" style={{ transform: showBasicCharts ? "rotate(0)" : "rotate(-90deg)" }}>
            ▼
          </span>
          <span>Basic CPU / Mem / Net / Disk</span>
        </button>

        <AnimatePresence>
          {showBasicCharts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              {/* ─── Graph 1: CPU Basic ────────────────────────────────────── */}
              <div
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-semibold text-slate-200">CPU Basic</h5>
                  <span className="text-[10px] font-mono text-slate-400">Total Utilization %</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cpu_breakdown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cpuUser" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="cpuSys" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="cpuWait" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="cpuIdle" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                      <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-muted)" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-secondary)", borderRadius: 8, fontSize: 11, color: "var(--text-primary)" }} />
                      <Area type="monotone" dataKey="user" stackId="1" stroke="#6366f1" fill="url(#cpuUser)" name="Busy User" />
                      <Area type="monotone" dataKey="system" stackId="1" stroke="#f97316" fill="url(#cpuSys)" name="Busy System" />
                      <Area type="monotone" dataKey="iowait" stackId="1" stroke="#ec4899" fill="url(#cpuWait)" name="Busy IOWait" />
                      <Area type="monotone" dataKey="idle" stackId="1" stroke="#10b981" fill="url(#cpuIdle)" name="Idle" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Readouts */}
                <div className="mt-3 pt-2 border-t flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400" style={{ borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>User: <strong className="text-slate-200">{latestCpu.user}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>System: <strong className="text-slate-200">{latestCpu.system}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    <span>IOWait: <strong className="text-slate-200">{latestCpu.iowait}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Idle: <strong className="text-slate-200">{latestCpu.idle}%</strong></span>
                  </div>
                </div>
              </div>

              {/* ─── Graph 2: Memory Basic ─────────────────────────────────── */}
              <div
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-semibold text-slate-200">Memory Basic</h5>
                  <span className="text-[10px] font-mono text-slate-400">Total 32 GiB</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={memory_breakdown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="memUsed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="memCache" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="memSwap" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                      <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-muted)" domain={[0, 32]} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-secondary)", borderRadius: 8, fontSize: 11, color: "var(--text-primary)" }} />
                      <Area type="monotone" dataKey="ram_used" stackId="mem" stroke="#3b82f6" fill="url(#memUsed)" name="RAM Used" />
                      <Area type="monotone" dataKey="ram_cache_buffer" stackId="mem" stroke="#10b981" fill="url(#memCache)" name="Cache + Buffer" />
                      <Area type="monotone" dataKey="swap_used" stroke="#a855f7" fill="url(#memSwap)" name="SWAP Used" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Readouts */}
                <div className="mt-3 pt-2 border-t flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400" style={{ borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Used: <strong className="text-slate-200">{latestMem.ram_used} GiB</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Cache: <strong className="text-slate-200">{latestMem.ram_cache_buffer} GiB</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>SWAP: <strong className="text-slate-200">{latestMem.swap_used} GiB</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Free: <strong className="text-slate-200">{latestMem.ram_free} GiB</strong></span>
                  </div>
                </div>
              </div>

              {/* ─── Graph 3: Network Traffic Basic (Mirrored Rx/Tx) ───────── */}
              <div
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-semibold text-slate-200">Network Traffic Basic</h5>
                  <span className="text-[10px] font-mono text-slate-400">eth0 In (+) / Out (-)</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={network_traffic} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="netIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="netOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                      <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickFormatter={(val) => `${Math.abs(val)}`} />
                      <ReferenceLine y={0} stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-secondary)", borderRadius: 8, fontSize: 11, color: "var(--text-primary)" }} />
                      <Area type="monotone" dataKey="rx_kbps" stroke="#22c55e" fill="url(#netIn)" name="Receive (Inbound)" />
                      <Area type="monotone" dataKey="tx_kbps" stroke="#f59e0b" fill="url(#netOut)" name="Transmit (Outbound)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Readouts */}
                <div className="mt-3 pt-2 border-t flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400" style={{ borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Inbound (Rx): <strong className="text-slate-200">{latestNet.rx_kbps} KB/s</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Outbound (Tx): <strong className="text-slate-200">{Math.abs(latestNet.tx_kbps)} KB/s</strong></span>
                  </div>
                </div>
              </div>

              {/* ─── Graph 4: Disk Space Used Basic ────────────────────────── */}
              <div
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-semibold text-slate-200">Disk Space Used Basic</h5>
                  <span className="text-[10px] font-mono text-slate-400">Partitions %</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={disk_partitions} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="diskRoot" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                      <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-muted)" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-secondary)", borderRadius: 8, fontSize: 11, color: "var(--text-primary)" }} />
                      <Area type="monotone" dataKey="root" stroke="#06b6d4" fill="url(#diskRoot)" name="Root (/)" />
                      <Area type="monotone" dataKey="data" stroke="#8b5cf6" fill="transparent" strokeWidth={2} name="Data (/data)" />
                      <Area type="monotone" dataKey="boot" stroke="#10b981" fill="transparent" strokeWidth={1.5} name="Boot (/boot)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Readouts */}
                <div className="mt-3 pt-2 border-t flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400" style={{ borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>Root (/): <strong className="text-slate-200">{quick_gauges.rootfs_used_percent}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>/data: <strong className="text-slate-200">38.4%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>/boot: <strong className="text-slate-200">18.5%</strong></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── SECTION 3: System Load & Pressure Sparklines ─────────────── */}
      <div className="space-y-3">
        <button
          onClick={() => setShowPressure(!showPressure)}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-[10px] transform transition-transform" style={{ transform: showPressure ? "rotate(0)" : "rotate(-90deg)" }}>
            ▼
          </span>
          <span>System Load & Pressure Metrics</span>
        </button>

        <AnimatePresence>
          {showPressure && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <GrafanaSparkTile
                title="Avg Disk I/O Pressure"
                subtitle="10 sec, some"
                value={pressure_stats.disk_io_pressure}
                unit="%"
                color="#06b6d4"
                data={pressure_history.map((p) => ({ value: p.disk_pressure }))}
              />
              <GrafanaSparkTile
                title="Avg CPU Pressure"
                subtitle="10 sec, full"
                value={pressure_stats.cpu_pressure}
                unit="%"
                color="#6366f1"
                data={pressure_history.map((p) => ({ value: p.cpu_pressure }))}
              />
              <GrafanaSparkTile
                title="Avg Memory Pressure"
                subtitle="10 sec, some"
                value={pressure_stats.memory_pressure}
                unit="%"
                color="#f59e0b"
                data={pressure_history.map((p) => ({ value: p.mem_pressure }))}
              />
              <GrafanaSparkTile
                title="Avg System Load"
                subtitle="1 min avg"
                value={pressure_stats.sys_load_1m}
                unit="load"
                color="#22c55e"
                data={pressure_history.map((p) => ({ value: p.sys_load }))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── SECTION 4: Top Nodes by CPU & RAM (Horizontal Bars) ──────── */}
      <div className="space-y-3">
        <button
          onClick={() => setShowTopNodes(!showTopNodes)}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-[10px] transform transition-transform" style={{ transform: showTopNodes ? "rotate(0)" : "rotate(-90deg)" }}>
            ▼
          </span>
          <span>Top Nodes Ranking</span>
        </button>

        <AnimatePresence>
          {showTopNodes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              <TopNodesBarChart title="Top Nodes by CPU" items={top_nodes_cpu} unit="%" max={100} />
              <TopNodesBarChart title="Top Nodes by Used RAM" items={top_nodes_ram} unit="%" max={100} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── SECTION 5: Cluster Node Grid & Microservices Map ─────────── */}
      <div className="space-y-3">
        <button
          onClick={() => setShowClusterDetails(!showClusterDetails)}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-[10px] transform transition-transform" style={{ transform: showClusterDetails ? "rotate(0)" : "rotate(-90deg)" }}>
            {showClusterDetails ? "▼" : "▶"}
          </span>
          <span>Cluster Node Grid & Microservices Map ({nodes.length} Nodes · {services.length} Services)</span>
        </button>

        <AnimatePresence>
          {showClusterDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 pt-1"
            >
              {/* Node Status Grid */}
              <div
                className="p-4 rounded-xl border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-semibold text-slate-200">Host Status Grid</h5>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Healthy
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Degraded
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400" /> Down
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {nodes.map((node) => {
                    const statusColor =
                      node.status === "healthy"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : node.status === "degraded"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                        : "border-red-500/40 bg-red-500/10 text-red-400";

                    return (
                      <button
                        key={node.host}
                        onClick={() => setSelectedHost(node.host)}
                        className={`p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] cursor-pointer ${statusColor}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-mono font-bold truncate">{node.host}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                          <span>CPU: {node.cpu_percent}%</span>
                          <span>RAM: {node.memory_percent}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Service Map Table */}
              <div
                className="rounded-xl border overflow-hidden"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
              >
                <div className="p-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
                  <h5 className="text-xs font-semibold text-slate-200">Microservice Health & Uptime</h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-[10px] uppercase font-semibold text-slate-400" style={{ borderColor: "var(--border-primary)" }}>
                        <th className="px-4 py-2">Service</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Uptime</th>
                        <th className="px-4 py-2">Total Events</th>
                        <th className="px-4 py-2">Errors</th>
                        <th className="px-4 py-2">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-300 font-mono text-[11px]" style={{ borderColor: "var(--border-primary)" }}>
                      {services.map((svc) => (
                        <tr key={svc.service} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5 font-bold text-slate-200">{svc.service}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              svc.status === "healthy" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                            }`}>
                              {svc.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-bold">{svc.uptime_percent}%</td>
                          <td className="px-4 py-2.5">{svc.total_events}</td>
                          <td className="px-4 py-2.5 text-red-400">{svc.error_count}</td>
                          <td className="px-4 py-2.5 text-slate-500">{new Date(svc.last_seen).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

