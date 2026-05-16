import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma
const prisma = new PrismaClient();

// High-Performance "Row Level Security" using Prisma Client Extensions (Mock implementation)
// In Neon/Postgres, this would translate to:
// await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, TRUE)`
function getPrismaForUser(userId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, model }) {
          // Automatic tenant scoping for all relevant queries to prevent data leakage
          // This ensures developers cannot accidentally fetch another user's data
          if (["Invoice", "Project", "Client", "BankTransaction"].includes(model)) {
            args.where = { ...args.where, ownerId: userId };
          }
           // MOCK: Since we don't have a real DB running, we return mock data just to complete the scaffolding
           // Normally we would `return query(args);`
           if (model === "Invoice") {
             if (args.where?.id) {
               return [{ id: args.where.id, number: "MOCK-1", amount: 1200 }];
             }
           }
           return query(args);
        },
      },
    },
  }) as unknown as typeof prisma;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      prisma: typeof prisma;
      userId: string;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // RLS Middleware
  app.use((req, res, next) => {
    // In production, parse this from a verified JWT or Session Token
    const userId = (req.headers["x-user-id"] || "user_clq9x") as string;
    req.userId = userId;
    req.prisma = getPrismaForUser(userId);
    next();
  });

  // Server-Sent Events (SSE) Endpoint for Real-time Updates
  const sseClients = new Set<express.Response>();
  
  app.get("/api/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    // Send immediate ping
    res.write("event: connected\ndata: {}\n\n");
    
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
  });

  function broadcastEvent(eventName: string, data: any) {
    for (const client of sseClients) {
      client.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "2026.1" });
  });

  // Mock Optimistic Creation Endpoint
  app.post("/api/invoices", async (req, res) => {
    const data = req.body;
    // Simulate latency
    setTimeout(() => {
      res.json({
        id: `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: "DRAFT",
        ...data,
        createdAt: new Date().toISOString()
      });
    }, 400); // 400ms server response
  });

  // Background Worker Reconciler Stub
  app.post("/api/ai/reconcile", async (req, res) => {
    const { transaction, invoices } = req.body;
    
    // Ack immediately to frontend queue
    res.json({ status: "queued", transactionId: transaction.id });
    
    // Simulate isolated background worker
    setTimeout(() => {
      console.log(`[Worker] Executing reconciliation plan for TTL: ${transaction.id}`);
      
      const payload = {
        transactionId: transaction.id,
        match: invoices[0] || null,
        confidence: 0.98,
        reasoning: "Strict metadata reference identified in Stripe payload.",
        status: "completed"
      };
      
      broadcastEvent("reconciliation_success", payload);
    }, 2500); // Background job takes 2.5 seconds
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CreatorOS Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
