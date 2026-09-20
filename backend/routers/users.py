"""
Users Router
Endpoints for user activity data.
"""

from fastapi import APIRouter, Query
from typing import Optional

from pydantic import BaseModel
from services.log_parser import read_log_file, filter_logs, paginate
from services.metrics_service import (
    get_user_activity_summary,
    get_active_users,
    get_user_detail,
    load_user_approvals,
    save_user_approval,
)

router = APIRouter(prefix="/api/{app}/users", tags=["users"])

VALID_APPS = {"netra", "kavacha", "blackline"}


class ApprovalUpdateRequest(BaseModel):
    email: str
    status: str  # "approved" | "pending" | "rejected"


@router.get("/active")
async def active_users(app: str):
    """Get currently active user sessions."""
    if app not in VALID_APPS:
        return {"error": f"Invalid app: {app}. Must be one of {VALID_APPS}"}
    return get_active_users(app)


@router.get("/activity")
async def user_activity(
    app: str,
    time_from: Optional[str] = Query(None, alias="from"),
    time_to: Optional[str] = Query(None, alias="to"),
):
    """Get per-user activity summary."""
    if app not in VALID_APPS:
        return {"error": f"Invalid app: {app}. Must be one of {VALID_APPS}"}
    return get_user_activity_summary(app, time_from=time_from, time_to=time_to)


@router.get("/detail/{email}")
async def user_detail(app: str, email: str):
    """Get comprehensive single-user intelligence (API cost, login sessions, timeline, audit)."""
    if app not in VALID_APPS:
        return {"error": f"Invalid app: {app}. Must be one of {VALID_APPS}"}
    return get_user_detail(app, email)


@router.get("/approvals")
async def get_approvals(app: str):
    """Get user access approval statuses."""
    if app not in VALID_APPS:
        return {"error": f"Invalid app: {app}. Must be one of {VALID_APPS}"}
    return load_user_approvals(app)


@router.post("/approvals")
async def update_approval(app: str, req: ApprovalUpdateRequest):
    """Approve, reject, or reset a user's platform access."""
    if app not in VALID_APPS:
        return {"error": f"Invalid app: {app}. Must be one of {VALID_APPS}"}
    if req.status not in ("approved", "pending", "rejected"):
        return {"error": f"Invalid status: {req.status}. Must be one of approved, pending, rejected"}
    updated = save_user_approval(app, req.email, req.status)
    return {"status": "ok", "approval": updated}


@router.get("/logs")
async def user_logs(
    app: str,
    email: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None, description="Comma-separated: LOGIN,LOGOUT,PAGE_VIEW,API_CALL,EXPORT"),
    search: Optional[str] = Query(None),
    time_from: Optional[str] = Query(None, alias="from"),
    time_to: Optional[str] = Query(None, alias="to"),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Get paginated user activity log entries with filtering."""
    if app not in VALID_APPS:
        return {"error": f"Invalid app: {app}. Must be one of {VALID_APPS}"}

    entries = read_log_file(app, "users")
    filtered = filter_logs(
        entries,
        search=search,
        time_from=time_from,
        time_to=time_to,
        email=email,
        event_type=event_type,
    )
    return paginate(filtered, offset=offset, limit=limit)
