import { create } from "zustand";
import { toast } from "sonner";
import { InvoiceFormValues } from "../schemas/invoice";

interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  description?: string;
  status: "DRAFT" | "SENT" | "OVERDUE" | "RECONCILED";
  createdAt: string;
}

interface InvoicesState {
  invoices: Invoice[];
  isLoading: boolean;
  createInvoice: {
    mutate: (newInvoice: InvoiceFormValues, options?: { onSuccess?: () => void }) => Promise<void>;
    isPending: boolean;
  };
  updateInvoiceStatus: (id: string, newStatus: Invoice["status"]) => Promise<void>;
}

export const useInvoices = create<InvoicesState>((set, get) => ({
  invoices: [],
  isLoading: false,

  createInvoice: {
    isPending: false,
    mutate: async (newInvoice, options) => {
      set((state) => ({ createInvoice: { ...state.createInvoice, isPending: true } }));
      
      const previousInvoices = get().invoices;
      
      const optimisticId = `temp-${Date.now()}`;
      const optimisticInvoice: Invoice = {
        id: optimisticId,
        status: "DRAFT",
        clientName: newInvoice.clientName,
        amount: Number(newInvoice.amount),
        dueDate: newInvoice.dueDate,
        description: newInvoice.description || "",
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        invoices: [optimisticInvoice, ...state.invoices]
      }));

      try {
        window.dispatchEvent(new Event("optimistic_sync_start"));
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newInvoice),
        });

        if (!res.ok) throw new Error("Failed to create invoice");
        
        const createdInvoice = await res.json();
        
        set((state) => ({
          invoices: state.invoices.map((inv) => 
            inv.id === optimisticId ? createdInvoice : inv
          )
        }));
        window.dispatchEvent(new Event("optimistic_sync_end"));

        if (options?.onSuccess) {
          options.onSuccess();
        }
      } catch (error) {
        set({ invoices: previousInvoices });
        toast.error("Sync Failed", { description: "Failed to create invoice. Reverted to previous state." });
      } finally {
        set((state) => ({ createInvoice: { ...state.createInvoice, isPending: false } }));
      }
    }
  },

  updateInvoiceStatus: async (id, newStatus) => {
    const previousInvoice = get().invoices.find(inv => inv.id === id);
    if (!previousInvoice) return;
    
    // Optimistic update
    set((state) => ({
      invoices: state.invoices.map(inv => 
        inv.id === id ? { ...inv, status: newStatus } : inv
      )
    }));

    try {
      window.dispatchEvent(new Event("optimistic_sync_start"));
      const res = await fetch(`/api/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      window.dispatchEvent(new Event("optimistic_sync_end"));
    } catch (error) {
      set((state) => ({
        invoices: state.invoices.map(inv => 
          inv.id === id ? previousInvoice : inv
        )
      }));
      toast.error("Sync Failed", { description: "Failed to update invoice status. Reverted change." });
    }
  }
}));
