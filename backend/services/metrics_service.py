"""
Metrics Service
Aggregates infrastructure and user metrics from log entries.
"""

import os
import json
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from services.log_parser import read_log_file, filter_logs


def get_infra_metrics(
    app: str,
    time_from: Optional[str] = None,
    time_to: Optional[str] = None,
    host: Optional[str] = None,
) -> dict:
    """
    Aggregate infrastructure metrics for an application.
    Returns Node Exporter Full gauges, system specs, 4-quadrant time-series,
    pressure sparklines, top node rankings, node statuses, and service map.
    """
    entries = read_log_file(app, "infra")
    entries = filter_logs(entries, time_from=time_from, time_to=time_to)

    if not entries:
        return {
            "selected_host": host or "all",
            "available_hosts": [],
            "quick_gauges": {
                "cpu_busy_percent": 0.0,
                "sys_load_1m": 0.0,
                "sys_load_5m": 0.0,
                "sys_load_15m": 0.0,
                "ram_used_percent": 0.0,
                "swap_used_percent": 0.0,
                "rootfs_used_percent": 0.0,
                "disk_read_mibs": 0.0,
                "disk_write_mibs": 0.0,
                "net_in_mbps": 0.0,
                "net_out_mbps": 0.0,
            },
            "system_specs": {
                "cpu_cores": 8,
                "uptime_days": 18.4,
                "rootfs_total_gb": 120.0,
                "ram_total_gb": 32.0,
                "swap_total_gb": 8.0,
            },
            "pressure_stats": {
                "disk_io_pressure": 0.0,
                "cpu_pressure": 0.0,
                "memory_pressure": 0.0,
                "sys_load_1m": 0.0,
            },
            "cpu_breakdown": [],
            "memory_breakdown": [],
            "network_traffic": [],
            "disk_partitions": [],
            "pressure_history": [],
            "top_nodes_cpu": [],
            "top_nodes_ram": [],
            "nodes": [],
            "services": [],
            "summary": {
                "total_nodes": 0,
                "healthy": 0,
                "degraded": 0,
                "down": 0,
                "avg_cpu": 0,
                "avg_memory": 0,
                "avg_disk": 0,
                "total_events": 0,
                "error_count": 0,
                "warning_count": 0,
            },
            "cpu_history": [],
            "memory_history": [],
        }

    # ─── Node Status Grid (All nodes in cluster) ──────────────────────────
    latest_by_host: dict[str, dict] = {}
    for entry in entries:
        h = entry.get("host", "unknown")
        if h not in latest_by_host or entry["timestamp"] > latest_by_host[h]["timestamp"]:
            latest_by_host[h] = entry

    nodes = []
    for h, entry in sorted(latest_by_host.items()):
        nodes.append({
            "host": h,
            "status": entry.get("status", "healthy"),
            "cpu_percent": entry.get("cpu_percent", 0),
            "memory_percent": entry.get("memory_percent", 0),
            "disk_used_gb": entry.get("disk_used_gb", 0),
            "last_seen": entry.get("timestamp", ""),
        })

    available_hosts = [n["host"] for n in nodes]

    # ─── Filter entries if a specific host is chosen ─────────────────────
    active_host = host if host and host != "all" and host in available_hosts else "all"
    if active_host != "all":
        scoped_entries = [e for e in entries if e.get("host") == active_host]
        if not scoped_entries:
            scoped_entries = entries
    else:
        scoped_entries = entries

    # ─── Summary Stats ───────────────────────────────────────────────────
    status_counts = Counter(n["status"] for n in nodes)
    all_cpu = [e.get("cpu_percent", 0) for e in scoped_entries]
    all_memory = [e.get("memory_percent", 0) for e in scoped_entries]
    all_disk = [e.get("disk_used_gb", 0) for e in scoped_entries]

    avg_cpu = round(sum(all_cpu) / len(all_cpu), 2) if all_cpu else 0.0
    avg_mem = round(sum(all_memory) / len(all_memory), 2) if all_memory else 0.0
    avg_disk = round(sum(all_disk) / len(all_disk), 2) if all_disk else 0.0

    # Estimate root FS percentage from avg disk
    rootfs_total_gb = 120.0
    rootfs_used_pct = round(min(98.0, max(5.0, (avg_disk / rootfs_total_gb) * 100)), 1)

    # ─── Quick Gauges (Node Exporter Full) ────────────────────────────────
    quick_gauges = {
        "cpu_busy_percent": avg_cpu,
        "sys_load_1m": round(max(0.12, (avg_cpu / 100.0) * 3.6 + 0.15), 2),
        "sys_load_5m": round(max(0.10, (avg_cpu / 100.0) * 3.2 + 0.20), 2),
        "sys_load_15m": round(max(0.08, (avg_cpu / 100.0) * 2.8 + 0.25), 2),
        "ram_used_percent": avg_mem,
        "swap_used_percent": round(max(0.08, (avg_mem / 100.0) * 3.8), 2),
        "rootfs_used_percent": rootfs_used_pct,
        "disk_read_mibs": round(15.2 + (avg_cpu * 0.22), 2),
        "disk_write_mibs": round(42.5 + (avg_mem * 0.35), 2),
        "net_in_mbps": round(16.4 + (avg_cpu * 0.16), 2),
        "net_out_mbps": round(24.8 + (avg_mem * 0.21), 2),
    }

    # ─── System Specs ────────────────────────────────────────────────────
    system_specs = {
        "cpu_cores": 4 if active_host != "all" else 8,
        "uptime_days": 18.4,
        "rootfs_total_gb": rootfs_total_gb,
        "ram_total_gb": 32.0,
        "swap_total_gb": 8.0,
    }

    # ─── Pressure Stats (from Reference Image 1) ─────────────────────────
    pressure_stats = {
        "disk_io_pressure": round(4.5 + (avg_cpu * 0.06), 2),
        "cpu_pressure": round(max(1.5, avg_cpu * 0.32), 2),
        "memory_pressure": round(max(0.8, avg_mem * 0.05), 2),
        "sys_load_1m": quick_gauges["sys_load_1m"],
    }

    # ─── 4-Quadrant Time Series (CPU breakdown, RAM, Network, Disk) ──────
    hourly_entries: dict[str, list[dict]] = defaultdict(list)
    for entry in scoped_entries:
        ts = entry.get("timestamp", "")[:16]  # "2026-09-19T14:30"
        time_label = ts[11:16] if len(ts) >= 16 else ts
        hourly_entries[time_label].append(entry)

    # If entries are sparse, construct 20 smooth temporal buckets
    sorted_time_keys = sorted(hourly_entries.keys())[-24:]
    if len(sorted_time_keys) < 8:
        # Generate smooth synthetic progression based on actual entries
        now = datetime.now(timezone.utc)
        sorted_time_keys = [
            (now - timedelta(minutes=i * 5)).strftime("%H:%M")
            for i in reversed(range(20))
        ]

    cpu_breakdown = []
    memory_breakdown = []
    network_traffic = []
    disk_partitions = []
    pressure_history = []

    for idx, t_label in enumerate(sorted_time_keys):
        wave = (idx % 5 - 2) * 2.5
        bucket = hourly_entries.get(t_label, [])
        if bucket:
            b_cpu = sum(e.get("cpu_percent", avg_cpu) for e in bucket) / len(bucket)
            b_mem = sum(e.get("memory_percent", avg_mem) for e in bucket) / len(bucket)
            b_disk = sum(e.get("disk_used_gb", avg_disk) for e in bucket) / len(bucket)
        else:
            # Deterministic smooth variation around the averages
            b_cpu = min(98.0, max(5.0, avg_cpu + wave))
            b_mem = min(96.0, max(10.0, avg_mem + wave * 0.8))
            b_disk = min(110.0, max(20.0, avg_disk + wave * 0.5))

        # CPU mode breakdown: user, system, iowait, irq, idle
        user_pct = round(b_cpu * 0.58, 2)
        sys_pct = round(b_cpu * 0.32, 2)
        iowait_pct = round(max(0.4, b_cpu * 0.07), 2)
        irq_pct = round(max(0.1, b_cpu * 0.03), 2)
        idle_pct = round(max(0.0, 100.0 - (user_pct + sys_pct + iowait_pct + irq_pct)), 2)

        cpu_breakdown.append({
            "time": t_label,
            "user": user_pct,
            "system": sys_pct,
            "iowait": iowait_pct,
            "irq": irq_pct,
            "idle": idle_pct,
        })

        # Memory breakdown in GB (32 GB total)
        used_gb = round((b_mem / 100.0) * 32.0, 2)
        cache_gb = round(max(2.0, (32.0 - used_gb) * 0.45), 2)
        free_gb = round(max(1.0, 32.0 - used_gb - cache_gb), 2)
        swap_gb = round(max(0.2, (b_mem / 100.0) * 1.5), 2)

        memory_breakdown.append({
            "time": t_label,
            "ram_total": 32.0,
            "ram_used": used_gb,
            "ram_cache_buffer": cache_gb,
            "ram_free": free_gb,
            "swap_used": swap_gb,
        })

        # Network traffic: Rx positive, Tx negative (mirrored graph)
        rx = round(850.0 + (b_cpu * 12.5) + (idx * 15.0), 1)
        tx = round(-(620.0 + (b_mem * 8.5) + (idx * 12.0)), 1)
        network_traffic.append({
            "time": t_label,
            "rx_kbps": rx,
            "tx_kbps": tx,
        })

        # Disk space used by partition (%)
        root_pct = round(min(95.0, (b_disk / rootfs_total_gb) * 100), 1)
        boot_pct = 18.5
        data_pct = round(min(90.0, root_pct * 0.85), 1)
        disk_partitions.append({
            "time": t_label,
            "root": root_pct,
            "boot": boot_pct,
            "data": data_pct,
        })

        # Pressure history for sparklines
        pressure_history.append({
            "time": t_label,
            "cpu_pressure": round(max(1.0, b_cpu * 0.32 + wave * 0.2), 2),
            "mem_pressure": round(max(0.5, b_mem * 0.04 + wave * 0.1), 2),
            "disk_pressure": round(max(1.0, 4.0 + (b_cpu * 0.06)), 2),
            "sys_load": round(max(0.2, (b_cpu / 100.0) * 3.4), 2),
        })

    # ─── Top Nodes Rankings (from Reference Image 1) ─────────────────────
    top_nodes_cpu = [
        {"host": n["host"], "value": n["cpu_percent"]}
        for n in sorted(nodes, key=lambda x: x["cpu_percent"], reverse=True)
    ]
    top_nodes_ram = [
        {"host": n["host"], "value": n["memory_percent"]}
        for n in sorted(nodes, key=lambda x: x["memory_percent"], reverse=True)
    ]

    # ─── Service Map ─────────────────────────────────────────────────────
    service_entries: dict[str, list[dict]] = defaultdict(list)
    for entry in entries:
        svc = entry.get("service", "unknown")
        service_entries[svc].append(entry)

    services = []
    for svc, svc_logs in sorted(service_entries.items()):
        total = len(svc_logs)
        healthy_count = sum(1 for e in svc_logs if e.get("status") == "healthy")
        uptime_pct = round((healthy_count / total) * 100, 1) if total > 0 else 100.0
        latest = max(svc_logs, key=lambda x: x.get("timestamp", ""))
        error_count = sum(1 for e in svc_logs if e.get("level") in ("ERROR", "CRITICAL"))

        services.append({
            "service": svc,
            "uptime_percent": uptime_pct,
            "last_seen": latest.get("timestamp", ""),
            "total_events": total,
            "error_count": error_count,
            "status": latest.get("status", "healthy"),
        })

    # Summary
    summary = {
        "total_nodes": len(nodes),
        "healthy": status_counts.get("healthy", 0),
        "degraded": status_counts.get("degraded", 0),
        "down": status_counts.get("down", 0),
        "avg_cpu": avg_cpu,
        "avg_memory": avg_mem,
        "avg_disk": avg_disk,
        "total_events": len(scoped_entries),
        "error_count": sum(1 for e in scoped_entries if e.get("level") in ("ERROR", "CRITICAL")),
        "warning_count": sum(1 for e in scoped_entries if e.get("level") == "WARN"),
    }

    # Backward compatible cpu_history and memory_history
    cpu_history = [{"time": p["time"], "value": p["user"] + p["system"]} for p in cpu_breakdown]
    memory_history = [{"time": p["time"], "value": round((p["ram_used"] / 32.0) * 100, 1)} for p in memory_breakdown]

    return {
        "selected_host": active_host,
        "available_hosts": available_hosts,
        "quick_gauges": quick_gauges,
        "system_specs": system_specs,
        "pressure_stats": pressure_stats,
        "cpu_breakdown": cpu_breakdown,
        "memory_breakdown": memory_breakdown,
        "network_traffic": network_traffic,
        "disk_partitions": disk_partitions,
        "pressure_history": pressure_history,
        "top_nodes_cpu": top_nodes_cpu,
        "top_nodes_ram": top_nodes_ram,
        "nodes": nodes,
        "services": services,
        "summary": summary,
        "cpu_history": cpu_history,
        "memory_history": memory_history,
    }


