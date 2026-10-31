# ⚡ Brightloop — Enterprise Subscription Management & Recurring Billing System

> **Brightloop** is a full-stack, production-grade subscription management and recurring billing platform engineered for high-concurrency SaaS businesses. Built with native Indian Rupee (INR - ₹) financial semantics, automated recurring billing engines, atomic sequence generation, immutable audit logging, and strict role-based customer data isolation.

---

## 📑 Table of Contents

1. [Features & Capabilities](#-features--capabilities)
2. [Tech Stack](#-tech-stack)
3. [Architecture Overview](#-architecture-overview)
4. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
5. [Step-by-Step Installation Guide](#-step-by-step-installation-guide)
6. [Environment Variables Configuration](#-environment-variables-configuration)
7. [Database Setup, Migration & Seeding](#-database-setup-migration--seeding)
8. [How to Run the Application](#-how-to-run-the-application)
9. [Pre-configured Demo Accounts & Credentials](#-pre-configured-demo-accounts--credentials)
10. [End-to-End System Workflows](#-end-to-end-system-workflows)
11. [Financial Calculation & Money Rules](#-financial-calculation--money-rules)
12. [API Documentation & Swagger](#-api-documentation--swagger)
13. [Running Tests & Quality Checks](#-running-tests--quality-checks)
14. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🚀 Features & Capabilities

- **🔐 Enterprise Authentication:**
  - Memory-hard **Argon2id** password hashing.
  - JWT access tokens (15-min TTL) with single-use refresh token rotation stored in PostgreSQL.
  - **Account Lockout Policy:** Protects against brute-force attacks by locking user accounts after 5 consecutive failed attempts for 15 minutes.
  - **Token Theft / Replay Protection:** Re-using an old refresh token automatically invalidates all active sessions for that user.

- **👥 Multi-Tenant Role Isolation:**
  - **ADMIN:** Complete system oversight, staff administration, recurring billing runner, system settings, and immutable audit trail.
  - **STAFF:** Day-to-day operations (customer management, products, plans, quotes, subscriptions, payments).
  - **CUSTOMER:** Secure Self-Service Portal (`/portal`). Customers can **only** access their own subscriptions, invoices, quotes, and payment receipts. Backend strictly blocks cross-customer data leakage with `403 Forbidden`.

- **💰 100% Accurate Indian Rupee (INR) Money Engine:**
  - **Zero floating-point arithmetic:** All monetary amounts are stored as 64-bit integer **paise** ($1\text{ INR} = 100\text{ paise}$).
  - **Basis point tax & discount calculation:** Rates stored as integer basis points ($18.00\% = 1800\text{ bps}$).
  - **Indian Number Formatting:** Displayed natively as `₹1,25,000.00` and `₹1,00,00,000.00` (Crores & Lakhs).
  - **Server-Side Financial Authority:** Client-side totals are never trusted; subtotals, GST allocations, discounts, and totals are computed atomically inside database transactions.
  - **Non-Negative Invariant:** Invoices enforce $\text{Total} = \max(0, \text{Subtotal} + \text{Tax} - \text{Discount})$.

- **📦 Product & Plan Catalog:**
  - Hierarchical Products with multi-tier Product Variants.
  - Flexible Plans with billing intervals (`MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, `YEARLY`), trial periods, and JSON-based feature lists.

- **📝 Quotations & Proposals:**
  - Draft proposals, calculate taxes, set expiry dates.
  - Customer self-service proposal acceptance via Customer Portal.
  - Seamless one-click conversion from accepted quotation to active subscription.

- **🔄 Strict Subscription Lifecycle State Machine:**
  $$\text{DRAFT} \longrightarrow \text{QUOTATION} \longrightarrow \text{CONFIRMED} \longrightarrow \text{ACTIVE} \longleftrightarrow \text{PAUSED} \longrightarrow \text{CLOSED / CANCELLED}$$
  - Normalized Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR) calculation.

- **⚡ Automated Recurring Billing Engine:**
  - Background billing runner (`BillingService`) queries all active subscriptions where `nextBillingDate <= now()`.
  - Transactionally creates itemized invoices, advances billing periods, and records `BillingRun` statistics.
  - Deduplication & idempotency check prevents duplicate invoice generation.
  - Manual trigger endpoint (`POST /api/v1/billing/run`) for on-demand billing runs.

- **💳 Append-Only Payment Ledger:**
  - Payments are immutable and atomic.
  - Overpayment prevention ($\text{payment} \le \text{amountDue}$).
  - Automatic invoice status transitions (`ISSUED` $\to$ `PARTIALLY_PAID` $\to$ `PAID`).

- **📊 Real-Time Financial Analytics:**
  - Live aggregated KPIs calculated via PostgreSQL SQL queries: MRR, ARR, Active Subscriptions, Total Revenue, Outstanding Overdue.
  - Visual charts: Revenue by Month, Subscriptions by Status, Plan Distribution, Invoices Breakdown.

- **📧 Transactional Email System:**
  - Nodemailer email service integrated with MailHog (dev) and production SMTP.
  - HTML email templates for Welcome, Invoice Generated, Payment Receipt, and Password Reset.
  - Full audit logging in the `EmailLog` table.

- **🛡️ Immutable Audit Logging:**
  - Append-only `AuditLog` captures Actor ID, Target Entity, Action (`CREATE`, `UPDATE`, `DELETE`, `EXECUTE`), and full JSON metadata changes.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo** | `pnpm` workspaces, TypeScript 5.5+ (Strict Mode), Node.js 20+ |
| **Backend API** | NestJS 10, Prisma ORM 5.22, PostgreSQL 16+, BullMQ / Redis, Argon2, Passport-JWT, Pino Logger, Helmet, Throttler |
| **Frontend Web** | React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui & Radix UI primitives, TanStack Query v5, Recharts, Lucide Icons, Sonner |
| **Shared Domain** | `@brightloop/shared` (Shared types, money utilities, state machines, enums) |
| **Testing** | Jest 29, Vitest 2.1, React Testing Library |

---

## 🏛 Architecture Overview

```
c:\Odoo_Hackathon_Flux\
├── apps/
│   ├── api/                     # NestJS REST API (Port 3000)
│   │   ├── src/
│   │   │   ├── audit-logs/      # Immutable system audit trail
│   │   │   ├── auth/            # Argon2, JWT & Refresh rotation
│   │   │   ├── billing/         # Recurring billing runner & BillingRun entity
│   │   │   ├── common/          # SequenceService, AuditService, Filters
│   │   │   ├── customers/       # Customer directory & isolation logic
│   │   │   ├── discounts/       # Concurrency-safe discounts & redemptions
│   │   │   ├── email/           # Nodemailer transactional email delivery
│   │   │   ├── health/          # Liveness & Readiness health probes
│   │   │   ├── invoices/        # Server-side tax & total invoice engine
│   │   │   ├── payments/        # Transactional payment recording
│   │   │   ├── plans/           # Subscription pricing plans
│   │   │   ├── products/        # Products & variants catalog
│   │   │   ├── quotations/      # Quotes, proposals & customer acceptance
│   │   │   ├── reports/         # Real aggregated KPIs (MRR, ARR, Cashflow)
│   │   │   ├── subscriptions/   # Subscription state machine
│   │   │   └── taxes/           # GST/VAT basis point tax engine
│   │   └── test/                # Jest configuration & test suites
│   │
│   └── web/                     # React 18 + Vite Frontend (Port 5173)
│       ├── src/
│       │   ├── components/      # UI primitives & App/Portal layouts
│       │   │   ├── data/        # Generic DataPage table/card component
│       │   │   ├── layout/      # AppLayout (Admin/Staff) & PortalLayout (Customer)
│       │   │   └── ui/          # Button, Input, Dialog, Select, Switch, Card, etc.
│       │   ├── hooks/           # useAuth with role helpers & session restore
│       │   ├── lib/             # api.ts (fetch wrapper), format.ts (INR/Date)
│       │   └── pages/           # Admin/Staff views & Customer Portal views
│       └── dist/                # Production build artifacts
│
├── packages/
│   └── shared/                  # Shared domain types, money utils, state validators
│
├── prisma/
│   ├── schema.prisma            # 20+ models, relational PostgreSQL schema
│   └── seed.ts                  # Idempotent seed script with Argon2 passwords
│
└── docs/                        # Complete technical documentation
    ├── README.md                # System overview
    ├── ARCHITECTURE.md          # Architecture & state machine diagrams
    ├── API.md                   # REST API documentation
    ├── DATABASE.md              # Database schema & ER diagram
    ├── SECURITY.md              # Security & authentication architecture
    └── DEPLOYMENT.md            # Production deployment guide
```

---

## 📋 Prerequisites & System Requirements

Before running the project, make sure you have the following installed:

1. **Node.js:** `>= 20.0.0` (Recommended: Node 20 LTS or Node 24)
   ```bash
   node -v
   ```
2. **pnpm:** `>= 9.0.0`
   ```bash
   npm install -g pnpm@latest
   pnpm -v
   ```
3. **PostgreSQL:** `>= 16.0` (Running locally on port `5432` or via Docker)
4. **Redis:** `>= 7.0` (Optional, for background job queueing)
5. **Git:** Installed on machine (Note: Do not commit or push to remote)

---

## ⚙️ Step-by-Step Installation Guide

### 1. Clone or Open Workspace
Open your terminal inside the project root:
```bash
cd c:\Odoo_Hackathon_Flux
```

### 2. Install Dependencies
Install all workspace dependencies using `pnpm`:
```bash
pnpm install
```

If pnpm prompts for approved builds for native binary modules (`argon2`, `prisma`, `esbuild`), approve them:
```bash
pnpm approve-builds @nestjs/core @prisma/client @prisma/engines argon2 esbuild msgpackr-extract prisma
```

---

## 🔑 Environment Variables Configuration

Copy `.env.example` to create `.env` in the project root:
```bash
cp .env.example .env
```

Verify or configure the following environment parameters in `.env`:

```env
# ===================================================
# SERVER CONFIGURATION
# ===================================================
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:5173

# ===================================================
# POSTGRESQL DATABASE (PRISMA)
# ===================================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brightloop?schema=public"

# ===================================================
# JWT AUTHENTICATION
# ===================================================
JWT_SECRET="brightloop-super-secret-jwt-key-production-grade-2026"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="brightloop-super-secret-refresh-key-production-grade-2026"
JWT_REFRESH_EXPIRES_IN="7d"

# ===================================================
# REDIS / BULLMQ
# ===================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ===================================================
# EMAIL / SMTP (MAILHOG FOR DEVELOPMENT)
# ===================================================
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Brightloop <no-reply@brightloop.in>"

# ===================================================
# LOCALE SETTINGS
# ===================================================
DEFAULT_CURRENCY=INR
DEFAULT_TIMEZONE=Asia/Kolkata
```

---

## 🗄️ Database Setup, Migration & Seeding

### 1. Generate Prisma Client
Generates the typed Prisma Client for database access:
```bash
pnpm db:generate
```

### 2. Push Schema to PostgreSQL
Synchronize the PostgreSQL database with the Prisma schema:
```bash
pnpm db:push
```

### 3. Seed Database with Realistic Indian SaaS Data
Populate the database with demo users, products, variants, plans, taxes, discounts, 10 customers, 8 active subscriptions, historical invoices, and payments:
```bash
pnpm db:seed
```

> **What the seed script creates:**
> - **3 Demo Users** (Admin, Staff, Customer) with Argon2-encrypted passwords.
> - **3 Products:** CRM Suite, ERP Cloud, HRMS Pro with variants.
> - **6 Pricing Plans:** Basic, Pro, Enterprise tiers across Monthly & Annual intervals.
> - **3 Tax Rates:** GST 18%, GST 12%, GST 5%.
> - **3 Discounts:** `EARLY20` (20% off), `FLAT1000` (₹1,000 off), `DIWALI15` (15% off).
> - **10 Indian Corporate Customers** with GSTIN numbers and physical addresses.
> - **8 Subscriptions** with active recurring billing cycles, invoices, and payments.

---

## 💻 How to Run the Application

### Option A: Run Both Frontend & Backend Concurrently (Recommended)
```bash
pnpm dev
```
This runs both `@brightloop/api` on port `3000` and `@brightloop/web` on port `5173` simultaneously.

### Option B: Run in Separate Terminals

#### Terminal 1 — Start NestJS Backend API:
```bash
pnpm dev:api
```
- API Base URL: `http://localhost:3000/api/v1`
- Swagger Interactive Docs: `http://localhost:3000/api/docs`
- Health Check Probe: `http://localhost:3000/api/v1/health`

#### Terminal 2 — Start React Web Frontend:
```bash
pnpm dev:web
```
- Web Application: `http://localhost:5173`

---

## 👤 Pre-configured Demo Accounts & Credentials

The seed data sets up three functional roles. You can log in using any of them at [http://localhost:5173/login](http://localhost:5173/login):

| Role | Email | Password | Allowed Access & Dashboard |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@brightloop.in` | `Admin@123` | Full access to `/app/*`. Can manage staff, customers, billing cycle runner, system settings, audit logs, and analytics. |
| **STAFF** | `staff@brightloop.in` | `Staff@123` | Access to operational management: customers, products, plans, quotes, subscriptions, invoices, and payments. |
| **CUSTOMER** | `customer@brightloop.in` | `Customer@123` | Directs to `/portal/*`. Customer self-service portal: view own active subscriptions, download invoices, view payment receipts, accept quotes. |

---

## 🔄 End-to-End System Workflows

### Workflow 1: Customer Onboarding & Subscription Creation
1. Sign in as **Admin** or **Staff**.
2. Navigate to **Customers** (`/app/customers`) $\to$ Click **Add Customer** $\to$ Fill in Contact Name, Company, Email, Phone, and GSTIN.
3. Navigate to **Subscriptions** (`/app/subscriptions`) $\to$ Click **New Subscription**.
4. Select the customer, pick a billing interval (`MONTHLY`, `QUARTERLY`, `YEARLY`), add plan line items, and submit.
5. The subscription starts in `ACTIVE` state with next billing date automatically computed.

### Workflow 2: Automated Recurring Billing Run
1. Go to **Settings** or trigger the billing API endpoint:
   ```bash
   POST http://localhost:3000/api/v1/billing/run
   Authorization: Bearer <ADMIN_JWT>
   ```
2. The billing engine queries all active subscriptions due for renewal (`nextBillingDate <= now`).
3. For each due subscription, it atomically:
   - Generates an itemized `Invoice` with computed subtotal and GST.
   - Advances `currentPeriodStart`, `currentPeriodEnd`, and `nextBillingDate`.
   - Sends an invoice email notification to the customer.
   - Logs execution results in `BillingRun` and `AuditLog`.

### Workflow 3: Recording Payments
1. Navigate to **Invoices** (`/app/invoices`) to view outstanding amounts.
2. Navigate to **Payments** (`/app/payments`) $\to$ Click **Record Payment**.
3. Select the unpaid invoice $\to$ the dialog automatically displays the outstanding due amount.
4. Enter the amount paid, payment method (`UPI`, `BANK_TRANSFER`, `CARD`, `CHEQUE`), transaction reference ID, and submit.
5. The system atomically deducts the amount from invoice `amountDuePaise`. If fully paid, the invoice status changes to `PAID`. Overpayment is strictly prevented.

### Workflow 4: Customer Self-Service Portal
1. Log in with `customer@brightloop.in` / `Customer@123`.
2. The user is redirected to `/portal/dashboard`.
3. View active subscription plans, renewal dates, outstanding balances, and recent invoices.
4. Switch to **My Invoices** (`/portal/invoices`) or **My Payments** (`/portal/payments`) for full transparency.
5. Backend verifies customer ownership on every query—customer cannot view other companies' financial data.

---

## 🧮 Financial Calculation & Money Rules

To prevent financial rounding errors common in JavaScript applications:

1. **Integer Minor Units:** All database fields storing money are integers representing **paise** ($1\text{ Rupee} = 100\text{ paise}$):
   - Example: ₹1,999.00 is stored as `199900`.
   - Example: ₹1,25,000.00 is stored as `12500000`.
2. **Basis Points for Percentage:**
   - 18% GST is represented as `1800` basis points.
   - Formula: $\text{taxPaise} = \text{round}\left(\frac{\text{subtotalPaise} \times \text{taxRate}}{10000}\right)$.
3. **Format Utilities:**
   - `formatINR(paise)` formats to Indian numbering (`₹1,25,000.00`).
   - `formatShort(paise)` formats to compact abbreviations (`₹50.0K`, `₹5.0L`, `₹2.0Cr`).

---

## 📖 API Documentation & Swagger

When the backend API is running (`pnpm dev:api`), interactive Swagger documentation is available at:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

From Swagger, you can test every REST API endpoint, inspect request schemas, review parameter validation, and execute authenticated requests using Bearer JWT tokens.

### Key API Endpoints Summary:
- **Auth:** `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/profile`
- **Customers:** `GET /api/v1/customers`, `POST /api/v1/customers`, `PUT /api/v1/customers/:id`
- **Products & Plans:** `GET /api/v1/products`, `GET /api/v1/plans`, `POST /api/v1/plans`
- **Taxes & Discounts:** `GET /api/v1/taxes`, `GET /api/v1/discounts`, `POST /api/v1/discounts`
- **Quotations:** `GET /api/v1/quotations`, `POST /api/v1/quotations`, `POST /api/v1/quotations/:id/accept`
- **Subscriptions:** `GET /api/v1/subscriptions`, `POST /api/v1/subscriptions`, `PUT /api/v1/subscriptions/:id/status`
- **Invoices & Billing:** `GET /api/v1/invoices`, `POST /api/v1/billing/run`, `GET /api/v1/billing/runs`
- **Payments:** `GET /api/v1/payments`, `POST /api/v1/payments`
- **Reports:** `GET /api/v1/reports/dashboard`, `GET /api/v1/reports/revenue-by-month`
- **Audit Logs:** `GET /api/v1/audit-logs`
- **Health:** `GET /api/v1/health`

---

## 🧪 Running Tests & Quality Checks

Brightloop includes a comprehensive test suite across backend and frontend:

### Run All Tests Across Workspace:
```bash
pnpm test
```

### Run Backend Jest Tests Only:
```bash
pnpm --filter @brightloop/api test
```
*Tests financial precision, basis points, invoice calculation, and state machine transitions.*

### Run Frontend Vitest Tests Only:
```bash
pnpm --filter @brightloop/web test
```
*Tests INR formatting, compact currency abbreviations, date localization, and UI badge mappings.*

### TypeScript Strict Typecheck:
```bash
pnpm typecheck
```
*Executes `tsc --noEmit` across all workspace packages.*

### Production Build:
```bash
pnpm build
```
*Builds NestJS into `apps/api/dist` and Vite frontend into `apps/web/dist`.*

---

## ❓ Troubleshooting & FAQ

### Q1: `pnpm approve-builds` error when installing
If you see `ERR_PNPM_IGNORED_BUILDS` during installation, run:
```bash
pnpm approve-builds @nestjs/core @prisma/client @prisma/engines argon2 esbuild msgpackr-extract prisma
```

### Q2: Port 3000 or 5173 is already in use
You can specify a different port in `.env` for the API (`PORT=3001`) or run Vite on another port:
```bash
pnpm --filter @brightloop/web dev -- --port 5174
```

### Q3: How do I inspect database records visually?
Launch the built-in Prisma Studio interface:
```bash
pnpm db:studio
```
Prisma Studio opens at `http://localhost:5555` to browse and inspect database tables.

### Q4: Are background emails captured locally?
Yes! In local development, emails are routed via SMTP to MailHog on port `1025`. You can inspect sent emails in MailHog's web dashboard at `http://localhost:8025` or check the database table `email_logs`.

---

## ⚠️ Important Note on Version Control

> [!WARNING]
> In accordance with project instructions: **No commits are made to Git or pushed to GitHub.** All files, schemas, and configurations remain purely local in your workspace.

---

**Brightloop Technologies Pvt. Ltd.** · Enterprise Subscription Management System
