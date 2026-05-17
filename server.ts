import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { PrismaClient, Prisma } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global Admin Client (No RLS) -> Used ONLY for systemic tasks or verify-checks 
export const prismaAdmin = new PrismaClient();

import { AsyncLocalStorage } from "async_hooks";
import { EventEmitter } from "events";
export const requestContext = new AsyncLocalStorage<{ userId: string }>();

export const systemEvents = new EventEmitter();
export const SERVICE_SECRET = process.env.SERVICE_SECRET || "default_service_secret_uuid";

// High-Performance Native Postgres RLS via Prisma Client Extensions
function getPrismaForUser(userId: string) {
  if (userId === SERVICE_SECRET) {
      throw new Error("Forbidden: Cannot masquerade as service role.");
  }
  return prismaAdmin.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Optimization: By executing set_config in a block, it costs one round trip.
          // To truly optimize connection pools, you'd use Prisma's interactive transactions
          // OR an extended PgBouncer setup. For here, we enforce `is_local = TRUE`.
          const [, result] = await prismaAdmin.$transaction([
            prismaAdmin.$executeRawUnsafe(
                `SELECT set_config('app.current_user_id', $1, TRUE), set_config('app.service_secret', $2, TRUE)`, 
                userId, 
                SERVICE_SECRET
            ),
            query(args) as any
          ]);
          return result;
        },
      },
    },
  }) as unknown as PrismaClient; // Cast to bypass complex type inference
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
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

  systemEvents.on("sse_broadcast", (eventName, data) => {
    broadcastEvent(eventName, data);
  });

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

  // Background Worker Reconciler
  app.post("/api/ai/reconcile", async (req, res) => {
    const { transaction } = req.body;
    
    // Ack immediately to frontend queue
    res.json({ status: "queued", transactionId: transaction.id });
    
    // Asynchronously call the actual worker process
    setTimeout(async () => {
      // Lazy load to avoid circular dependencies during boot
      const { AgenticReconciler } = await import("./src/features/ai/services/AgenticReconciler.js");
      const reconciler = new AgenticReconciler();
      await reconciler.processTransaction(transaction.id);
    }, 0);
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

  // ----------------------------------------------------------------------
  // CENTRALIZED ERROR HANDLING MIDDLEWARE & RLS LEAK DETECTOR
  // ----------------------------------------------------------------------
  app.use(async (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Error Middleware] Caught error on ${req.method} ${req.url}`);
    
    // Check if the error is a Prisma "Record Not Found" error
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
       // A required record was not found. This could be a 404 OR an RLS security violation.
       
       const modelName = (err.meta?.modelName as string) || "Record";
       const requestedId = req.params?.id || req.body?.id;
       
       if (requestedId && modelName) {
         try {
           // Use the ADMIN client (bypassing RLS) to see if the record ACTUALLY exists
           // This requires lowercase model name to match Prisma's delegate properties (e.g. prismaAdmin.invoice)
           const modelDelegate = (prismaAdmin as any)[modelName.toLowerCase()];
           if (modelDelegate && typeof modelDelegate.findUnique === 'function') {
               const existsGlobally = await modelDelegate.findUnique({ where: { id: requestedId } });
               
               if (existsGlobally) {
                  // SECURITY VIOLATION! Record exists, but RLS hid it from this user.
                  console.error(`[SECURITY ALERT] User ${req.userId} attempted to access ${modelName} ${requestedId} belonging to another tenant!`);
                  // Log the violation to SIEM/Audit Logging tool here
                  
                  // Return a generic 404 to the client to obscure existence
                  res.status(404).json({ error: "Not Found", message: `${modelName} not found` });
                  return;
               }
           }
         } catch (adminErr) {
           console.error("Admin client check failed", adminErr);
         }
       }
       
       // Standard 404
       res.status(404).json({ error: "Not Found", message: `${modelName} not found.` });
       return;
    }

    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CreatorOS Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
