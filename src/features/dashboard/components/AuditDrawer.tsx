import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { RefreshCcw, Hand } from "lucide-react";

interface AuditDrawerProps {
  transactionId: string | null;
  onClose: () => void;
}

export function AuditDrawer({ transactionId, onClose }: AuditDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [manualInvoiceId, setManualInvoiceId] = useState("");

  useEffect(() => {
    if (transactionId) {
      setLoading(true);
      fetch(`/api/transactions/${transactionId}`)
        .then(res => res.json())
        .then(res => {
          setData(res);
          setLoading(false);
        });
    }
  }, [transactionId]);

  const handleRerun = async () => {
    try {
      await fetch(`/api/transactions/${transactionId}/rerun`, { method: "POST" });
      toast.success("Agent queued for re-run");
      onClose();
    } catch (e) {
      toast.error("Failed to rerun");
    }
  };

  const handleManualOverride = async () => {
    if (!manualInvoiceId) {
      toast.error("Please enter a valid Invoice ID");
      return;
    }
    try {
      await fetch(`/api/transactions/${transactionId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: manualInvoiceId })
      });
      toast.success("Manual override applied");
      onClose();
    } catch (e) {
      toast.error("Override failed");
    }
  };

  return (
    <Sheet open={!!transactionId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-[#09090b] border-l border-zinc-800 text-zinc-100 sm:max-w-xl p-0 flex flex-col font-mono text-[11px]">
        <SheetHeader className="p-4 border-b border-zinc-800">
          <SheetTitle className="text-zinc-100 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
            Audit Trail
            {data?.reconciled && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] rounded uppercase">Resolved</span>}
            {data && !data.reconciled && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] rounded uppercase">Pending</span>}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="p-4 text-zinc-500">Loading payload & logs...</div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            
            {/* Raw Data Panel */}
            <div className="space-y-2">
              <div className="text-zinc-500 uppercase font-bold tracking-widest text-[10px]">Raw Webhook Payload</div>
              <div className="bg-[#050505] border border-zinc-800 rounded p-2 overflow-x-auto text-emerald-500 font-mono text-[10px] leading-tight">
                <pre>{JSON.stringify({ 
                  id: data.id, 
                  amount: data.amount,
                  date: data.date,
                  description: data.description,
                  reference: data.reference,
                  rawMetadata: data.rawMetadata 
                }, null, 2)}</pre>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="space-y-2 flex-1">
              <div className="text-zinc-500 uppercase font-bold tracking-widest text-[10px]">Micro-Logs</div>
              <div className="bg-[#050505] border border-zinc-800 rounded h-64 overflow-y-auto p-2 space-y-1">
                {data.logs && data.logs.length > 0 ? data.logs.map((log: any) => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-zinc-600 w-16 flex-shrink-0">{new Date(log.timestamp).toISOString().split('T')[1].slice(0, 8)}</span>
                    <span className={`flex-1 ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-amber-400' : 'text-zinc-300'}`}>
                      {log.message}
                    </span>
                  </div>
                )) : (
                  <div className="text-zinc-600 italic">No logs available for this transaction.</div>
                )}
              </div>
            </div>

            {/* Manual Intervention Tools */}
            {!data.reconciled && (
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="text-zinc-500 uppercase font-bold tracking-widest text-[10px]">Actions</div>
                
                <button onClick={handleRerun} className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 py-2 rounded text-zinc-300 transition-colors">
                  <RefreshCcw className="w-3 h-3" /> Re-run Agentic Cycle
                </button>

                <div className="flex gap-2 isolate pt-2">
                  <input
                    value={manualInvoiceId}
                    onChange={(e) => setManualInvoiceId(e.target.value)}
                    placeholder="Enter Invoice ID..."
                    className="flex-1 bg-[#050505] border border-zinc-800 rounded px-2 text-zinc-300 placeholder-zinc-700 outline-none focus:border-amber-500/50"
                  />
                  <button onClick={handleManualOverride} className="flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 px-3 rounded transition-colors">
                    <Hand className="w-3 h-3" /> Override
                  </button>
                </div>
                
              </div>
            )}
          </div>
        ) : null}

      </SheetContent>
    </Sheet>
  );
}
