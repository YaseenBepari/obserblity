import type { AppName } from "@/context/AppContext";

// ─── Configuration ───────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InfraLogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  host: string;
  service: string;
  cpu_percent: number;
  memory_percent: number;
  disk_used_gb: number;
  event: string;
  pod: string;
  status: "healthy" | "degraded" | "down";
}

export interface UserLogEntry {
  timestamp: string;
  email: string;
  event_type: "LOGIN" | "LOGOUT" | "PAGE_VIEW" | "API_CALL" | "EXPORT";
  session_id: string;
  ip_address: string;
  duration_seconds: number;
  resource: string;
  status_code: number;
  bytes_transferred: number;
}

export interface NodeStatus {
  host: string;
  status: "healthy" | "degraded" | "down";
  cpu_percent: number;
  memory_percent: number;
  disk_used_gb: number;
  last_seen: string;
}

export interface ServiceInfo {
  service: string;
  uptime_percent: number;
  last_seen: string;
  total_events: number;
  error_count: number;
  status: string;
}

export interface InfraSummary {
  total_nodes: number;
  healthy: number;
  degraded: number;
  down: number;
  avg_cpu: number;
  avg_memory: number;
  avg_disk: number;
  total_events: number;
  error_count: number;
  warning_count: number;
}

export interface HistoryPoint {
  time: string;
  value: number;
}

export interface QuickGauges {
  cpu_busy_percent: number;
  sys_load_1m: number;
  sys_load_5m: number;
  sys_load_15m: number;
  ram_used_percent: number;
  swap_used_percent: number;
  rootfs_used_percent: number;
  disk_read_mibs: number;
  disk_write_mibs: number;
  net_in_mbps: number;
  net_out_mbps: number;
}

export interface SystemSpecs {
  cpu_cores: number;
  uptime_days: number;
  rootfs_total_gb: number;
  ram_total_gb: number;
  swap_total_gb: number;
}

export interface PressureStats {
  disk_io_pressure: number;
  cpu_pressure: number;
  memory_pressure: number;
  sys_load_1m: number;
}

export interface CpuBreakdownPoint {
  time: string;
  user: number;
  system: number;
  iowait: number;
  irq: number;
  idle: number;
}

export interface MemoryBreakdownPoint {
  time: string;
  ram_total: number;
  ram_used: number;
  ram_cache_buffer: number;
  ram_free: number;
  swap_used: number;
}

export interface NetworkTrafficPoint {
  time: string;
  rx_kbps: number;
  tx_kbps: number;
}

export interface DiskPartitionPoint {
  time: string;
  root: number;
  boot: number;
  data: number;
}

export interface PressureHistoryPoint {
  time: string;
  cpu_pressure: number;
  mem_pressure: number;
  disk_pressure: number;
  sys_load: number;
}

export interface TopNodeItem {
  host: string;
  value: number;
}

export interface InfraMetrics {
  selected_host?: string;
  available_hosts?: string[];
  quick_gauges?: QuickGauges;
  system_specs?: SystemSpecs;
  pressure_stats?: PressureStats;
  cpu_breakdown?: CpuBreakdownPoint[];
  memory_breakdown?: MemoryBreakdownPoint[];
  network_traffic?: NetworkTrafficPoint[];
  disk_partitions?: DiskPartitionPoint[];
  pressure_history?: PressureHistoryPoint[];
  top_nodes_cpu?: TopNodeItem[];
  top_nodes_ram?: TopNodeItem[];
  nodes: NodeStatus[];
  services: ServiceInfo[];
  summary: InfraSummary;
  cpu_history: HistoryPoint[];
  memory_history: HistoryPoint[];
}

export interface UserSummary {
  email: string;
  name?: string;
  role?: string;
  department?: string;
  avatar?: string;
  joined_date?: string;
  approval_status?: "approved" | "pending" | "rejected";
  approval_updated_at?: string;
  sessions_today: number;
  total_duration_seconds: number;
  last_seen: string;
  top_resource: string;
  total_events: number;
  api_calls?: number;
  bytes_transferred?: number;
  estimated_cost_usd?: number;
}

export interface UserProfile {
  name: string;
  role: string;
  department: string;
  avatar: string;
  joined_date: string;
}

export interface UserMetrics {
  total_cost_usd: number;
  total_api_calls: number;
  total_page_views: number;
  total_exports: number;
  total_events: number;
  total_sessions: number;
  total_duration_seconds: number;
  total_bytes_transferred: number;
  success_rate: number;
}

export interface UserCostTimelinePoint {
  date: string;
  cost_usd: number;
  api_calls: number;
  bytes_kb: number;
}

export interface ResourceCostItem {
  resource: string;
  calls: number;
  cost_usd: number;
  bytes_transferred: number;
  errors: number;
}

export interface SessionHistoryItem {
  session_id: string;
  login_time: string;
  last_activity: string;
  duration_seconds: number;
  ip_address: string;
  pages_viewed: number;
  api_calls: number;
  status: "Active" | "Completed";
}