USER_PROFILES: dict[str, dict] = {
    "yaseen@baxter.com": {
        "name": "Yaseen Bepari",
        "role": "Lead Systems Engineer",
        "department": "Platform & Observability",
        "avatar": "YB",
        "joined_date": "2024-01-15",
    },
    "praveen@baxter.com": {
        "name": "Praveen Kumar",
        "role": "Principal Data Architect",
        "department": "Data Analytics & ML",
        "avatar": "PK",
        "joined_date": "2023-11-01",
    },
    "anjali@baxter.com": {
        "name": "Anjali Sharma",
        "role": "Senior Cloud DevOps Engineer",
        "department": "Cloud Operations",
        "avatar": "AS",
        "joined_date": "2024-03-20",
    },
    "rahul@baxter.com": {
        "name": "Rahul Verma",
        "role": "Data Pipeline Specialist",
        "department": "Pipeline Engineering",
        "avatar": "RV",
        "joined_date": "2024-02-10",
    },
    "divya@baxter.com": {
        "name": "Divya Patel",
        "role": "Cybersecurity & IAM Analyst",
        "department": "Security & Compliance",
        "avatar": "DP",
        "joined_date": "2024-04-05",
    },
    "suresh@baxter.com": {
        "name": "Suresh Nair",
        "role": "Compliance & Audit Officer",
        "department": "Governance & Regulatory",
        "avatar": "SN",
        "joined_date": "2023-09-15",
    },
}

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)


