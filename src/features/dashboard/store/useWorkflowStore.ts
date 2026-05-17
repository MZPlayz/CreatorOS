import { create } from "zustand";

interface WorkflowState {
  selectedTransactionId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  selectedTransactionId: null,
  setSelectedTransactionId: (id) => set({ selectedTransactionId: id }),
  transactions: [],
  setTransactions: (transactions) => {
    set({ transactions });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("optimistic_sync_end"));
    }
  },
}));
