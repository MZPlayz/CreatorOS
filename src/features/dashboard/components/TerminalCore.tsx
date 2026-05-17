import React from "react";
import { cn } from "@/lib/utils";

interface TerminalCoreProps {
  logs: any[];
}

export function TerminalCore({ logs }: TerminalCoreProps) {
  // Cap at 100 logs
  const displayLogs = [...logs].slice(-100);

  return (
    <div className="bg-[#050505] border border-zinc-800 rounded h-64 overflow-y-auto p-2 space-y-1 flex flex-col-reverse font-mono text-[10px]">
      <div className="flex flex-col justify-end min-h-full">
        {displayLogs.length > 0 ? (
          displayLogs.map((log: any) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-zinc-600 w-16 flex-shrink-0">
                {new Date(log.timestamp).toISOString().split("T")[1].slice(0, 8)}
              </span>
              <span
                className={cn(
                  "flex-1",
                  log.level === "ERROR"
                    ? "text-red-400"
                    : log.level === "WARN"
                    ? "text-amber-400"
                    : "text-zinc-300"
                )}
              >
                {log.message}
              </span>
            </div>
          ))
        ) : (
          <div className="text-zinc-600 italic">No logs available for this transaction.</div>
        )}
      </div>
    </div>
  );
}
