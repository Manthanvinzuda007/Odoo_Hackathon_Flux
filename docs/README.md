# Brightloop Subscription Management System

> Production-quality, enterprise-grade subscription management and recurring billing platform tailored for modern SaaS businesses with native Indian Rupee (INR) financial semantics, role-based customer isolation, automated recurring billing, and real-time analytics.

---

## 1. Quick Overview

- **Monorepo:** pnpm workspace (`apps/api`, `apps/web`, `packages/shared`)
- **Backend:** NestJS 10, TypeScript Strict Mode, Prisma ORM 5, PostgreSQL 16+, Redis + BullMQ, Argon2 password hashing, JWT with refresh token rotation, Pino structured logging, Helmet, Throttling.
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui & Radix UI primitives, TanStack Query v5, Recharts, Lucide Icons, Sonner notifications.
- **Financial Architecture:** Integer minor units (**paise**), basis points for taxes/discounts, zero floating-point arithmetic errors, Indian localized number formatting (`₹1,25,000.00`).
- **User Roles:** `ADMIN`, `STAFF`, `CUSTOMER` with backend-enforced customer data isolation.

---

## 2. Default Demo Credentials

When seeded via `pnpm db:seed`, the system provides three pre-configured accounts:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@brightloop.in` | `Admin@123` | Full system access, staff & customer management, billing engine, system settings, audit logs |
| **STAFF** | `staff@brightloop.in` | `Staff@123` | Operational management of customers, products, plans, quotations, subscriptions, payments, reports |
| **CUSTOMER** | `customer@brightloop.in` | `Customer@123` | Customer self-service portal: view active subscriptions, download invoices, track payments, accept quotes |

---

## 3. Prerequisites

- **Node.js:** `>= 20.0.0` (Node.js 20 or 24 recommended)
- **pnpm:** `>= 9.0.0` (v12 supported)
- **PostgreSQL:** `>= 16.0` (Local or Docker)
- **Redis:** `>= 7.0` (Optional for BullMQ job queue)
- **MailHog / SMTP:** Port 1025 for local email capture

---

## 4. Quickstart Guide

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` matches your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://brightloop:brightloop@localhost:5432/brightloop?schema=public"
JWT_SECRET="super-secret-jwt-key-brightloop-production-2026"
JWT_REFRESH_SECRET="super-secret-jwt-refresh-key-brightloop-2026"
```

### Step 3: Run Database Migrations & Seed
```bash
# Push schema or run migrations
pnpm db:push

# Seed initial products, plans, taxes, discounts, customers, subscriptions, and demo users
pnpm db:seed
```

### Step 4: Start Applications
```bash
# Start backend and frontend simultaneously
pnpm dev

# Or run separately:
pnpm dev:api    # Starts API on http://localhost:3000
pnpm dev:web    # Starts Web on http://localhost:5173
```

- **Web Application:** [http://localhost:5173](http://localhost:5173)
- **API Swagger Documentation:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health Check Endpoint:** [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

---

## 5. Available Scripts

| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Run API and Web concurrently in development mode |
| `pnpm dev:api` | Run NestJS backend with hot reload |
| `pnpm dev:web` | Run Vite React frontend with HMR |
| `pnpm build` | Compile and build all workspace projects for production |
| `pnpm typecheck` | Run TypeScript validation across all workspaces (`--noEmit`) |
| `pnpm test` | Run test suites (Jest for backend, Vitest for frontend) |
| `pnpm lint` | Validate linting rules |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:push` | Synchronize Prisma schema with PostgreSQL database |
| `pnpm db:seed` | Execute seed script (`prisma/seed.ts`) |
| `pnpm db:studio` | Open Prisma Studio GUI |
| `pnpm docker:up` | Launch PostgreSQL, Redis, and MailHog via Docker Compose |
| `pnpm docker:down` | Stop and tear down Docker Compose services |

---

## 6. Architecture & Directory Structure

```
c:\Odoo_Hackathon_Flux\
├── apps/
│   ├── api/                    # NestJS REST API
│   │   ├── src/
│   │   │   ├── audit-logs/     # Immutable system audit trail
│   │   │   ├── auth/           # Argon2, JWT & Refresh rotation
│   │   │   ├── billing/        # Recurring billing runner & BillingRun entity
│   │   │   ├── common/         # SequenceService, AuditService, Filters
│   │   │   ├── customers/      # Customer directory & isolation logic
│   │   │   ├── discounts/      # Discount codes, redemption & limits
│   │   │   ├── email/          # Nodemailer transactional email delivery
│   │   │   ├── health/         # Readiness & Liveness probes
│   │   │   ├── invoices/       # Server-side tax & total invoice engine
│   │   │   ├── payments/       # Transactional payment recording
│   │   │   ├── plans/          # Subscription pricing plans
│   │   │   ├── products/       # Products & variants catalog
│   │   │   ├── quotations/     # Quotes, proposals & customer acceptance
│   │   │   ├── reports/        # Real aggregated KPIs (MRR, ARR, Cashflow)
│   │   │   ├── subscriptions/  # Subscription state machine
│   │   │   └── taxes/          # GST/VAT basis point tax engine
│   │   └── test/
│   └── web/                    # React 18 + Vite SPA
│       ├── src/
│       │   ├── components/     # UI primitives & App/Portal layouts
│       │   ├── hooks/          # useAuth with role helpers
│       │   ├── lib/            # api.ts, format.ts (INR/Date utils)
│       │   └── pages/          # Admin/Staff & Customer Portal views
├── packages/
│   └── shared/                 # Shared domain logic, enums, money utils
├── prisma/
│   ├── schema.prisma           # 20+ models, relational PostgreSQL schema
│   └── seed.ts                 # Idempotent seed data with Argon2 passwords
└── docs/                       # Technical architecture & deployment guides
```
