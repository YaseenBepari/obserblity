"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, APP_META, type AppName, type NavSection } from "@/context/AppContext";
import AlertBanner from "@/components/AlertBanner";
import InfraHealthPanel from "@/components/InfraHealthPanel";
import UserActivityPanel from "@/components/UserActivityPanel";
import LogExplorer from "@/components/LogExplorer";
import AlertsPanel from "@/components/AlertsPanel";
import AIAssistantPanel from "@/components/AIAssistantPanel";

const validApps = new Set(["netra", "kavacha", "blackline"]);

const viewTabs: { id: NavSection; label: string; icon: string }[] = [
  { id: "overview", label: "Overview (All Panels)", icon: "📊" },
  { id: "infra", label: "Infrastructure", icon: "🖥️" },
  { id: "users", label: "User Activity", icon: "👥" },
  { id: "logs", label: "Log Explorer", icon: "📄" },
  { id: "alerts", label: "Alerts Center", icon: "🔔" },
  { id: "ai", label: "AI Assistant", icon: "✨" },
];

export default function AppDashboardPage() {
  const params = useParams();
  const appParam = params?.app as string;
  const { currentApp, setCurrentApp, activeSection, setActiveSection } = useAppContext();

  // Sync URL param with context
  useEffect(() => {
    if (appParam && validApps.has(appParam) && appParam !== currentApp) {
      setCurrentApp(appParam as AppName);
    }
  }, [appParam, currentApp, setCurrentApp]);

  // Sync URL hash with activeSection
  useEffect(() => {
    const handleHashSync = () => {
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.replace("#", "") as NavSection;
        if (["overview", "infra", "users", "logs", "alerts", "ai"].includes(hash)) {
          setActiveSection(hash);
        }
      }
    };

    handleHashSync();
    window.addEventListener("hashchange", handleHashSync);
    return () => window.removeEventListener("hashchange", handleHashSync);
  }, [setActiveSection]);

  const app = (validApps.has(appParam) ? appParam : "netra") as AppName;
  const meta = APP_META[app];

  const handleTabClick = (section: NavSection) => {
    setActiveSection(section);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/dashboard/${app}#${section}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Persistent Alert Banner (Removed by User) ───────────────── */}

      {/* ─── Page Header & Sub-Nav ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: "var(--border-primary)" }}>
        <motion.div
          key={app}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{
              background: `${meta.color}20`,
              color: meta.color,
              border: `1px solid ${meta.color}40`,
              boxShadow: `0 4px 12px ${meta.color}15`,
            }}
          >
            {meta.icon}
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {meta.label} Dashboard
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {meta.description}
            </p>
          </div>
        </motion.div>

        {/* ─── Quick View Tabs ────────────────────────────────────────── */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}
        >
          {viewTabs.map((tab) => {
            const isTabActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  color: isTabActive ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {isTabActive && (
                  <motion.div
                    layoutId="page-tab-bg"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-accent)",
                    }}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Views ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* VIEW: Overview (All Panels) */}
        {activeSection === "overview" && (
          <motion.div
            key="view-overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* Infrastructure Health Section */}
            <section id="infra" className="scroll-mt-20">
              <SectionHeader
                title="Infrastructure Health"
                actionLabel="Focus View"
                onAction={() => handleTabClick("infra")}
              />
              <InfraHealthPanel />
            </section>

            {/* User Activity Section */}
            <section id="users" className="scroll-mt-20">
              <SectionHeader
                title="User Activity"
                actionLabel="Focus View"
                onAction={() => handleTabClick("users")}
              />
              <UserActivityPanel />
            </section>

            {/* Log Explorer Section */}
            <section id="logs" className="scroll-mt-20">
              <SectionHeader
                title="Log Explorer"
                actionLabel="Focus View"
                onAction={() => handleTabClick("logs")}
              />
              <LogExplorer />
            </section>

            {/* Alerts Center Section */}
            <section id="alerts" className="scroll-mt-20">
              <SectionHeader
                title="Alerts Center"
                actionLabel="Focus View"
                onAction={() => handleTabClick("alerts")}
              />
              <AlertsPanel />
            </section>
          </motion.div>
        )}

        {/* VIEW: Infrastructure Focus */}
        {activeSection === "infra" && (
          <motion.div
            key="view-infra"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <SectionHeader
              title="Infrastructure Health & Node Telemetry"
              actionLabel="Show All Panels"
              onAction={() => handleTabClick("overview")}
            />
            <InfraHealthPanel />
          </motion.div>
        )}

        {/* VIEW: User Activity Focus */}
        {activeSection === "users" && (
          <motion.div
            key="view-users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <SectionHeader
              title="User Activity, Sessions & Audit Telemetry"
              actionLabel="Show All Panels"
              onAction={() => handleTabClick("overview")}
            />
            <UserActivityPanel />
          </motion.div>
        )}

        {/* VIEW: Log Explorer Focus */}
        {activeSection === "logs" && (
          <motion.div
            key="view-logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <SectionHeader
              title="Log Explorer & Live Stream"
              actionLabel="Show All Panels"
              onAction={() => handleTabClick("overview")}
            />
            <LogExplorer />
          </motion.div>
        )}

        {/* VIEW: Alerts Center Focus */}
        {activeSection === "alerts" && (
          <motion.div
            key="view-alerts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <SectionHeader
              title="Alerts & System Incidents"
              actionLabel="Show All Panels"
              onAction={() => handleTabClick("overview")}
            />
            <AlertsPanel />
          </motion.div>
        )}

        {/* VIEW: AI Assistant */}
        {activeSection === "ai" && (
          <motion.div
            key="view-ai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <AIAssistantPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3
        className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
        style={{ color: "var(--text-muted)" }}
      >
        <span
          className="w-1 h-4 rounded-full"
          style={{ background: "var(--accent-primary)" }}
        />
        {title}
      </h3>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-[11px] font-medium transition-colors hover:underline cursor-pointer"
          style={{ color: "var(--accent-primary-light)" }}
        >
          {actionLabel} →
        </button>
      )}
    </div>
  );
}
