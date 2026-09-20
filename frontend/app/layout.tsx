import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneView — Unified Observability Platform",
  description:
    "Centralised observability and admin intelligence dashboard for Baxter International's internal application ecosystem. Monitor Netra, Kavacha, and Blackline from a single pane of glass.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
