# CreatorOS

CreatorOS is an intelligent financial reconciliation platform. It processes incoming transactions (webhooks), matches them contextually to open invoices via a deterministic AI agent, and streams live telemetry to a dense, operational dashboard.

## Technical Architecture

The system uses a decoupled, event-driven queue architecture feeding into an AI reconciler.

```ascii
                      ┌───────────────────────┐
                      │    External Source    │
                      │ (Stripe, Mercury, etc)│
                      └───────────┬───────────┘
                                  │ Webhook (POST /api/ai/reconcile)
                                  ▼
                      ┌───────────────────────┐
                      │    Express Backend    │
                      │   (Webhook Handler)   │
                      └───────────┬───────────┘
                                  │ 1. Upsert Raw Transaction
                                  │ 2. Add to In-Memory Queue
                                  ▼
                      ┌───────────────────────┐
                      │   Queue Processor     │
                      │  (Concurrency Limit)  │
                      └───────────┬───────────┘
                                  │ Execute Job
                                  ▼
┌──────────────────┐  Context ┌───────────────────────┐ 
│  Postgres DB     │ ◄─────── │   Agentic Reconciler  │ 
│ (Open Invoices)  │          │   (Gemini 3.1 Pro)    │ 
└──────────────────┘          └───────────┬───────────┘ 
                                          │ Emit Micro-logs (SSE)
                                          ▼
                      ┌───────────────────────┐
                      │   System Event Bus    │
                      │  (Node.js EventEmitter)
                      └───────────┬───────────┘
                                  │ Server-Sent Events (SSE)
                                  ▼
                      ┌───────────────────────┐
                      │   CreatorOS Frontend  │
                      │ (React + Vite + tailwind)
                      └───────────────────────┘
```

## System Limitations & Future Optimizations

1. **Queue Persistence**: Currently, the QueueProcessor is in-memory. In a multi-node production deployment, this should be replaced with a persistent queue like Redis (BullMQ / Celery) or AWS SQS to ensure zero task loss during container restarts.
2. **SSE Reconnection**: The Server-Sent Events implementation lacks a robust heartbeat and automatic backoff/reconnection strategy.
3. **Database Scale**: The fuzzy search API for manual overrides uses \`contains: ... mode: insensitive\`. At millions of rows, this requires a Postgres \`pg_trgm\` index or transitioning search to Elasticsearch/Typesense.
4. **E2E Testing**: Add Playwright test suites spanning the entire flow (mocking the webhook -> verifying the dashboard updates automatically over SSE -> executing a manual override).
5. **AI Temperature/Prompting Checkpoints**: Implement versions for prompts, so we can A/B test reconciliation accuracy across multiple models or system instructions.

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Motion, Zustand, shadcn/ui.
- **Backend**: Node.js, Express, Prisma ORM, Server-Sent Events.
- **Database**: PostgreSQL.
- **AI**: Google Gemini API (@google/genai).   
