# OneView — Unified Observability & Admin Intelligence Platform

> Centralised, Grafana-style observability dashboard for Baxter International's internal application ecosystem.

![OneView](https://img.shields.io/badge/Status-Demo%20Ready-6366f1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat-square&logo=python)

---

## Overview

OneView provides a **single pane of glass** for infrastructure health monitoring, application-level log analysis, and real-time user activity tracking — scoped per application — for three internal platforms:

| Application | Description |
|---|---|
| **Netra** | Data Analytics & Pipeline Platform |
| **Kavacha** | Security & Compliance Engine |
| **Blackline** | Financial Reconciliation Suite |

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **pip** (Python package manager)

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Generate sample log data
python seed_logs.py

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start the dev server
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

### 3. Login

Use any `@baxter.com` email (e.g., `admin@baxter.com`) with any password (4+ characters).

---

## Architecture

```
Frontend (Next.js :3000)  ──REST/WS──▶  Backend (FastAPI :8000)
                                              │
                                    ┌─────────┼─────────┐
                                    ▼         ▼         ▼
                               netra/    kavacha/   blackline/
                              ├ infra.log  ├ infra.log  ├ infra.log
                              └ users.log  └ users.log  └ users.log
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/{app}/infra/metrics` | Infrastructure metrics snapshot |
| `GET` | `/api/{app}/infra/logs` | Paginated infra log entries |
| `GET` | `/api/{app}/users/active` | Active user sessions |
| `GET` | `/api/{app}/users/activity` | Per-user usage summary |
| `GET` | `/api/{app}/users/logs` | Paginated user activity logs |
| `GET` | `/api/{app}/alerts` | Active alerts |
| `WS` | `/ws/{app}/logs` | Live log tail |
| `GET` | `/api/health` | Health check |

---

## Features

- **App-scoped views** — Switch between Netra, Kavacha, Blackline instantly
- **Infrastructure monitoring** — CPU, memory, disk gauges, node status grid, service map
- **User telemetry** — Active sessions, per-user usage table, login heatmap, event donut chart
- **Log explorer** — Searchable, filterable, colour-coded log stream with live WebSocket tail
- **Alerts** — Auto-surfaced WARN/ERROR/CRITICAL events with dismissible banners
- **Time range picker** — 15m / 1h / 6h / 24h / 7d affecting all panels
- **Dark mode** — Grafana-inspired aesthetic with glassmorphism
- **Auto-refresh** — 10-second polling interval for all panels

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v4, Custom CSS Design System |
| Charts | Recharts |
| Animations | Framer Motion |
| State | React Context |
| Backend | FastAPI (Python) |
| Real-time | WebSockets |
| Data | NDJSON log files (seeded) |

---

## Project Structure

```
oneview/
├── frontend/           # Next.js application
│   ├── app/            # Pages (App Router)
│   ├── components/     # UI components
│   ├── context/        # React Context (AppContext)
│   └── lib/            # API client
├── backend/            # Python FastAPI
│   ├── routers/        # API route handlers
│   ├── services/       # Business logic
│   ├── logs/           # Generated log files
│   └── seed_logs.py    # Data seeder
└── docker-compose.yml
```

---

*Built by Yaseen Bepari at Baxter International.*
