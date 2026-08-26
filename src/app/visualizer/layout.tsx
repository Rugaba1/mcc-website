import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tile Visualizer — Mountain Ceramics Company",
  description: "Visualize MCC tiles on walls and floors before you buy.",
  robots: { index: false, follow: false },
};

export default function VisualizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
          <div className="text-white text-sm opacity-60 animate-pulse">Loading visualizer…</div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
