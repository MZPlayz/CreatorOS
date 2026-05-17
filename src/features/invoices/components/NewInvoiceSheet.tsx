import * as React from "react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { EVENT_NEW_INVOICE } from "@/lib/events";
import { useInvoices } from "../hooks/use-invoices";
import { invoiceSchema, InvoiceFormValues } from "../schemas/invoice";

export function NewInvoiceSheet() {
  const [open, setOpen] = useState(false);
  const createInvoice = useInvoices((state) => state.createInvoice);
  
  // Basic state for the form, you'd use react-hook-form in production
  const [formData, setFormData] = useState<Partial<InvoiceFormValues>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener(EVENT_NEW_INVOICE, handleOpen);
    return () => window.removeEventListener(EVENT_NEW_INVOICE, handleOpen);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Zod validation
    const result = invoiceSchema.safeParse({
      ...formData,
      amount: Number(formData.amount)
    });

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        formattedErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    
    // Execute optimistic update mutation
    createInvoice.mutate(result.data, {
      onSuccess: () => {
        setOpen(false);
        setFormData({});
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="bg-[#09090b] border-l border-zinc-800 text-zinc-100 sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-zinc-100">Create New Invoice</SheetTitle>
          <SheetDescription className="text-zinc-400">
            Generate an automated invoice for your client.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Client Name</label>
            <input 
              type="text"
              value={formData.clientName || ""}
              onChange={e => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Acme Corp"
            />
            {errors.clientName && <p className="text-[10px] text-red-400">{errors.clientName}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Amount ($)</label>
            <input 
              type="number"
              value={formData.amount || ""}
              onChange={e => setFormData({ ...formData, amount: e.target.value as any })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="5000.00"
            />
            {errors.amount && <p className="text-[10px] text-red-400">{errors.amount}</p>}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Due Date</label>
            <input 
              type="date"
              value={formData.dueDate || ""}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {errors.dueDate && <p className="text-[10px] text-red-400">{errors.dueDate}</p>}
          </div>

          <div className="space-y-1.5 mb-6">
             <label className="text-xs font-semibold text-zinc-300">Description (Optional)</label>
             <textarea 
                value={formData.description || ""}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                placeholder="Consulting services for Q3..."
             />
          </div>

          <button 
            type="submit" 
            disabled={createInvoice.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {createInvoice.isPending ? "Creating..." : "Save Invoice"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
