"use client";

import { useAppContext, APP_META, type AppName } from "@/context/AppContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const apps: AppName[] = ["netra", "kavacha", "blackline"];

export default function AppSelector() {
  const { currentApp, setCurrentApp } = useAppContext();
  const router = useRouter();

  const handleSwitch = (app: AppName) => {
    setCurrentApp(app);
    router.push(`/dashboard/${app}`);
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
      {apps.map((app) => {
        const meta = APP_META[app];
        const isActive = currentApp === app;

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
              {/* App icon */}
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
              {/* App label */}
              <span className="text-sm font-medium">{meta.label}</span>
              {/* Status dot */}
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
