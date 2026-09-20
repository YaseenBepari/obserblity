"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";

export default function AIAssistantPanel() {
  const { currentApp } = useAppContext();
  const [prompt, setPrompt] = useState("");
  const [autoNavigation, setAutoNavigation] = useState(true);

  // Replicate O2 Assistant styles but tied directly to our OneView CSS variables
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 w-full max-w-5xl mx-auto py-8">
      
      {/* ─── Header Section ─── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 flex flex-col items-center"
      >
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg relative"
            style={{ 
              background: "linear-gradient(135deg, #3b82f6, #f43f5e)",
              color: "white" 
            }}
          >
            AI
            <span 
              className="absolute -right-1 -top-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"
              style={{ borderColor: "var(--bg-primary)" }}
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Working Late, Admin 👋
          </h1>
        </div>
        
        <p className="text-sm md:text-base mb-6 max-w-2xl leading-relaxed" style={{ color: "var(--text-muted)" }}>
          I'm <span className="font-bold" style={{ color: "var(--accent-primary)" }}>OneView Assistant</span>. 
          I can write your <span className="px-1.5 py-0.5 rounded font-mono text-[11px]" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>SQL</span> , 
          <span className="px-1.5 py-0.5 rounded font-mono text-[11px] mx-1" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>VRL</span> and 
          <span className="px-1.5 py-0.5 rounded font-mono text-[11px] mx-1" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>PromQL</span> 
          — and walk you through your logs, traces, metrics and incidents across {currentApp}.
        </p>

        <div 
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium"
          style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border-primary)" }}
        >
          Signed in as <span style={{ color: "var(--text-primary)" }}>admin@baxter.com</span>
        </div>
      </motion.div>

      {/* ─── Feature Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full mb-10">
        {[
          {
            title: "Write a Query",
            desc: "SQL for logs, traces, RUM, or PromQL for metrics.",
            icon: "✏️",
            bg: "rgba(99, 102, 241, 0.1)",
            color: "#818cf8"
          },
          {
            title: "Investigate Incidents",
            desc: `Root-cause across logs, traces, alerts — e.g. "Why did gateway-5xx fire?"`,
            icon: "⚠️",
            bg: "rgba(245, 158, 11, 0.1)",
            color: "#fbbf24"
          },
          {
            title: "Build a Dashboard",
            desc: `From a topic — e.g. "K8s node health: CPU, memory, restarts". Also creates panels.`,
            icon: "🎛️",
            bg: "rgba(16, 185, 129, 0.1)",
            color: "#34d399"
          },
          {
            title: "Create an Alert",
            desc: "Threshold or scheduled alerts, and ingest-time VRL pipelines.",
            icon: "🔔",
            bg: "rgba(239, 68, 68, 0.1)",
            color: "#f87171"
          }
        ].map((card, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col text-left p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
            style={{ 
              background: "var(--bg-card)", 
              borderColor: "var(--border-primary)" 
            }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4"
              style={{ background: card.bg, color: card.color, border: `1px solid ${card.bg.replace("0.1", "0.2")}` }}
            >
              {card.icon}
            </div>
            <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{card.title}</h3>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{card.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* ─── Suggestion Chips ─── */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-12">
        <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          Or try one of these
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: `Write VRL to parse JSON from my logs`, icon: "</>" },
            { label: `Generate a regex pattern to redact PII`, icon: "</>" },
            { label: `Map my "default" stream schema`, icon: "{ }" },
            { label: `Write PromQL for pods using > 80% CPU`, icon: "📈", active: true },
            { label: `Convert this Datadog query to OneView`, icon: "↔️" },
            { label: `Why was my last alert fired?`, icon: "🕒" }
          ].map((chip, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + (i * 0.05) }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer"
              style={{
                background: chip.active ? "rgba(99, 102, 241, 0.05)" : "var(--bg-card)",
                borderColor: chip.active ? "rgba(99, 102, 241, 0.4)" : "var(--border-primary)",
                color: chip.active ? "var(--accent-primary-light)" : "var(--text-secondary)"
              }}
              onClick={() => setPrompt(chip.label)}
            >
              <span className="text-sm opacity-80">{chip.icon}</span>
              {chip.label}
              {chip.active && <span className="ml-1 opacity-70">→</span>}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── Prompt Input Box ─── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-4xl relative rounded-xl p-0.5 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f59e0b, #6366f1, #8b5cf6)",
        }}
      >
        <div 
          className="flex flex-col w-full rounded-[10px] p-2"
          style={{ background: "var(--bg-primary)" }}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask OneView Assistant anything..."
            className="w-full min-h-[60px] bg-transparent outline-none resize-none p-3 text-sm"
            style={{ color: "var(--text-primary)" }}
            rows={2}
          />
          
          <div className="flex items-center justify-between px-2 pt-2 border-t" style={{ borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-4">
              <button className="p-1.5 rounded opacity-50 hover:opacity-100 transition-opacity" title="Attach file">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              <button 
                onClick={() => setAutoNavigation(!autoNavigation)}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: autoNavigation ? "#6366f1" : "var(--text-muted)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Auto Navigation
              </button>
            </div>

            <button 
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: "#c026d3", color: "white" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "2px" }}>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
