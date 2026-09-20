"""
Log Parser Service
Reads and parses NDJSON log files with filtering, searching, and pagination.
"""

import json
import os
from datetime import datetime, timezone
from typing import Optional

# Base directory for log files
LOGS_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")

VALID_APPS = {"netra", "kavacha", "blackline"}


def _get_log_path(app: str, log_type: str) -> str:
    """Get the absolute path to a log file."""
    filename = "infra.log" if log_type == "infra" else "users.log"
    return os.path.join(LOGS_BASE_DIR, app, filename)


def read_log_file(app: str, log_type: str) -> list[dict]:
    """Read and parse all entries from a log file."""
    path = _get_log_path(app, log_type)
    entries = []
    if not os.path.exists(path):
        return entries
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return entries


def filter_logs(
    entries: list[dict],
    level: Optional[str] = None,
    search: Optional[str] = None,
    time_from: Optional[str] = None,
    time_to: Optional[str] = None,
    host: Optional[str] = None,
    service: Optional[str] = None,
    email: Optional[str] = None,
    event_type: Optional[str] = None,
) -> list[dict]:
    """Filter log entries based on criteria."""
    filtered = entries

    if level:
        levels = [l.strip().upper() for l in level.split(",")]
        filtered = [e for e in filtered if e.get("level", "").upper() in levels]

    if search:
        search_lower = search.lower()
        filtered = [
            e for e in filtered
            if any(search_lower in str(v).lower() for v in e.values())
        ]

    if time_from:
        try:
            from_dt = datetime.fromisoformat(time_from.replace("Z", "+00:00"))
            filtered = [
                e for e in filtered
                if datetime.fromisoformat(e["timestamp"].replace("Z", "+00:00")) >= from_dt
            ]
        except (ValueError, KeyError):
            pass

    if time_to:
        try:
            to_dt = datetime.fromisoformat(time_to.replace("Z", "+00:00"))
            filtered = [
                e for e in filtered
                if datetime.fromisoformat(e["timestamp"].replace("Z", "+00:00")) <= to_dt
            ]
        except (ValueError, KeyError):
            pass

    if host:
        filtered = [e for e in filtered if e.get("host") == host]

    if service:
        filtered = [e for e in filtered if e.get("service") == service]

    if email:
        filtered = [e for e in filtered if e.get("email") == email]

    if event_type:
        event_types = [et.strip().upper() for et in event_type.split(",")]
        filtered = [e for e in filtered if e.get("event_type", "").upper() in event_types]

    return filtered


def paginate(entries: list[dict], offset: int = 0, limit: int = 50) -> dict:
    """Paginate log entries and return metadata."""
    total = len(entries)
    # Return most recent first
    entries_sorted = sorted(entries, key=lambda x: x.get("timestamp", ""), reverse=True)
    page = entries_sorted[offset: offset + limit]
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "has_more": (offset + limit) < total,
        "entries": page,
    }
