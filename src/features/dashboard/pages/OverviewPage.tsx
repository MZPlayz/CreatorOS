import * as React from "react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import { ManualOverrideDrawer } from "../components/ManualOverrideDrawer";
import { WorkflowQueueTable } from "../components/WorkflowQueueTable";
import { useWorkflowStore } from "../store/useWorkflowStore";

const stats = [
  { label: "Annual Recurring Revenue", value: "$184,200.00", trend: "+12.4%", trendColor: "text-emerald-400" },
  { label: "Agent Reconciliations", value: "842", trend: "99.8% ACC", trendColor: "text-indigo-400" },
  { label: "Pending Invoices", value: "14", trend: "$4.2K DUE", trendColor: "text-amber-400" },
  { label: "Infrastructure Cost", value: "$204.12", trend: "NEON DB", trendColor: "text-zinc-500" },
];

export default function OverviewPage() {
  const { setTransactions } = useWorkflowStore();
  const [dbLatency, setDbLatency] = useState<number>(14);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([2,3,4,6,5,3,4,2,1,4,6,4,3,2]);

  const fetchTransactions = () => {
    fetch("/api/transactions")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTransactions(data);
      });
  };

  const pingDb = () => {
    fetch("/api/health/db")
      .then(res => res.json())
      .then(data => {
        if (data && data.latencyMs) {
           setDbLatency(data.latencyMs);
           const h = Math.max(1, Math.min(10, Math.ceil(data.latencyMs / 5)));
           setLatencyHistory(prev => [...prev.slice(-13), h]);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTransactions();
    pingDb();
    
    const handleSyncComplete = () => fetchTransactions();
    window.addEventListener("ai_reconciliation_complete", handleSyncComplete);
    
    // Poll loosely
    const intervalId = setInterval(fetchTransactions, 3000);
    const pingId = setInterval(pingDb, 30000);
    return () => {
      window.removeEventListener("ai_reconciliation_complete", handleSyncComplete);
      clearInterval(intervalId);
      clearInterval(pingId);
    };
  }, []);

  return (
    <div className="space-y-6">
      <ManualOverrideDrawer />
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:h-24">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between hover:border-zinc-700 h-24 lg:h-auto"
          >
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-mono font-bold tracking-tighter">{stat.value}</span>
              <span className={cn("text-[10px] font-medium", stat.trendColor)}>{stat.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[500px]">
        {/* AI Reconciliation Log (High Density) */}
        <div className="lg:col-span-2 border border-zinc-800 rounded-xl bg-zinc-900/20 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-[#0c0c0e]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">Agentic Workflow Queue</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] border border-emerald-500/20 font-medium">Real-time Active</span>
            </div>
          </div>
          <WorkflowQueueTable />
        </div>

        {/* System Health / Mini Performance */}
        <div className="col-span-1 space-y-6">
          <button 
            onClick={async () => {
              window.dispatchEvent(new Event("optimistic_sync_start"));
              const res = await fetch("/api/ai/reconcile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  transaction: { id: "STRIPE-FE-" + Date.now(), description: "INV-2026-004 Payment", amount: 1500 },
                  invoices: [{ id: "inv-2026", number: "INV-2026-004", amount: 1500 }]
                })
              });
              console.log("Queued worker:", await res.json());
              fetchTransactions();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-emerald-200" /> Simulate Webhook
          </button>
          <div className="border border-zinc-800 rounded-xl bg-[#0c0c0e] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">Node Health</span>
              <span className="text-[10px] text-zinc-500">US-EAST-1</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-zinc-400">API Performance</span>
                  <span className="text-white font-mono">{dbLatency}ms</span>
                </div>
                <div className="flex gap-0.5 h-6 items-end">
                  {latencyHistory.map((h, i) => (
                    <div key={i} className={`w-1 bg-indigo-500/${Math.min(90, Math.max(10, h * 10))} transition-all duration-300`} style={{ height: `${h * 8}%` }}></div>
                   ))}
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc-400">Neon DB RLS Security</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">WebSocket Handshake</span>
                  <span className="text-[11px] text-emerald-500 font-mono">Connected</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border border-zinc-800 rounded-xl bg-gradient-to-br from-indigo-900/20 to-zinc-900/40 p-5 border-l-2 border-l-indigo-500">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1.5 bg-indigo-500 rounded text-white flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold block mb-1">AI Agent Insight</span>
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  Current invoicing velocity suggests you will hit your <span className="text-indigo-300 font-bold tracking-tight">$200K ARR target</span> by Oct 24th if CRM conversion remains above 4.2%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



