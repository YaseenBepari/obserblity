"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (document.documentElement.classList.contains("theme-light")) {
      setIsLight(true);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isLight) {
      root.classList.remove("theme-light");
      setIsLight(false);
    } else {
      root.classList.add("theme-light");
      setIsLight(true);
    }
  };

  if (!mounted) return <div className="w-[52px] h-6" />;

  return (
    <button
      onClick={toggleTheme}
      title="Toggle Light/Dark Theme"
      className="relative flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300"
      style={{
        width: "52px",
        height: "26px",
        border: "1px solid #e2e8f0",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
        background: isLight ? "#ffffff" : "#1e293b",
        borderColor: isLight ? "#e2e8f0" : "#334155"
      }}
    >
      <span className="absolute left-1.5 text-[10px] select-none pointer-events-none">☀️</span>
      <span className="absolute right-1.5 text-[10px] select-none pointer-events-none text-slate-300">🌙</span>
      
      <motion.div
        layout
        className="w-[18px] h-[18px] rounded-full shadow-sm z-10 flex items-center justify-center"
        style={{
          background: isLight ? "#0f172a" : "#ffffff",
        }}
        animate={{ x: isLight ? 0 : 24 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
