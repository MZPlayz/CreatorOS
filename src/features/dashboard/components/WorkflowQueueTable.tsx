import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "../store/useWorkflowStore";

export function WorkflowQueueTable() {
  const { transactions, setSelectedTransactionId } = useWorkflowStore();

  return (
    <div className="flex-1 overflow-auto p-0">
      <table className="w-full text-left text-xs font-mono min-w-[600px] border-collapse">
        <thead className="bg-[#050505] sticky top-0 z-10">
          <tr className="text-zinc-500 border-b border-zinc-800">
            <th className="px-3 py-2 font-normal whitespace-nowrap">TIMESTAMP</th>
            <th className="px-3 py-2 font-normal">DATA SOURCE</th>
            <th className="px-3 py-2 font-normal">AMOUNT</th>
            <th className="px-3 py-2 font-normal">MATCH CONF.</th>
            <th className="px-3 py-2 font-normal text-right">STATUS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/40">
          <AnimatePresence initial={false}>
            {transactions.map((tx) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, y: -20, backgroundColor: "rgba(16, 185, 129, 0.2)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "transparent" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", backgroundColor: { duration: 1.5, delay: 0.5 } }}
                onClick={() => setSelectedTransactionId(tx.id)}
                className="hover:bg-zinc-800/40 transition-colors cursor-pointer group relative"
              >
                <td className="px-3 py-2 text-zinc-500 whitespace-nowrap relative">
                  {new Date(tx.createdAt).toISOString().split("T")[1].slice(0, 8)}
                </td>
                <td className="px-3 py-2 text-zinc-300">{tx.description.substring(0, 20)}</td>
                <td className="px-3 py-2 text-zinc-300">${tx.amount.toFixed(2)}</td>
                <td className="px-3 py-2">
                  {tx.reconciled && tx.confidenceScore ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full",
                            tx.confidenceScore > 0.85 ? "bg-indigo-500" : "bg-zinc-500"
                          )}
                          style={{ width: `${Math.max(10, tx.confidenceScore * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {(tx.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-600">--</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {tx.reconciled ? (
                    <span className="text-emerald-500 uppercase text-[9px] font-bold">
                      Resolved
                    </span>
                  ) : (
                    <span className="text-zinc-500 uppercase text-[9px] font-bold">
                      Pending
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
          {transactions.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-3 py-6 text-center text-zinc-600 border-b border-zinc-800/40"
              >
                No transactions in queue. Run a simulation.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
