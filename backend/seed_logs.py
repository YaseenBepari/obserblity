"""
OneView — Sample Log Data Seeder
Generates realistic infrastructure and user activity logs for Netra, Kavacha, and Blackline.
Run: python seed_logs.py
"""

import json
import os
import random
import uuid
from datetime import datetime, timedelta, timezone

# ─── Configuration ───────────────────────────────────────────────────────────

APPS = ["netra", "kavacha", "blackline"]

USERS = [
    "yaseen@baxter.com",
    "praveen@baxter.com",
    "anjali@baxter.com",
    "rahul@baxter.com",
    "divya@baxter.com",
    "suresh@baxter.com",
]

SERVICES = {
    "netra": ["auth-service", "data-pipeline", "analytics-engine", "notification-service", "api-gateway", "scheduler"],
    "kavacha": ["auth-service", "policy-engine", "audit-logger", "access-manager", "api-gateway", "compliance-checker"],
    "blackline": ["auth-service", "reconciliation-engine", "matching-service", "report-generator", "api-gateway", "task-scheduler"],
}

HOSTS = {
    "netra": ["netra-node-01", "netra-node-02", "netra-node-03", "netra-node-04"],
    "kavacha": ["kavacha-node-01", "kavacha-node-02", "kavacha-node-03"],
    "blackline": ["blackline-node-01", "blackline-node-02", "blackline-node-03", "blackline-node-04", "blackline-node-05"],
}

EVENT_TYPES = ["LOGIN", "LOGOUT", "PAGE_VIEW", "API_CALL", "EXPORT"]

RESOURCES = {
    "netra": [
        "/netra/dashboard/analytics",
        "/netra/dashboard/overview",
        "/netra/reports/generate",
        "/netra/api/v1/data",
        "/netra/api/v1/metrics",
        "/netra/settings/profile",
        "/netra/alerts/configure",
        "/netra/pipeline/status",
    ],
    "kavacha": [
        "/kavacha/dashboard/compliance",
        "/kavacha/dashboard/overview",
        "/kavacha/policies/manage",
        "/kavacha/api/v1/audit",
        "/kavacha/api/v1/access",
        "/kavacha/settings/roles",
        "/kavacha/reports/violations",
        "/kavacha/access/review",
    ],
    "blackline": [
        "/blackline/dashboard/reconciliation",
        "/blackline/dashboard/overview",
        "/blackline/matching/review",
        "/blackline/api/v1/tasks",
        "/blackline/api/v1/reports",
        "/blackline/settings/config",
        "/blackline/reports/export",
        "/blackline/tasks/queue",
    ],
}

INFRA_EVENTS = {
    "INFO": [
        "Health check passed for {service}",
        "Scheduled backup completed successfully on {host}",
        "Pod {pod} scaled up to handle increased load",
        "Configuration reloaded for {service}",
        "Certificate renewal successful for {service}",
        "Deployment rollout complete for {service}",
        "Cache cleared and rebuilt for {service}",
        "Database connection pool refreshed on {host}",
        "Log rotation completed on {host}",
        "Metrics export successful for {service}",
    ],
    "WARN": [
        "High CPU utilisation detected on {service} pod",
        "Memory usage approaching threshold on {host}",
        "Disk usage at {disk}% on {host} — cleanup recommended",
        "Slow response times detected for {service} (p99 > 2s)",
        "Connection pool near capacity for {service} on {host}",
        "Rate limiter triggered for {service} API endpoint",
        "Pod {pod} restart count elevated (3 in last hour)",
        "SSL certificate expires in 14 days for {service}",
    ],
    "ERROR": [
        "Failed to connect to database from {service} on {host}",
        "Pod {pod} crashed with OOMKilled — insufficient memory",
        "Service {service} returned 5xx errors (12 in last 5min)",
        "Disk write failure on {host} — volume /data full",
        "Authentication service timeout — upstream {service} unavailable",
        "Failed health check for {service} — 3 consecutive failures",
    ],
    "CRITICAL": [
        "Node {host} unreachable — all pods rescheduling",
        "Data pipeline halted — {service} master process down",
        "Complete service outage for {service} across all replicas",
        "Database primary failover triggered on {host}",
    ],
}

# ─── Helpers ─────────────────────────────────────────────────────────────────

def generate_pod_name(service: str) -> str:
    suffix = uuid.uuid4().hex[:8]
    return f"{service}-{suffix[:5]}-{suffix[5:]}"


def weighted_level() -> str:
    return random.choices(
        ["INFO", "WARN", "ERROR", "CRITICAL"],
        weights=[60, 25, 12, 3],
        k=1,
    )[0]


def generate_cpu(level: str) -> float:
    if level == "CRITICAL":
        return round(random.uniform(92.0, 99.9), 1)
    elif level == "ERROR":
        return round(random.uniform(80.0, 95.0), 1)
    elif level == "WARN":
        return round(random.uniform(65.0, 85.0), 1)
    return round(random.uniform(10.0, 60.0), 1)


