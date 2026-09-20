"use client";

import { AppProvider, type AppName } from "@/context/AppContext";
import Sidebar from "@/components/Sidebar";
import AppSelector from "@/components/AppSelector";
import TimeRangePicker from "@/components/TimeRangePicker";
import ThemeToggle from "@/components/ThemeToggle";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Extract app from URL
  const segments = pathname?.split("/") || [];
  const appFromUrl = segments[2] as AppName | undefined;
  const initialApp: AppName =
    appFromUrl && ["netra", "kavacha", "blackline"].includes(appFromUrl)
      ? appFromUrl
      : "netra";

  return (
    <AppProvider initialApp={initialApp}>
      <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main
          className="flex-1 flex flex-col"
          style={{ marginLeft: "var(--sidebar-width)" }}
        >
          {/* Top Bar */}
          <header
            className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 ov-glass"
            style={{
              borderBottom: "1px solid var(--glass-border)",
              height: "var(--header-height)",
            }}
          >
            <AppSelector />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <TimeRangePicker />
              {/* Refresh indicator */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px]"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--status-healthy)", animation: "pulse-green 2s ease-in-out infinite" }}
                />
                Auto-refresh 10s
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 p-6 grid-bg">{children}</div>
        </main>
      </div>
    </AppProvider>
  );
}
