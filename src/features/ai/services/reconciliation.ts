import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  number: string;
}

export interface ReconciliationResult {
  matchId: string | null;
  confidence: number;
  reasoning: string;
}

/**
 * AI Agent Reconciliation Service
 * Uses Gemini to match bank descriptions with invoice metadata.
 */
export async function reconcileTransaction(
  transaction: Transaction,
  potentialInvoices: Invoice[]
): Promise<ReconciliationResult> {
  // In a real production app, we would query the database for the most likely invoices first.
  
  const prompt = `
    You are an expert financial reconciliation agent.
    
    TASK: Match a bank transaction description to one of the provided invoices.
    
    TRANSACTION:
    - Description: "${transaction.description}"
    - Amount: $${transaction.amount}
    - Date: ${transaction.date}
    
    INVOICES:
    ${potentialInvoices.map(inv => `- ID: ${inv.id}, Number: ${inv.number}, Client: ${inv.clientName}, Amount: $${inv.amount}`).join("\n")}
    
    LOGIC:
    - Look for matching invoice numbers (e.g. INV-001) in the description.
    - Look for client names or partial matches.
    - Check if the amounts match exactly or are close.
    - High confidence matches should have exact amount matches AND a text reference.
    
    Respond in JSON format with matchId, confidence (0.0 to 1.0), and reasoning.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchId: { type: Type.STRING, description: "The ID of the matched invoice or null" },
            confidence: { type: Type.NUMBER, description: "Confidence level of the match" },
            reasoning: { type: Type.STRING, description: "Reasoning for the match choice" },
          },
          required: ["matchId", "confidence", "reasoning"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      matchId: result.matchId || null,
      confidence: result.confidence || 0,
      reasoning: result.reasoning || "Could not determine match.",
    };
  } catch (error) {
    console.error("AI Reconciliation Error:", error);
    return {
      matchId: null,
      confidence: 0,
      reasoning: "AI Service failure during reconciliation.",
    };
  }
}
