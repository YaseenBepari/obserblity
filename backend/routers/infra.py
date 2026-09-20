"""
Infrastructure Router
Endpoints for infrastructure metrics and logs.
"""

from fastapi import APIRouter, Query
from typing import Optional

from services.log_parser import read_log_file, filter_logs, paginate
from services.metrics_service import get_infra_metrics

router = APIRouter(prefix="/api/{app}/infra", tags=["infrastructure"])

VALID_APPS = {"netra", "kavacha", "blackline"}


@router.get("/metrics")
async def infra_metrics(
    app: str,
    time_from: Optional[str] = Query(None, alias="from"),
    time_to: Optional[str] = Query(None, alias="to"),
    host: Optional[str] = Query(None, description="Filter metrics by specific node host or 'all'"),
):
    """Get current infrastructure metrics snapshot for an application."""
    if app not in VALID_APPS:
        return {"error": f"Invalid app: {app}. Must be one of {VALID_APPS}"}
    return get_infra_metrics(app, time_from=time_from, time_to=time_to, host=host)


@router.get("/logs")
async def infra_logs(
    app: str,
    level: Optional[str] = Query(None, description="Comma-separated levels: INFO,WARN,ERROR,CRITICAL"),
    search: Optional[str] = Query(None, description="Full-text search across all fields"),
    host: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    time_from: Optional[str] = Query(None, alias="from"),
    time_to: Optional[str] = Query(None, alias="to"),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Get paginated infrastructure log entries with filtering."""
    if app not in VALID_APPS:
        return {"error": f"Invalid app: {app}. Must be one of {VALID_APPS}"}

    entries = read_log_file(app, "infra")
    filtered = filter_logs(
        entries,
        level=level,
        search=search,
        time_from=time_from,
        time_to=time_to,
        host=host,
        service=service,
    )
    return paginate(filtered, offset=offset, limit=limit)