export interface UserDetailAnalytics {
  email: string;
  profile: UserProfile;
  approval_status: "approved" | "pending" | "rejected";
  approval_updated_at?: string;
  approval_updated_by?: string;
  metrics: UserMetrics;
  cost_timeline: UserCostTimelinePoint[];
  resource_breakdown: ResourceCostItem[];
  status_distribution: { code: string; count: number }[];
  session_history: SessionHistoryItem[];
  recent_logs: UserLogEntry[];
}

export interface HeatmapPoint {
  day: number;
  hour: number;
  count: number;
}

export interface EventBreakdown {
  event_type: string;
  count: number;
}

export interface UserActivity {
  active_sessions: number;
  users: UserSummary[];
  login_heatmap: HeatmapPoint[];
  event_breakdown: EventBreakdown[];
  total_events: number;
  total_api_cost_usd?: number;
  approved_count?: number;
  pending_count?: number;
  rejected_count?: number;
}

export interface ActiveUsers {
  count: number;
  sessions: {
    session_id: string;
    email: string;
    login_time: string;
    ip_address: string;
    last_activity: string;
    pages_viewed: number;
    api_calls: number;
  }[];
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: "critical" | "error" | "warning";
  level: string;
  host: string;
  service: string;
  message: string;
  pod: string;
  status: string;
  cpu_percent: number | null;
  memory_percent: number | null;
}

export interface AlertsResponse {
  total: number;
  severity_counts: {
    critical: number;
    error: number;
    warning: number;
  };
  alerts: AlertItem[];
}

export interface PaginatedLogs<T> {
  total: number;
  offset: number;
  limit: number;
  entries: T[];
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ─── SWR Fetcher ─────────────────────────────────────────────────────────────

export const swrFetcher = (url: string) => apiFetch(url);

// ─── API Functions ───────────────────────────────────────────────────────────

export const api = {
  // Infrastructure
  getInfraMetrics: (app: AppName, timeFrom?: string, host?: string) => {
    const params = new URLSearchParams();
    if (timeFrom) params.set("from", timeFrom);
    if (host && host !== "all") params.set("host", host);
    const qs = params.toString();
    return apiFetch<InfraMetrics>(`/api/${app}/infra/metrics${qs ? `?${qs}` : ""}`);
  },

  getInfraLogs: (
    app: AppName,
    opts: {
      level?: string;
      search?: string;
      timeFrom?: string;
      offset?: number;
      limit?: number;
    } = {}
  ) => {
    const params = new URLSearchParams();
    if (opts.level) params.set("level", opts.level);
    if (opts.search) params.set("search", opts.search);
    if (opts.timeFrom) params.set("from", opts.timeFrom);
    if (opts.offset) params.set("offset", String(opts.offset));
    if (opts.limit) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return apiFetch<PaginatedLogs<InfraLogEntry>>(
      `/api/${app}/infra/logs${qs ? `?${qs}` : ""}`
    );
  },

  // Users
  getActiveUsers: (app: AppName) =>
    apiFetch<ActiveUsers>(`/api/${app}/users/active`),

  getUserActivity: (app: AppName, timeFrom?: string) => {
    const params = timeFrom ? `?from=${encodeURIComponent(timeFrom)}` : "";
    return apiFetch<UserActivity>(`/api/${app}/users/activity${params}`);
  },

  getUserLogs: (
    app: AppName,
    opts: {
      email?: string;
      eventType?: string;
      search?: string;
      timeFrom?: string;
      offset?: number;
      limit?: number;
    } = {}
  ) => {
    const params = new URLSearchParams();
    if (opts.email) params.set("email", opts.email);
    if (opts.eventType) params.set("event_type", opts.eventType);
    if (opts.search) params.set("search", opts.search);
    if (opts.timeFrom) params.set("from", opts.timeFrom);
    if (opts.offset) params.set("offset", String(opts.offset));
    if (opts.limit) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return apiFetch<PaginatedLogs<UserLogEntry>>(
      `/api/${app}/users/logs${qs ? `?${qs}` : ""}`
    );
  },

  // Alerts
  getAlerts: (app: AppName, limit?: number) => {
    const params = limit ? `?limit=${limit}` : "";
    return apiFetch<AlertsResponse>(`/api/${app}/alerts${params}`);
  },

  // User Detail & Approvals
  getUserDetail: (app: AppName, email: string) =>
    apiFetch<UserDetailAnalytics>(`/api/${app}/users/detail/${encodeURIComponent(email)}`),

  updateUserApproval: (app: AppName, email: string, status: "approved" | "pending" | "rejected") =>
    apiFetch<{ status: string; approval: { status: string; updated_at: string; updated_by: string } }>(
      `/api/${app}/users/approvals`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status }),
      }
    ),

  getUserApprovals: (app: AppName) =>
    apiFetch<Record<string, { status: "approved" | "pending" | "rejected"; updated_at: string; updated_by: string }>>(
      `/api/${app}/users/approvals`
    ),

  // Health
  getHealth: () => apiFetch<{ status: string }>("/api/health"),
};

// ─── WebSocket ───────────────────────────────────────────────────────────────

export function createLogWebSocket(
  app: AppName,
  onMessage: (data: InfraLogEntry | UserLogEntry) => void,
  onError?: (error: Event) => void
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/${app}/logs`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      // ignore parse errors
    }
  };

  ws.onerror = (error) => {
    onError?.(error);
  };

  return ws;
}
