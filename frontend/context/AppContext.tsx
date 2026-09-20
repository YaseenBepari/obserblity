"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AppName = "netra" | "kavacha" | "blackline";

export type TimeRange = "15m" | "1h" | "6h" | "24h" | "7d";

export type NavSection = "overview" | "infra" | "users" | "logs" | "alerts" | "ai";

interface AppContextType {
  currentApp: AppName;
  setCurrentApp: (app: AppName) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  getTimeFrom: () => string;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Time Range Helpers ──────────────────────────────────────────────────────

const TIME_RANGE_MS: Record<TimeRange, number> = {
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({
  children,
  initialApp = "netra",
}: {
  children: ReactNode;
  initialApp?: AppName;
}) {
  const [currentApp, setCurrentApp] = useState<AppName>(initialApp);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [activeSection, setActiveSection] = useState<NavSection>("overview");

  const getTimeFrom = useCallback(() => {
    const now = new Date();
    const from = new Date(now.getTime() - TIME_RANGE_MS[timeRange]);
    return from.toISOString();
  }, [timeRange]);

  return (
    <AppContext.Provider
      value={{
        currentApp,
        setCurrentApp,
        timeRange,
        setTimeRange,
        activeSection,
        setActiveSection,
        getTimeFrom,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

// ─── App Metadata ────────────────────────────────────────────────────────────

export const APP_META: Record<
  AppName,
  { label: string; description: string; color: string; icon: string }
> = {
  netra: {
    label: "Netra",
    description: "",
    color: "#6366f1",
    icon: "N",
  },
  kavacha: {
    label: "Kavacha",
    description: "",
    color: "#06b6d4",
    icon: "K",
  },
  blackline: {
    label: "Blackline",
    description: "",
    color: "#8b5cf6",
    icon: "B",
  },
};
