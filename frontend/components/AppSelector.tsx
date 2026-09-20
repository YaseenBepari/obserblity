"use client";

import { useAppContext, APP_META, type AppName } from "@/context/AppContext";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

const apps: AppName[] = ["netra", "kavacha", "blackline"];

export default function AppSelector() {
  const { currentApp, setCurrentApp } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  
  const isOverview = pathname === "/dashboard";

  const handleSwitch = (app: AppName) => {
    setCurrentApp(app);
    router.push(`/dashboard/${app}`);
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
      {/* Overview Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer"
        style={{
          color: isOverview ? "var(--text-primary)" : "var(--text-muted)",
        }}
      >
        {isOverview && (
          <motion.div
            layoutId="app-selector-bg"
            className="absolute inset-0 rounded-lg"
            style={{
              background: `linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.1))`,
              border: `1px solid rgba(99,102,241,0.4)`,
            }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2.5">
          <span
            className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold"
            style={{
              background: isOverview ? `rgba(99,102,241,0.3)` : "var(--bg-tertiary)",
              color: isOverview ? "#6366f1" : "var(--text-muted)",
              border: `1px solid ${isOverview ? `rgba(99,102,241,0.5)` : "var(--border-primary)"}`,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16zm0 0l-2-2m18 2l2-2" /><path d="M14 8h-4v4h4V8z" /></svg>
          </span>
          <span className="text-sm font-medium">Overview</span>
        </span>
      </button>

      <div className="w-[1px] h-6 mx-1 bg-[var(--border-primary)]" />

      {/* App Buttons */}
      {apps.map((app) => {
        const meta = APP_META[app];
        const isActive = !isOverview && currentApp === app;

        return (
          <button
            key={app}
            onClick={() => handleSwitch(app)}
            className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer"
            style={{
              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="app-selector-bg"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${meta.color}20, ${meta.color}10)`,
                  border: `1px solid ${meta.color}40`,
                }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2.5">
              <span
                className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold"
                style={{
                  background: isActive ? `${meta.color}30` : "var(--bg-tertiary)",
                  color: isActive ? meta.color : "var(--text-muted)",
                  border: `1px solid ${isActive ? `${meta.color}50` : "var(--border-primary)"}`,
                }}
              >
                {meta.icon}
              </span>
              <span className="text-sm font-medium">{meta.label}</span>
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: isActive ? meta.color : "var(--text-muted)",
                  boxShadow: isActive ? `0 0 8px ${meta.color}60` : "none",
                }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
