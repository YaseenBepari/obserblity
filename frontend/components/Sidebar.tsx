"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppContext, APP_META, type NavSection } from "@/context/AppContext";
import { api } from "@/lib/api";

interface NavItemConfig {
  label: string;
  icon: React.ReactNode;
  section: NavSection;
}

const navItems: NavItemConfig[] = [
  {
    label: "Overview",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    section: "overview",
  },
  {
    label: "Infrastructure",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    section: "infra",
  },
  {
    label: "Users",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    section: "users",
  },
  {
    label: "Logs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    ),
    section: "logs",
  },
  {
    label: "Alerts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    section: "alerts",
  },
  {
    label: "AI Assistant",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6-6.2-4.5-6.2 4.5 2.4-7.6L2 9.6h7.6L12 2z" />
      </svg>
    ),
    section: "ai",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentApp, activeSection, setActiveSection } = useAppContext();
  const meta = APP_META[currentApp];
  const [alertCount, setAlertCount] = useState<number>(0);

  // Fetch alert count to display on badge
  useEffect(() => {
    let cancelled = false;
    const fetchAlertCount = async () => {
      try {
        const data = await api.getAlerts(currentApp, 10);
        if (!cancelled && data.alerts) {
          setAlertCount(data.alerts.length);
        }
      } catch {
        // silent fail
      }
    };

    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentApp]);

  const handleNavClick = (section: NavSection) => {
    setActiveSection(section);
    const targetUrl = `/dashboard/${currentApp}#${section}`;

    if (!pathname?.startsWith(`/dashboard/${currentApp}`)) {
      router.push(targetUrl);
    } else {
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", targetUrl);
        if (section === "overview") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          // If the element exists on page, scroll to it
          const el = document.getElementById(section);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      }
    }
  };

  return (
    <aside
      className="fixed top-0 left-0 h-full flex flex-col ov-glass z-40"
      style={{ width: "var(--sidebar-width)", borderRight: "1px solid var(--glass-border)" }}
    >
      {/* ─── Logo ──────────────────────────────────────────────────────── */}
      <div 
        className="px-5 py-5 border-b cursor-pointer hover:opacity-80 transition-opacity" 
        style={{ borderColor: "var(--border-primary)" }}
        onClick={() => router.push("/dashboard")}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm select-none"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            }}
          >
            OV
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              OneView
            </h1>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Observability Platform
            </p>
          </div>
        </div>
      </div>

      {/* ─── App Context ───────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-primary)" }}>
        <div className="flex items-center gap-2.5">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              background: `${meta.color}20`,
              color: meta.color,
              border: `1px solid ${meta.color}40`,
            }}
          >
            {meta.icon}
          </span>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {meta.label}
            </p>
            <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
              {meta.description}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = activeSection === item.section;

          return (
            <button
              key={item.section}
              type="button"
              onClick={() => handleNavClick(item.section)}
              className="w-full relative flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-left cursor-pointer"
              style={{
                background: isActive ? "linear-gradient(90deg, rgba(99, 102, 241, 0.16), rgba(99, 102, 241, 0.04))" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                border: `1px solid ${isActive ? "rgba(99, 102, 241, 0.28)" : "transparent"}`,
              }}
            >
              {/* Active left indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                  style={{
                    background: "var(--accent-primary-light)",
                    boxShadow: "0 0 10px rgba(99, 102, 241, 0.6)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="flex items-center gap-3">
                <span
                  className="transition-colors"
                  style={{
                    color: isActive ? "var(--accent-primary-light)" : "inherit",
                  }}
                >
                  {item.icon}
                </span>
                <span
                  className="text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? "var(--text-primary)" : undefined,
                  }}
                >
                  {item.label}
                </span>
              </div>

              {/* Status or counter badges */}
              {item.section === "logs" && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}

              {item.section === "alerts" && alertCount > 0 && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold"
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                  }}
                >
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border-primary)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: "#6366f120", color: "#818cf8" }}
          >
            A
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              Admin
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              admin@baxter.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
