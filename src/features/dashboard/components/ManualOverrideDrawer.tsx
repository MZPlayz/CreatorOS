import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { RefreshCcw, Hand, Search, AlertTriangle } from "lucide-react";
import { TerminalCore } from "./TerminalCore";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "../store/useWorkflowStore";

export function ManualOverrideDrawer() {
  const { selectedTransactionId, setSelectedTransactionId, setTransactions } = useWorkflowStore();
  const transactionId = selectedTransactionId;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [manualInvoiceId, setManualInvoiceId] = useState("");
  
  // Fuzzy Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    if (transactionId) {
      setLoading(true);
      fetch(`/api/transactions/${transactionId}`)
        .then(res => res.json())
        .then(res => {
          setData(res);
          setLoading(false);
          // Auto-populate selected invoice if it was matched
          if (res.invoice) {
              setSelectedInvoice(res.invoice);
              setManualInvoiceId(res.invoice.id);
          } else {
              setSelectedInvoice(null);
              setManualInvoiceId("");
          }
          setSearchQuery("");
        });
    }
  }, [transactionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        fetch(`/api/invoices/search?q=${searchQuery}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(data);
          });
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRerun = async () => {
    try {
      await fetch(`/api/transactions/${transactionId}/rerun`, { method: "POST" });
      toast.success("Agent queued for re-run");
      setSelectedTransactionId(null);
      // Trigger a refetch in OverviewPage or wait for poll
    } catch (e) {
      toast.error("Failed to rerun");
    }
  };

  const handleManualOverride = async () => {
    if (!manualInvoiceId) {
      toast.error("Please select a valid Invoice");
      return;
    }
    try {
      await fetch(`/api/transactions/${transactionId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: manualInvoiceId })
      });
      toast.success("Manual override applied");
      setSelectedTransactionId(null);
    } catch (e) {
      toast.error("Override failed");
    }
  };

  const onClose = () => setSelectedTransactionId(null);
  const hasMismatch = selectedInvoice && data ? Number(selectedInvoice.amount) !== Number(data.amount) : false;

  return (
    <Sheet open={!!transactionId} onOpenChange={(o) => (!o ? onClose() : null)}>
      <SheetContent className="bg-[#09090b] border-l border-zinc-800 text-zinc-100 sm:max-w-xl p-0 flex flex-col font-mono text-[11px]">
        <SheetHeader className="p-4 border-b border-zinc-800">
          <SheetTitle className="text-zinc-100 font-mono text-sm uppercase tracking-widest flex items-center justify-between">
            <div className="flex items-center gap-2">
              Audit Trail
              {data?.reconciled && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] rounded uppercase">Resolved</span>}
              {data && !data.reconciled && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] rounded uppercase">Pending</span>}
            </div>
            {data?.confidenceScore != null && (
              <div className="text-[10px] font-bold text-zinc-400">
                MATCH: <span className={cn(data.confidenceScore > 0.85 ? "text-indigo-400" : "text-amber-400")}>
                  {(data.confidenceScore * 100).toFixed(1)}%
                </span>
              </div>
            )}
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

            {/* Integrity Check */}
            {hasMismatch && !data.reconciled && (
               <div className="bg-red-950/80 border border-red-500/50 rounded flex items-start gap-3 p-3 text-red-500">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="uppercase font-bold tracking-widest text-[11px] mb-1">Amount Mismatch Detected</h4>
                    <p className="text-[10px] leading-relaxed text-red-400">
                      Webhook reported: <strong className="text-red-300">${data.amount}</strong><br/>
                      Invoice requires: <strong className="text-red-300">${selectedInvoice?.amount}</strong><br/>
                      Integrity check failed. You must manually override or adjust the invoice to proceed.
                    </p>
                  </div>
               </div>
            )}

            {/* Audit Logs */}
            <div className="space-y-2 flex-1">
              <div className="text-zinc-500 uppercase font-bold tracking-widest text-[10px]">Micro-Logs</div>
              <TerminalCore logs={data.logs || []} />
            </div>

            {/* Manual Intervention Tools */}
            {!data.reconciled && (
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="text-zinc-500 uppercase font-bold tracking-widest text-[10px]">Actions</div>
                
                <button onClick={handleRerun} className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 py-2 rounded text-zinc-300 transition-colors">
                  <RefreshCcw className="w-3 h-3" /> Re-run Agentic Cycle
                </button>

                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="relative isolate">
                    <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                       <Search className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <input
                      value={searchQuery}
                      onChange={(e) => {
                         setSearchQuery(e.target.value);
                         setSelectedInvoice(null);
                         setManualInvoiceId("");
                      }}
                      placeholder="Search to Override (Name, ID)..."
                      className="w-full bg-[#050505] border border-zinc-800 rounded px-8 py-2 text-zinc-300 placeholder-zinc-700 outline-none focus:border-amber-500/50"
                    />
                    
                    {searchResults.length > 0 && !selectedInvoice && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#0c0c0e] border border-zinc-800 rounded shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        {searchResults.map((inv) => (
                          <button
                            key={inv.id}
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setManualInvoiceId(inv.id);
                              setSearchQuery(`${inv.clientName} - $${inv.amount}`);
                              setSearchResults([]);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-zinc-800 border-b border-zinc-800/50 last:border-0 flex justify-between items-center group"
                          >
                            <span className="text-zinc-300 group-hover:text-amber-400">{inv.clientName} <span className="text-zinc-500 text-[10px] ml-2">({inv.id.substring(0,8)}...)</span></span>
                            <span className="text-zinc-400 font-bold">${inv.amount}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button 
                     onClick={handleManualOverride} 
                     disabled={!manualInvoiceId || hasMismatch}
                     className="w-full flex items-center justify-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                    <Hand className="w-3 h-3" /> Finalize Override
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