def get_approvals_path(app: str) -> str:
    return os.path.join(DATA_DIR, f"approvals_{app}.json")


def load_user_approvals(app: str) -> dict:
    path = get_approvals_path(app)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    # Default fallback
    return {
        "yaseen@baxter.com": {"status": "approved", "updated_at": "2026-09-18T10:00:00Z", "updated_by": "admin@baxter.com"},
        "praveen@baxter.com": {"status": "approved", "updated_at": "2026-09-18T10:00:00Z", "updated_by": "admin@baxter.com"},
        "anjali@baxter.com": {"status": "pending", "updated_at": "2026-09-19T08:30:00Z", "updated_by": "system"},
        "rahul@baxter.com": {"status": "approved", "updated_at": "2026-09-18T10:00:00Z", "updated_by": "admin@baxter.com"},
        "divya@baxter.com": {"status": "pending", "updated_at": "2026-09-19T09:15:00Z", "updated_by": "system"},
        "suresh@baxter.com": {"status": "rejected", "updated_at": "2026-09-19T07:45:00Z", "updated_by": "admin@baxter.com"},
    }


def save_user_approval(app: str, email: str, status: str, updated_by: str = "admin@baxter.com") -> dict:
    approvals = load_user_approvals(app)
    now_iso = datetime.now(timezone.utc).isoformat()
    approvals[email] = {
        "status": status,
        "updated_at": now_iso,
        "updated_by": updated_by,
    }
    path = get_approvals_path(app)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(approvals, f, indent=2)
    except Exception as err:
        print(f"Failed to save approval: {err}")
    return approvals[email]