def generate_memory(level: str) -> float:
    if level == "CRITICAL":
        return round(random.uniform(90.0, 99.0), 1)
    elif level == "ERROR":
        return round(random.uniform(75.0, 92.0), 1)
    elif level == "WARN":
        return round(random.uniform(60.0, 80.0), 1)
    return round(random.uniform(20.0, 55.0), 1)


def generate_disk() -> float:
    return round(random.uniform(15.0, 85.0), 1)


def status_from_level(level: str) -> str:
    if level == "CRITICAL":
        return "down"
    elif level in ("ERROR", "WARN"):
        return random.choice(["degraded", "healthy"])
    return "healthy"


# ─── Generators ──────────────────────────────────────────────────────────────

def generate_infra_logs(app: str, count: int = 350) -> list[dict]:
    """Generate infrastructure log entries for an application."""
    logs = []
    now = datetime.now(timezone.utc)
    hosts = HOSTS[app]
    services = SERVICES[app]

    for i in range(count):
        # Spread entries across last 7 days with more recent entries weighted higher
        hours_ago = random.expovariate(0.15)  # Exponential distribution favoring recent
        hours_ago = min(hours_ago, 168)  # Cap at 7 days
        ts = now - timedelta(hours=hours_ago)

        level = weighted_level()
        host = random.choice(hosts)
        service = random.choice(services)
        pod = generate_pod_name(service)
        disk = generate_disk()

        event_template = random.choice(INFRA_EVENTS[level])
        event = event_template.format(
            service=service,
            host=host,
            pod=pod,
            disk=disk,
        )

        entry = {
            "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "level": level,
            "host": host,
            "service": service,
            "cpu_percent": generate_cpu(level),
            "memory_percent": generate_memory(level),
            "disk_used_gb": disk,
            "event": event,
            "pod": pod,
            "status": status_from_level(level),
        }
        logs.append(entry)

    # Sort by timestamp
    logs.sort(key=lambda x: x["timestamp"])
    return logs


def generate_user_logs(app: str, count: int = 400) -> list[dict]:
    """Generate user activity log entries for an application."""
    logs = []
    now = datetime.now(timezone.utc)
    resources = RESOURCES[app]

    # Track active sessions per user
    active_sessions: dict[str, str] = {}

    for i in range(count):
        hours_ago = random.expovariate(0.03)
        hours_ago = min(hours_ago, 168)
        ts = now - timedelta(hours=hours_ago)

        user = random.choice(USERS)

        # Determine event type with realistic weighting
        if user in active_sessions:
            event_type = random.choices(
                ["PAGE_VIEW", "API_CALL", "EXPORT", "LOGOUT"],
                weights=[40, 35, 10, 15],
                k=1,
            )[0]
            session_id = active_sessions[user]
            if event_type == "LOGOUT":
                del active_sessions[user]
        else:
            event_type = "LOGIN"
            session_id = f"sess-{uuid.uuid4().hex[:8]}"
            active_sessions[user] = session_id

        resource = random.choice(resources)

        # Status codes — mostly 200, with some 4xx and 5xx
        if event_type in ("LOGIN", "LOGOUT"):
            status_code = 200
        else:
            status_code = random.choices(
                [200, 201, 301, 400, 401, 403, 404, 500, 502, 503],
                weights=[70, 5, 2, 5, 3, 2, 5, 4, 2, 2],
                k=1,
            )[0]

        duration = random.randint(1, 300) if event_type in ("PAGE_VIEW", "API_CALL") else 0
        bytes_transferred = random.randint(500, 250000) if event_type != "LOGOUT" else 0

        # Generate internal IP
        ip = f"10.{random.randint(20, 30)}.{random.randint(1, 10)}.{random.randint(100, 254)}"

        entry = {
            "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "email": user,
            "event_type": event_type,
            "session_id": session_id,
            "ip_address": ip,
            "duration_seconds": duration,
            "resource": resource,
            "status_code": status_code,
            "bytes_transferred": bytes_transferred,
        }
        logs.append(entry)

    logs.sort(key=lambda x: x["timestamp"])
    return logs


# ─── Main ────────────────────────────────────────────────────────────────────

def seed_all():
    """Generate all log files for all applications."""
    base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")

    for app in APPS:
        app_dir = os.path.join(base_dir, app)
        os.makedirs(app_dir, exist_ok=True)

        # Infrastructure logs
        infra_count = random.randint(250, 500)
        infra_logs = generate_infra_logs(app, count=infra_count)
        infra_path = os.path.join(app_dir, "infra.log")
        with open(infra_path, "w", encoding="utf-8") as f:
            for entry in infra_logs:
                f.write(json.dumps(entry) + "\n")
        print(f"  [OK] {infra_path} -- {len(infra_logs)} entries")

        # User activity logs
        user_count = random.randint(300, 500)
        user_logs = generate_user_logs(app, count=user_count)
        user_path = os.path.join(app_dir, "users.log")
        with open(user_path, "w", encoding="utf-8") as f:
            for entry in user_logs:
                f.write(json.dumps(entry) + "\n")
        print(f"  [OK] {user_path} -- {len(user_logs)} entries")

    print("\n[DONE] All log files seeded successfully.")


if __name__ == "__main__":
    print("[SEED] OneView Log Seeder -- Generating sample data...\n")
    seed_all()
