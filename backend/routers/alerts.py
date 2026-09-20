"""
Alerts Router
Endpoints for alerts derived from log events.
"""

from fastapi import APIRouter, Query
from typing import Optional

from services.log_parser import read_log_file, filter_logs

router = APIRouter(prefix="/api/{app}/alerts", tags=["alerts"])

VALID_APPS = {"netra", "kavacha", "blackline"}


@router.get("")
async def get_alerts(
    app: str,
    time_from: Optional[str] = Query(None, alias="from"),
    time_to: Optional[str] = Query(None, alias="to"),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get active alerts derived from WARN/ERROR/CRITICAL log entries.
    Returns the most recent critical events as alerts.
    """
    if app not in VALID_APPS:
        return {"error": f"Invalid app: {app}. Must be one of {VALID_APPS}"}

    # Get infra logs with elevated severity
    infra_entries = read_log_file(app, "infra")
    infra_entries = filter_logs(infra_entries, time_from=time_from, time_to=time_to)

    alerts = []
    for entry in infra_entries:
        level = entry.get("level", "INFO")
        if level in ("WARN", "ERROR", "CRITICAL"):
            severity = "critical" if level == "CRITICAL" else "error" if level == "ERROR" else "warning"
            alerts.append({
                "id": f"{entry.get('timestamp', '')}-{entry.get('host', '')}-{entry.get('service', '')}",
                "timestamp": entry.get("timestamp", ""),
                "severity": severity,
                "level": level,
                "host": entry.get("host", ""),
                "service": entry.get("service", ""),
                "message": entry.get("event", ""),
                "pod": entry.get("pod", ""),
                "status": entry.get("status", ""),
                "cpu_percent": entry.get("cpu_percent"),
                "memory_percent": entry.get("memory_percent"),
            })

    # Also check user logs for error status codes
    user_entries = read_log_file(app, "users")
    user_entries = filter_logs(user_entries, time_from=time_from, time_to=time_to)

    for entry in user_entries:
        status_code = entry.get("status_code", 200)
        if status_code >= 500:
            alerts.append({
                "id": f"{entry.get('timestamp', '')}-{entry.get('email', '')}-{status_code}",
                "timestamp": entry.get("timestamp", ""),
                "severity": "error",
                "level": "ERROR",
                "host": "",
                "service": "",
                "message": f"User {entry.get('email', '')} received {status_code} on {entry.get('resource', '')}",
                "pod": "",
                "status": "",
                "cpu_percent": None,
                "memory_percent": None,
            })

    # Sort by timestamp descending, limit results
    alerts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    alerts = alerts[:limit]

    # Count by severity
    severity_counts = {
        "critical": sum(1 for a in alerts if a["severity"] == "critical"),
        "error": sum(1 for a in alerts if a["severity"] == "error"),
        "warning": sum(1 for a in alerts if a["severity"] == "warning"),
    }

    return {
        "total": len(alerts),
        "severity_counts": severity_counts,
        "alerts": alerts,
    }
