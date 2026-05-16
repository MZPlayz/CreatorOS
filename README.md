# CreatorOS

## Overview
CreatorOS is an opinionated, high-performance business operating system designed for the "Company of One." It eliminates the "blank slate" problem by providing pre-engineered, high-speed workflows for CRM, automated invoicing, agentic AI reconciliation, and performance analytics. 

## Features
- **High-Density Dashboard**: A Linear-style, glassmorphism UI optimized for speed and data density.
- **Agentic AI Reconciliation**: Automatically match bank transactions to invoices using metadata, powered by Google Gemini.
- **Optimistic UI Updates**: Sub-100ms interactions using TanStack Query. Invoices and data update instantly before server acknowledgment.
- **Real-Time Event Streaming**: Server-Sent Events (SSE) to sync background worker processes (like AI matching) with the frontend.
- **CMD+K Command Palette**: Fast, keyboard-first navigation and rapid invoice creation via a slide-over sheet.
- **Row-Level Security (RLS)**: Enforced tenant isolation using Prisma Client Extensions at the middleware layer.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion (Framer Motion), TanStack Query, Zod
- **Backend**: Node.js/Express (Full-Stack TypeScript), Server-Sent Events (SSE)
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **AI/LLM**: Google Gemini (`@google/genai` SDK)

## Architecture
CreatorOS utilizes a Vertical Slice / Feature-based architecture. Instead of separating files strictly by technical roles (e.g., all hooks in one folder), the app groups logic by domain (e.g., `features/dashboard`, `features/invoices`). 
The backend utilizes Express middleware integrated with Prisma Client Extensions to simulate Zero-Trust Row-Level Security, effectively ensuring cross-tenant data leakage is structurally impossible.

## Screenshots
> *(Add your screenshots here)*
> 
> `![CreatorOS Dashboard Overview](./docs/dashboard.png)`
> `![CreatorOS AI Reconciliation](./docs/ai-reconciliation.png)`
> `![CreatorOS CMD+K Palette](./docs/cmdk.png)`

## Performance Optimizations
1. **Latency Compensation (Optimistic UI)**: All mutations (like Create Invoice) use `onMutate` in TanStack query to render local state changes immediately.
2. **Event-Driven Architecture**: Long-running background tasks (like AI parsing) use an ack-and-process pattern. The server returns a 200 OK immediately and pushes the final result via WebSockets/SSE.
3. **High-Performance Build**: The Express server is compiled into a single CommonJS bundle using `esbuild`, reducing cold start I/O overhead.

## Folder Structure
```text
/
├── prisma/
│   └── schema.prisma           # Database models (User, Client, Project, Invoice)
├── src/
│   ├── components/             # Reusable UI components (Shadcn/Tailwind)
│   ├── features/               # Domain-driven feature modules
│   │   ├── dashboard/          # Layouts, Sidebar, Overview logic
│   │   ├── invoices/           # Invoice schemas, hooks, slide-over UI
│   │   └── ai/                 # Gemini reconciliation services
│   ├── lib/                    # Utilities (TanStack Query client, Event Bus)
│   ├── App.tsx                 # Routing configuration
│   └── main.tsx                # App Entry point
├── server.ts                   # Express server & API endpoints
└── vite.config.ts              # Bundler configuration
```

## API Design
The backend is split into standard REST and real-time streaming:
- `GET  /api/health` - System health check.
- `POST /api/invoices` - Simulated optimistic creation endpoint with Zod validation.
- `POST /api/ai/reconcile` - Triggers the AI agent worker for Stripe/Bank matching.
- `GET  /api/stream` - Persistent SSE stream for system broadcasts and background worker notifications.

## Environment Variables
Create a `.env` file in the root directory:
```env
# Database connection for Prisma
DATABASE_URL="postgres://user:password@host:port/db"

# LLM integration
GEMINI_API_KEY="AI..."

# Application configuration
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## Deployment
CreatorOS is bundled for containerized environments (like Google Cloud Run or Docker). 
1. Build the frontend and backend: `npm run build`
2. Run database migrations: `npx prisma migrate deploy`
3. Start the production server: `npm run start`

## Roadmap
- [x] Phase 1: High-density dashboard scaffolding and Prisma data models.
- [x] Phase 2: React Query data layer, pseudo-RLS middleware, SSE background worker.
- [ ] Phase 3: Live Stripe Webhook ingestion and automated multi-tenant provisioning.
- [ ] Phase 4: Plaid API connection for direct bank feed reconciliation.
- [ ] Phase 5: Transition to full Neon Postgres native RLS policies.