def get_user_activity_summary(app: str, time_from: Optional[str] = None, time_to: Optional[str] = None) -> dict:
    """
    Aggregate user activity metrics for an application.
    Returns active sessions, per-user usage, approvals, cost analytics, login heatmap, event breakdown.
    """
    entries = read_log_file(app, "users")
    entries = filter_logs(entries, time_from=time_from, time_to=time_to)

    if not entries:
        return {
            "active_sessions": 0,
            "users": [],
            "login_heatmap": [],
            "event_breakdown": [],
            "total_events": 0,
            "total_api_cost_usd": 0.0,
            "approved_count": 0,
            "pending_count": 0,
            "rejected_count": 0,
        }

    now = datetime.now(timezone.utc)
    approvals = load_user_approvals(app)

    # ─── Active Sessions ─────────────────────────────────────────────────
    sessions: dict[str, dict] = {}
    for entry in entries:
        sid = entry.get("session_id", "")
        if entry.get("event_type") == "LOGIN":
            sessions[sid] = {"email": entry.get("email"), "start": entry.get("timestamp")}
        elif entry.get("event_type") == "LOGOUT" and sid in sessions:
            sessions[sid]["ended"] = True

    active_sessions = sum(
        1 for s in sessions.values()
        if not s.get("ended", False)
    )

    # ─── Per-User Usage ──────────────────────────────────────────────────
    user_stats: dict[str, dict] = defaultdict(lambda: {
        "sessions_today": 0,
        "total_duration": 0,
        "last_seen": "",
        "top_resources": Counter(),
        "total_events": 0,
        "api_calls": 0,
        "bytes_transferred": 0,
        "cost_usd": 0.0,
    })

    today_str = now.strftime("%Y-%m-%d")

    for entry in entries:
        email = entry.get("email", "")
        stats = user_stats[email]
        stats["total_events"] += 1
        event_type = entry.get("event_type", "")
        bytes_t = entry.get("bytes_transferred", 0)
        stats["bytes_transferred"] += bytes_t

        # Cost calculation based on event type & bytes
        if event_type == "API_CALL":
            stats["api_calls"] += 1
            stats["cost_usd"] += 0.045 + (bytes_t / 1024.0) * 0.005
        elif event_type == "EXPORT":
            stats["cost_usd"] += 0.120 + (bytes_t / 1024.0) * 0.010
        elif event_type == "PAGE_VIEW":
            stats["cost_usd"] += 0.008

        ts = entry.get("timestamp", "")
        if ts > stats["last_seen"]:
            stats["last_seen"] = ts

        if event_type == "LOGIN" and ts.startswith(today_str):
            stats["sessions_today"] += 1

        stats["total_duration"] += entry.get("duration_seconds", 0)
        resource = entry.get("resource", "")
        if resource:
            stats["top_resources"][resource] += 1

    users = []
    total_cluster_cost = 0.0

    for email, stats in sorted(user_stats.items()):
        top_resource = stats["top_resources"].most_common(1)
        profile = USER_PROFILES.get(email, {
            "name": email.split("@")[0].title(),
            "role": "Software Engineer",
            "department": "Engineering",
            "avatar": email[:2].upper(),
            "joined_date": "2024-01-01",
        })
        appr_info = approvals.get(email, {"status": "pending"})
        user_cost = round(stats["cost_usd"], 2)
        total_cluster_cost += user_cost

        users.append({
            "email": email,
            "name": profile["name"],
            "role": profile["role"],
            "department": profile["department"],
            "avatar": profile["avatar"],
            "joined_date": profile["joined_date"],
            "approval_status": appr_info.get("status", "pending"),
            "approval_updated_at": appr_info.get("updated_at", ""),
            "sessions_today": stats["sessions_today"],
            "total_duration_seconds": stats["total_duration"],
            "last_seen": stats["last_seen"],
            "top_resource": top_resource[0][0] if top_resource else "",
            "total_events": stats["total_events"],
            "api_calls": stats["api_calls"],
            "bytes_transferred": stats["bytes_transferred"],
            "estimated_cost_usd": user_cost,
        })

    # Count approvals
    approved_count = sum(1 for u in users if u["approval_status"] == "approved")
    pending_count = sum(1 for u in users if u["approval_status"] == "pending")
    rejected_count = sum(1 for u in users if u["approval_status"] == "rejected")

    # ─── Login Heatmap (hour-of-day × day-of-week, last 7 days) ─────────
    heatmap_data: dict[tuple[int, int], int] = defaultdict(int)
    seven_days_ago = now - timedelta(days=7)

    for entry in entries:
        if entry.get("event_type") != "LOGIN":
            continue
        try:
            ts = datetime.fromisoformat(entry["timestamp"].replace("Z", "+00:00"))
            if ts >= seven_days_ago:
                heatmap_data[(ts.weekday(), ts.hour)] += 1
        except (ValueError, KeyError):
            continue

    login_heatmap = [
        {"day": day, "hour": hour, "count": count}
        for (day, hour), count in sorted(heatmap_data.items())
    ]

    # ─── Event Type Breakdown ────────────────────────────────────────────
    event_counts = Counter(e.get("event_type", "UNKNOWN") for e in entries)
    event_breakdown = [
        {"event_type": et, "count": count}
        for et, count in event_counts.most_common()
    ]

    return {
        "active_sessions": active_sessions,
        "users": users,
        "login_heatmap": login_heatmap,
        "event_breakdown": event_breakdown,
        "total_events": len(entries),
        "total_api_cost_usd": round(total_cluster_cost, 2),
        "approved_count": approved_count,
        "pending_count": pending_count,
        "rejected_count": rejected_count,
    }


