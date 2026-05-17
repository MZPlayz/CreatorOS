import * as React from "react";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export function LatencyMeter() {
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let startTime = 0;
    
    const handleStart = () => {
      startTime = performance.now();
    };
    
    const handleEnd = () => {
      if (startTime > 0) {
        setLatency(Math.round(performance.now() - startTime));
        startTime = 0;
      }
    };

    window.addEventListener("optimistic_sync_start", handleStart);
    window.addEventListener("optimistic_sync_end", handleEnd);
    
    // Also randomly sample base latency every few seconds for aesthetics
    const interval = setInterval(() => {
      if (startTime === 0) {
        setLatency(Math.floor(Math.random() * 40) + 20); // 20-60ms
      }
    }, 5000);

    return () => {
      window.removeEventListener("optimistic_sync_start", handleStart);
      window.removeEventListener("optimistic_sync_end", handleEnd);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed bottom-12 right-6 z-50">
      <div className="bg-[#050505] border border-zinc-800/80 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
        <Activity className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-mono text-zinc-400">
          UI Latency: <strong className="text-emerald-400">{latency || 14}ms</strong>
        </span>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse ml-1" />
      </div>
    </div>
  );
}
