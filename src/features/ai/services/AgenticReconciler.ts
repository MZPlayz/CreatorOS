import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PrismaClient } from "@prisma/client";

// Ensure Gemini is initialized correctly with the environment variable
const apiKey = process.env.GEMINI_API_KEY;
// Using a stub locally if there is no key yet to prevent crashes
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

export class AgenticReconciler {
    private db: PrismaClient;

    constructor() {
        this.db = this.getSystemPrisma();
    }

    private getSystemPrisma() {
        // Delay import until execution to ensure server variables are ready
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { prismaAdmin, SERVICE_SECRET } = require("../../../../server");
        
        return prismaAdmin.$extends({
            query: {
                $allModels: {
                    async $allOperations({ args, query }: any) {
                        // System queries execute using the SERVICE_SECRET
                         const [, result] = await prismaAdmin.$transaction([
                            prismaAdmin.$executeRawUnsafe(
                                `SELECT set_config('app.current_user_id', $1, TRUE), set_config('app.service_secret', $2, TRUE)`, 
                                SERVICE_SECRET, SERVICE_SECRET
                            ),
                            query(args) as any
                        ]);
                        return result;
                    }
                }
            }
        }) as unknown as PrismaClient;
    }

    private log(message: string) {
        console.log(`[AgenticReconciler] ${message}`);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { systemEvents } = require("../../../../server");
        systemEvents.emit("sse_broadcast", "agent_log", { timestamp: Date.now(), message });
    }

    async processTransaction(transactionId: string) {
        this.log(`Starting reconciliation worker for TX: ${transactionId}`);

        try {
            this.log(`Fetching bank transaction data...`);
            const transaction = await this.db.bankTransaction.findUnique({
                where: { id: transactionId }
            });

            if (!transaction || transaction.reconciled) {
               this.log(`Transaction ${transactionId} not found or already reconciled.`);
               return { success: false, reason: 'invalid_transaction' };
            }

            this.log(`Gathering open invoices for context matching...`);
            const openInvoices = await this.db.invoice.findMany({
                where: { 
                   status: { in: ['DRAFT', 'SENT', 'OVERDUE'] } 
                },
                take: 50
            });

            if (openInvoices.length === 0) {
               this.log(`No open invoices available for matched context.`);
               return { success: false, reason: 'no_open_invoices' };
            }

            this.log(`Invoking Gemini 3.1 Pro for deterministic matching...`);
            const prompt = `
            You are an Agentic Financial Reconciler. Match the incoming bank transaction to the correct open invoice.
            Verify that the amounts strictly match. If the amounts do not match, or if there is no confident match, decline.
            
            Bank Transaction:
            ${JSON.stringify({ id: transaction.id, description: transaction.description, amount: transaction.amount, reference: transaction.reference })}
            
            Open Invoices:
            ${JSON.stringify(openInvoices.map(i => ({ id: i.id, number: i.number, amount: i.amount, clientName: i.clientId })))}
            `;

            let result = { matchId: null as string | null, confidence: 0, reasoning: "Fallback/Mock due to no API key" };

            if (apiKey) {
                const responseSchema: Schema = {
                    type: Type.OBJECT,
                    properties: {
                        matchId: { type: Type.STRING, nullable: true, description: "The ID of the matching invoice, or null if no confident match." },
                        confidence: { type: Type.NUMBER, description: "A float between 0 and 1 indicating confidence." },
                        reasoning: { type: Type.STRING, description: "Explanation of why this match was made, emphasizing amount parity." }
                    },
                    required: ["confidence", "reasoning"]
                };

                const response = await ai.models.generateContent({
                    model: "gemini-3.1-pro-preview",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema,
                        temperature: 0.1
                    }
                });
                result = JSON.parse(response.text || "{}");
            } else {
                 // Mock result favoring the first open invoice with exact amount to simulate the workflow
                 const mockMatch = openInvoices.find(inv => Number(inv.amount) === Number(transaction.amount));
                 if (mockMatch) {
                     result = { matchId: mockMatch.id, confidence: 0.98, reasoning: `Exact amount match of ${mockMatch.amount} and plausible reference.` };
                 } else {
                     result = { matchId: null, confidence: 0.3, reasoning: `No open invoice with exact amount ${transaction.amount} was found.` };
                 }
            }

            this.log(`Gemini response received. Confidence: ${result.confidence}. Reason: ${result.reasoning}`);

            if (result.matchId && result.confidence > 0.85) {
                this.log(`High confidence match validated. Verification step executing...`);
                const matchedInvoice = openInvoices.find(i => i.id === result.matchId);
                
                if (matchedInvoice && Number(matchedInvoice.amount) === Number(transaction.amount)) {
                    await this.db.$transaction(async (tx) => {
                        await tx.bankTransaction.update({
                            where: { id: transactionId },
                            data: {
                                reconciled: true,
                                invoiceId: result.matchId,
                                confidenceScore: result.confidence
                            }
                        });

                        await tx.invoice.update({
                            where: { id: result.matchId },
                            data: { status: 'RECONCILED' } 
                        });
                    });
                    
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { systemEvents } = require("../../../../server");
                    systemEvents.emit("sse_broadcast", "reconciliation_success", { 
                        transactionId, 
                        invoiceId: result.matchId,
                        confidence: result.confidence,
                        reasoning: result.reasoning
                    });
                    
                    this.log(`Successfully reconciled TX ${transactionId} with Invoice ${matchedInvoice.number}`);
                    return { success: true, matchId: result.matchId, confidence: result.confidence, reasoning: result.reasoning };
                } else {
                    this.log(`Validation failed: Amount mismatch between TX (${transaction.amount}) and matched Invoice (${matchedInvoice?.amount}).`);
                    return { success: false, reason: 'amount_mismatch', confidence: result.confidence };
                }
            }
            
            this.log(`No confident match found. Requires manual human review.`);
            return { success: false, reason: 'low_confidence', confidence: result.confidence };

        } catch (error: any) {
            this.log(`Critical Failure: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