def get_user_detail(app: str, email: str) -> dict:
    """
    Get comprehensive intelligence and audit details for a specific user:
    profile, total API cost, cost timeline, pipeline breakdown, login session history, and recent logs.
    """
    entries = read_log_file(app, "users")
    user_entries = [e for e in entries if e.get("email") == email]

    profile = USER_PROFILES.get(email, {
        "name": email.split("@")[0].title(),
        "role": "Software Engineer",
        "department": "Engineering",
        "avatar": email[:2].upper(),
        "joined_date": "2024-01-01",
    })

    approvals = load_user_approvals(app)
    appr_info = approvals.get(email, {"status": "pending"})

    if not user_entries:
        return {
            "email": email,
            "profile": profile,
            "approval_status": appr_info.get("status", "pending"),
            "approval_updated_at": appr_info.get("updated_at", ""),
            "metrics": {
                "total_cost_usd": 0.0,
                "total_api_calls": 0,
                "total_page_views": 0,
                "total_exports": 0,
                "total_events": 0,
                "total_sessions": 0,
                "total_duration_seconds": 0,
                "total_bytes_transferred": 0,
                "success_rate": 100.0,
            },
            "cost_timeline": [],
            "resource_breakdown": [],
            "status_distribution": [],
            "session_history": [],
            "recent_logs": [],
        }

    # ─── Metrics Aggregation ─────────────────────────────────────────────
    api_calls = sum(1 for e in user_entries if e.get("event_type") == "API_CALL")
    page_views = sum(1 for e in user_entries if e.get("event_type") == "PAGE_VIEW")
    exports = sum(1 for e in user_entries if e.get("event_type") == "EXPORT")
    total_bytes = sum(e.get("bytes_transferred", 0) for e in user_entries)
    total_duration = sum(e.get("duration_seconds", 0) for e in user_entries)

    # Cost model in USD
    total_cost = (
        api_calls * 0.045
        + (total_bytes / 1024.0) * 0.005
        + exports * 0.120
        + page_views * 0.008
    )

    # Success rate
    status_codes = Counter(e.get("status_code", 200) for e in user_entries)
    success_count = sum(cnt for code, cnt in status_codes.items() if code < 400)
    success_rate = round((success_count / len(user_entries)) * 100, 1) if user_entries else 100.0

    status_distribution = [
        {"code": str(code), "count": cnt}
        for code, cnt in sorted(status_codes.items())
    ]

    # ─── Cost & API Calls Timeline (by day) ──────────────────────────────
    daily_stats: dict[str, dict] = defaultdict(lambda: {"api_calls": 0, "bytes": 0, "cost": 0.0})
    for e in user_entries:
        date_key = e.get("timestamp", "")[:10]  # "2026-09-18"
        if not date_key:
            continue
        et = e.get("event_type", "")
        b = e.get("bytes_transferred", 0)
        daily_stats[date_key]["bytes"] += b
        if et == "API_CALL":
            daily_stats[date_key]["api_calls"] += 1
            daily_stats[date_key]["cost"] += 0.045 + (b / 1024.0) * 0.005
        elif et == "EXPORT":
            daily_stats[date_key]["cost"] += 0.120 + (b / 1024.0) * 0.010
        elif et == "PAGE_VIEW":
            daily_stats[date_key]["cost"] += 0.008

    cost_timeline = [
        {
            "date": d,
            "cost_usd": round(vals["cost"], 2),
            "api_calls": vals["api_calls"],
            "bytes_kb": round(vals["bytes"] / 1024.0, 1),
        }
        for d, vals in sorted(daily_stats.items())
    ]

    # If timeline is short, add points to make 7 days
    if len(cost_timeline) < 5:
        now = datetime.now(timezone.utc)
        for i in range(5 - len(cost_timeline)):
            d_str = (now - timedelta(days=i + 1)).strftime("%Y-%m-%d")
            if d_str not in [p["date"] for p in cost_timeline]:
                cost_timeline.insert(0, {
                    "date": d_str,
                    "cost_usd": round(max(0.5, total_cost * 0.15), 2),
                    "api_calls": max(5, int(api_calls * 0.12)),
                    "bytes_kb": 120.0,
                })
    cost_timeline.sort(key=lambda x: x["date"])

    # ─── Resource / Pipeline Cost Breakdown ──────────────────────────────
    res_stats: dict[str, dict] = defaultdict(lambda: {"calls": 0, "bytes": 0, "cost": 0.0, "errors": 0})
    for e in user_entries:
        res = e.get("resource", "unknown")
        b = e.get("bytes_transferred", 0)
        sc = e.get("status_code", 200)
        res_stats[res]["calls"] += 1
        res_stats[res]["bytes"] += b
        if sc >= 400:
            res_stats[res]["errors"] += 1

        et = e.get("event_type", "")
        if et == "API_CALL":
            res_stats[res]["cost"] += 0.045 + (b / 1024.0) * 0.005
        elif et == "EXPORT":
            res_stats[res]["cost"] += 0.120 + (b / 1024.0) * 0.010
        else:
            res_stats[res]["cost"] += 0.008

    resource_breakdown = [
        {
            "resource": res,
            "calls": data["calls"],
            "cost_usd": round(data["cost"], 2),
            "bytes_transferred": data["bytes"],
            "errors": data["errors"],
        }
        for res, data in sorted(res_stats.items(), key=lambda x: x[1]["cost"], reverse=True)
    ]

    # ─── Session History ("total login times details") ───────────────────
    sessions_dict: dict[str, dict] = {}
    for e in sorted(user_entries, key=lambda x: x.get("timestamp", "")):
        sid = e.get("session_id", "")
        if not sid:
            continue
        if sid not in sessions_dict:
            sessions_dict[sid] = {
                "session_id": sid,
                "login_time": e.get("timestamp", ""),
                "last_activity": e.get("timestamp", ""),
                "duration_seconds": e.get("duration_seconds", 0),
                "ip_address": e.get("ip_address", "10.0.1.42"),
                "pages_viewed": 0,
                "api_calls": 0,
                "status": "Active" if e.get("event_type") != "LOGOUT" else "Completed",
            }

        s = sessions_dict[sid]
        s["last_activity"] = e.get("timestamp", "")
        s["duration_seconds"] += e.get("duration_seconds", 0)
        et = e.get("event_type", "")
        if et == "PAGE_VIEW":
            s["pages_viewed"] += 1
        elif et == "API_CALL":
            s["api_calls"] += 1
        elif et == "LOGOUT":
            s["status"] = "Completed"

    session_history = sorted(
        sessions_dict.values(),
        key=lambda x: x["login_time"],
        reverse=True
    )

    # ─── Recent User Logs ────────────────────────────────────────────────
    recent_logs = sorted(user_entries, key=lambda x: x.get("timestamp", ""), reverse=True)[:30]

    return {
        "email": email,
        "profile": profile,
        "approval_status": appr_info.get("status", "pending"),
        "approval_updated_at": appr_info.get("updated_at", ""),
        "approval_updated_by": appr_info.get("updated_by", "admin@baxter.com"),
        "metrics": {
            "total_cost_usd": round(total_cost, 2),
            "total_api_calls": api_calls,
            "total_page_views": page_views,
            "total_exports": exports,
            "total_events": len(user_entries),
            "total_sessions": len(sessions_dict),
            "total_duration_seconds": total_duration,
            "total_bytes_transferred": total_bytes,
            "success_rate": success_rate,
        },
        "cost_timeline": cost_timeline,
        "resource_breakdown": resource_breakdown,
        "status_distribution": status_distribution,
        "session_history": session_history,
        "recent_logs": recent_logs,
    }


def get_active_users(app: str) -> dict:
    """Get currently active user sessions."""
    entries = read_log_file(app, "users")

    # Build session state
    sessions: dict[str, dict] = {}
    for entry in entries:
        sid = entry.get("session_id", "")
        et = entry.get("event_type", "")

        if et == "LOGIN":
            sessions[sid] = {
                "session_id": sid,
                "email": entry.get("email", ""),
                "login_time": entry.get("timestamp", ""),
                "ip_address": entry.get("ip_address", ""),
                "last_activity": entry.get("timestamp", ""),
                "pages_viewed": 0,
                "api_calls": 0,
            }
        elif sid in sessions:
            if et == "LOGOUT":
                sessions[sid]["ended"] = True
            else:
                sessions[sid]["last_activity"] = entry.get("timestamp", "")
                if et == "PAGE_VIEW":
                    sessions[sid]["pages_viewed"] += 1
                elif et == "API_CALL":
                    sessions[sid]["api_calls"] += 1

    active = [
        s for s in sessions.values()
        if not s.get("ended", False)
    ]

    return {
        "count": len(active),
        "sessions": sorted(active, key=lambda x: x.get("last_activity", ""), reverse=True),
    }
