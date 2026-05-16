import { z } from "zod";

export const invoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  amount: z.number({ invalid_type_error: "Must be a valid number" }).positive("Amount must be greater than zero"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
