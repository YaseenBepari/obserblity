"""
OneView — FastAPI Backend Entry Point
Provides REST endpoints and WebSocket live tail for the observability dashboard.
"""

import asyncio
import json
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from routers import infra, users, alerts

# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("[START] OneView Backend starting...")

    # Check if log files exist; if not, run seeder
    logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    if not os.path.exists(os.path.join(logs_dir, "netra", "infra.log")):
        print("[SEED] Log files not found -- running seeder...")
        from seed_logs import seed_all
        seed_all()

    print("[OK] OneView Backend ready")
    yield
    print("[STOP] OneView Backend shutting down")

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="OneView API",
    description="Unified Observability & Admin Intelligence Platform — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────

app.include_router(infra.router)
app.include_router(users.router)
app.include_router(alerts.router)

# ─── Health Check ────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["health"])
async def health_check():
    """Backend health check endpoint."""
    return {
        "status": "healthy",
        "service": "oneview-backend",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "version": "1.0.0",
    }

# ─── WebSocket — Live Log Tail ───────────────────────────────────────────────

VALID_APPS = {"netra", "kavacha", "blackline"}


@app.websocket("/ws/{app_name}/logs")
async def websocket_log_tail(websocket: WebSocket, app_name: str):
    """
    WebSocket endpoint for live log tailing.
    Streams new log entries every 2-3 seconds with simulated real-time data.
    """
    if app_name not in VALID_APPS:
        await websocket.close(code=4001, reason=f"Invalid app: {app_name}")
        return

    await websocket.accept()

    try:
        # Read existing logs to determine patterns
        from services.log_parser import read_log_file
        from seed_logs import (
            SERVICES, HOSTS, USERS, RESOURCES,
            weighted_level, generate_cpu, generate_memory,
            generate_disk, status_from_level, generate_pod_name,
            INFRA_EVENTS,
        )
        import random
        from datetime import datetime, timezone
        import uuid

        while True:
            # Generate a new random log entry (alternating infra/user)
            log_type = random.choice(["infra", "user"])

            if log_type == "infra":
                level = weighted_level()
                host = random.choice(HOSTS[app_name])
                service = random.choice(SERVICES[app_name])
                pod = generate_pod_name(service)
                disk = generate_disk()

                event_template = random.choice(INFRA_EVENTS[level])
                event = event_template.format(
                    service=service, host=host, pod=pod, disk=disk,
                )

                entry = {
                    "type": "infra",
                    "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
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
            else:
                user = random.choice(USERS)
                event_type = random.choice(["PAGE_VIEW", "API_CALL", "LOGIN", "EXPORT"])
                resource = random.choice(RESOURCES[app_name])
                status_code = random.choices(
                    [200, 201, 400, 401, 500],
                    weights=[70, 10, 8, 5, 7],
                    k=1,
                )[0]

                entry = {
                    "type": "user",
                    "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "email": user,
                    "event_type": event_type,
                    "session_id": f"sess-{uuid.uuid4().hex[:8]}",
                    "ip_address": f"10.{random.randint(20, 30)}.{random.randint(1, 10)}.{random.randint(100, 254)}",
                    "duration_seconds": random.randint(1, 300),
                    "resource": resource,
                    "status_code": status_code,
                    "bytes_transferred": random.randint(500, 250000),
                }

            await websocket.send_json(entry)
            await asyncio.sleep(random.uniform(1.5, 4.0))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass


# ─── Init file for services package ─────────────────────────────────────────
# (created separately)
