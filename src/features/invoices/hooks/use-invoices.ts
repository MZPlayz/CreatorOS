import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InvoiceFormValues } from "../schemas/invoice";

export function useInvoices() {
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      // Stub for actual API call
      // return fetch("/api/invoices").then(res => res.json());
      return [];
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (newInvoice: InvoiceFormValues) => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoice),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    },
    onMutate: async (newInvoice) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["invoices"] });

      // Snapshot the previous value
      const previousInvoices = queryClient.getQueryData(["invoices"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["invoices"], (old: any) => [
        {
          id: `temp-${Date.now()}`,
          status: "DRAFT",
          ...newInvoice,
          createdAt: new Date().toISOString(),
        },
        ...(old || []),
      ]);

      // Return a context object with the snapshotted value
      return { previousInvoices };
    },
    onError: (err, newInvoice, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["invoices"], context?.previousInvoices);
    },
    onSettled: () => {
      // Always refetch after error or success to synchronize with server
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return {
    invoices: invoicesQuery.data || [],
    isLoading: invoicesQuery.isLoading,
    createInvoice,
  };
}
