# ⚡ Brightloop

### Enterprise Subscription Management & Recurring Billing Platform

> **Brightloop** is a production-grade, full-stack subscription management and recurring billing platform designed for high-concurrency SaaS businesses.
>
> It provides secure authentication, multi-role access control, recurring billing automation, INR-native financial calculations, subscription lifecycle management, transactional payments, customer self-service, analytics, email notifications, and immutable audit logging.

---

## 📌 Overview

Brightloop is built as a modern TypeScript monorepo with a **NestJS backend**, **React frontend**, **PostgreSQL database**, **Prisma ORM**, and **Redis/BullMQ** infrastructure.

The platform is designed around several core principles:

- 🔐 Security-first authentication and authorization
- 💰 Financial accuracy using integer-based INR/paise calculations
- 🔄 Reliable and idempotent recurring billing
- 👥 Strict role-based and customer-level data isolation
- 🧾 Transactional invoices and append-only payment records
- 📊 Real-time financial reporting and analytics
- 📝 Immutable audit logging
- 📧 Transactional email delivery
- 🧱 Modular and scalable architecture

---

## ✨ Key Features

### 🔐 Enterprise Authentication

- Argon2id memory-hard password hashing
- JWT access tokens with 15-minute TTL
- Single-use refresh token rotation
- PostgreSQL-backed refresh token storage
- Account lockout after 5 consecutive failed login attempts
- 15-minute account lockout duration
- Refresh-token replay/theft protection
- Automatic session invalidation when an old refresh token is reused

---

### 👥 Role-Based Access Control

Brightloop provides three primary roles:

| Role | Description |
|---|---|
| **ADMIN** | Full system administration, staff management, billing execution, settings, analytics and audit logs |
| **STAFF** | Operational management of customers, products, plans, quotations, subscriptions, invoices and payments |
| **CUSTOMER** | Self-service access to their own subscriptions, invoices, quotations and payment records |

Customer access is strictly isolated at the backend level. A customer cannot access another customer's financial or subscription data.

---

### 💰 INR-Native Financial Engine

Brightloop is designed to avoid floating-point financial errors.

- All monetary values are stored as integer **paise**
- `₹1 = 100 paise`
- Percentage rates use integer basis points
- `18% GST = 1800 bps`
- Server-side calculations are authoritative
- Invoice totals are calculated inside database transactions
- Indian currency formatting supports Lakhs and Crores

Example:

```text
₹1,999.00 → 199900 paise
₹1,25,000.00 → 12500000 paise
18% GST → 1800 basis points
```

Invoice totals follow:

```text
Total = max(0, Subtotal + Tax - Discount)
```

---

### 📦 Product & Plan Management

- Hierarchical products
- Product variants
- Flexible subscription plans
- Monthly billing
- Quarterly billing
- Half-yearly billing
- Annual billing
- Trial periods
- JSON-based plan feature definitions

---

### 📝 Quotations & Proposals

- Create and manage quotations
- Tax calculation
- Discount support
- Expiration dates
- Customer self-service acceptance
- One-click conversion from accepted quotation to subscription

---

### 🔄 Subscription Lifecycle

Subscriptions follow a controlled lifecycle:

```text
DRAFT
   ↓
QUOTATION
   ↓
CONFIRMED
   ↓
ACTIVE
   ↕
PAUSED
   ↓
CLOSED / CANCELLED
```

The platform also calculates:

- Monthly Recurring Revenue (**MRR**)
- Annual Recurring Revenue (**ARR**)

---

### ⚡ Automated Recurring Billing

The billing engine automatically processes subscriptions whose billing date has arrived.

The billing process:

1. Finds active subscriptions where `nextBillingDate <= now()`
2. Creates itemized invoices
3. Calculates subtotal, tax and discounts
4. Advances the billing period
5. Updates the next billing date
6. Sends invoice notifications
7. Records billing-run statistics
8. Creates audit records

Duplicate invoice generation is prevented through transaction-safe deduplication and idempotency checks.

Manual billing execution is also available:

```http
POST /api/v1/billing/run
```

---

### 💳 Payment Management

Brightloop uses an append-only payment model.

Supported payment methods include:

- UPI
- Bank Transfer
- Card
- Cheque

Invoice payment states automatically progress through:

```text
ISSUED
   ↓
PARTIALLY_PAID
   ↓
PAID
```

Overpayments are rejected by the backend.

---

### 📊 Financial Analytics

The reporting system provides aggregated financial KPIs including:

- MRR
- ARR
- Active subscriptions
- Total revenue
- Outstanding overdue amounts
- Revenue by month
- Subscription status distribution
- Plan distribution
- Invoice breakdown

---

### 📧 Transactional Email

Email delivery is handled through Nodemailer.

Development uses **MailHog**, while production can use an SMTP provider.

Available email flows include:

- Welcome emails
- Invoice generated notifications
- Payment receipts
- Password reset emails

Email activity is recorded in the `EmailLog` table.

---

### 🛡️ Immutable Audit Logging

Brightloop maintains an append-only audit trail.

Each audit record can capture:

- Actor ID
- Target entity
- Action
- Metadata
- Entity changes

Supported actions include:

```text
CREATE
UPDATE
DELETE
EXECUTE
```

---

# 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | pnpm Workspaces |
| **Language** | TypeScript 5.5+ |
| **Runtime** | Node.js 20+ |
| **Backend** | NestJS 10 |
| **ORM** | Prisma 5.22 |
| **Database** | PostgreSQL 16+ |
| **Queue / Cache** | Redis + BullMQ |
| **Authentication** | JWT + Passport + Argon2 |
| **Frontend** | React 18 |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS |
| **UI** | shadcn/ui + Radix UI |
| **Data Fetching** | TanStack Query v5 |
| **Charts** | Recharts |
| **Icons** | Lucide |
| **Notifications** | Sonner |
| **Email** | Nodemailer + MailHog |
| **Backend Testing** | Jest |
| **Frontend Testing** | Vitest + React Testing Library |

---

# 🏗️ Architecture

Brightloop follows a modular monorepo architecture:

```text
Odoo_Hackathon_Flux/
│
├── apps/
│   │
│   ├── api/                         # NestJS REST API
│   │   ├── src/
│   │   │   ├── audit-logs/
│   │   │   ├── auth/
│   │   │   ├── billing/
│   │   │   ├── common/
│   │   │   ├── customers/
│   │   │   ├── discounts/
│   │   │   ├── email/
│   │   │   ├── health/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   ├── plans/
│   │   │   ├── products/
│   │   │   ├── quotations/
│   │   │   ├── reports/
│   │   │   ├── subscriptions/
│   │   │   └── taxes/
│   │   │
│   │   └── test/
│   │
│   └── web/                         # React + Vite frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── data/
│       │   │   ├── layout/
│       │   │   └── ui/
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── pages/
│       └── dist/
│
├── packages/
│   └── shared/                      # Shared domain layer
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
└── docs/
    ├── README.md
    ├── ARCHITECTURE.md
    ├── API.md
    ├── DATABASE.md
    ├── SECURITY.md
    └── DEPLOYMENT.md
```

---

# 📋 Prerequisites

Before running Brightloop locally, install:

### Node.js

```bash
node -v
```

Required:

```text
Node.js >= 20
```

Node 20 LTS or Node 24 is recommended.

### pnpm

```bash
npm install -g pnpm@latest
pnpm -v
```

Required:

```text
pnpm >= 9
```

### PostgreSQL

```text
PostgreSQL >= 16
```

The database can run locally or through Docker.

### Redis

```text
Redis >= 7
```

Redis is used for background job processing.

### Git

Git should be installed and available from the terminal.

---

# 🚀 Installation

## 1. Open the Project

```bash
cd c:\Odoo_Hackathon_Flux
```

## 2. Install Dependencies

```bash
pnpm install
```

If pnpm requests approval for native build scripts, approve the required packages:

```bash
pnpm approve-builds @nestjs/core @prisma/client @prisma/engines argon2 esbuild msgpackr-extract prisma
```

---

# 🔑 Environment Configuration

Create the local environment file:

```bash
cp .env.example .env
```

Then configure the required variables:

```env
# Server
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:5173

# PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brightloop?schema=public"

# JWT
JWT_SECRET="brightloop-super-secret-jwt-key-production-grade-2026"
JWT_EXPIRES_IN="15m"

JWT_REFRESH_SECRET="brightloop-super-secret-refresh-key-production-grade-2026"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# SMTP / MailHog
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Brightloop <no-reply@brightloop.in>"

# Locale
DEFAULT_CURRENCY=INR
DEFAULT_TIMEZONE=Asia/Kolkata
```

> ⚠️ **Production:** Replace development secrets with secure environment-specific values before deployment.

---

# 🗄️ Database Setup

## Generate Prisma Client

```bash
pnpm db:generate
```

## Apply Database Schema

```bash
pnpm db:push
```

## Seed Demo Data

```bash
pnpm db:seed
```

The seed process creates demo data including:

- 3 users
- 3 products
- Product variants
- 6 pricing plans
- 3 GST rates
- 3 discounts
- 10 Indian corporate customers
- 8 active subscriptions
- Historical invoices
- Payment records

---

# ▶️ Running the Application

## Recommended: Run Everything Together

```bash
pnpm dev
```

This starts:

```text
Backend API      → http://localhost:3000
Frontend         → http://localhost:5173
```

---

## Run Backend Separately

```bash
pnpm dev:api
```

Backend:

```text
http://localhost:3000/api/v1
```

Swagger:

```text
http://localhost:3000/api/docs
```

Health Check:

```text
http://localhost:3000/api/v1/health
```

---

## Run Frontend Separately

```bash
pnpm dev:web
```

Frontend:

```text
http://localhost:5173
```

---

# 👤 Demo Accounts

After running the seed command, the following demo accounts are available:

| Role | Email | Password | Access |
|---|---|---|---|
| **ADMIN** | `admin@brightloop.in` | `Admin@123` | Full administrative access |
| **STAFF** | `staff@brightloop.in` | `Staff@123` | Operational management |
| **CUSTOMER** | `customer@brightloop.in` | `Customer@123` | Customer self-service portal |

Login:

```text
http://localhost:5173/login
```

> ⚠️ These credentials are intended for local/demo environments only.

---

# 🔄 Core Workflows

## 1. Customer → Subscription

```text
Create Customer
      ↓
Select Product / Plan
      ↓
Create Subscription
      ↓
Subscription becomes ACTIVE
      ↓
Next Billing Date calculated
```

---

## 2. Recurring Billing

```text
Scheduled / Manual Billing Run
            ↓
Find Due Subscriptions
            ↓
Generate Invoice
            ↓
Calculate Tax & Discount
            ↓
Advance Billing Period
            ↓
Send Email
            ↓
Create BillingRun + AuditLog
```

Manual execution:

```http
POST /api/v1/billing/run
Authorization: Bearer <ADMIN_JWT>
```

---

## 3. Payment Processing

```text
Outstanding Invoice
        ↓
Record Payment
        ↓
Validate Amount
        ↓
Prevent Overpayment
        ↓
Update Invoice Balance
        ↓
PARTIALLY_PAID / PAID
```

---

## 4. Customer Portal

Customers can:

- View active subscriptions
- View renewal dates
- View outstanding balances
- View invoices
- View payment receipts
- Accept quotations

Every customer-facing query is protected by backend ownership checks.

---

# 💰 Financial Rules

Brightloop deliberately avoids JavaScript floating-point arithmetic for financial calculations.

### Monetary Values

All database money values are stored in paise:

```text
₹1,999.00
     ↓
199900 paise
```

### Tax Rates

Tax rates use basis points:

```text
18%
 ↓
1800 bps
```

Tax calculation:

```text
taxPaise =
round((subtotalPaise × taxRate) / 10000)
```

### Currency Formatting

```text
formatINR(paise)
```

Examples:

```text
₹1,25,000.00
₹1,00,00,000.00
```

Compact formatting is also supported:

```text
₹50.0K
₹5.0L
₹2.0Cr
```

---

# 📖 API Documentation

Once the backend is running, open Swagger:

```text
http://localhost:3000/api/docs
```

Swagger provides:

- Interactive API documentation
- Request schemas
- Validation rules
- Authentication
- Endpoint testing
- Bearer JWT authorization

### Main API Areas

| Module | Example |
|---|---|
| **Auth** | `/api/v1/auth/*` |
| **Customers** | `/api/v1/customers/*` |
| **Products** | `/api/v1/products/*` |
| **Plans** | `/api/v1/plans/*` |
| **Taxes** | `/api/v1/taxes/*` |
| **Discounts** | `/api/v1/discounts/*` |
| **Quotations** | `/api/v1/quotations/*` |
| **Subscriptions** | `/api/v1/subscriptions/*` |
| **Invoices** | `/api/v1/invoices/*` |
| **Billing** | `/api/v1/billing/*` |
| **Payments** | `/api/v1/payments/*` |
| **Reports** | `/api/v1/reports/*` |
| **Audit Logs** | `/api/v1/audit-logs/*` |
| **Health** | `/api/v1/health` |

---

# 🧪 Testing & Quality

## Run All Tests

```bash
pnpm test
```

## Backend Tests

```bash
pnpm --filter @brightloop/api test
```

Backend tests cover areas such as:

- Financial calculations
- Basis-point calculations
- Invoice logic
- Subscription state transitions

## Frontend Tests

```bash
pnpm --filter @brightloop/web test
```

Frontend tests cover:

- INR formatting
- Compact currency formatting
- Date localization
- UI state mappings

## TypeScript Validation

```bash
pnpm typecheck
```

## Production Build

```bash
pnpm build
```

Build outputs:

```text
apps/api/dist
apps/web/dist
```

---

# 🔍 Database Inspection

Use Prisma Studio to inspect database records:

```bash
pnpm db:studio
```

Prisma Studio:

```text
http://localhost:5555
```

---

# 📧 Local Email Testing

During development, email is routed through MailHog.

SMTP:

```text
localhost:1025
```

MailHog dashboard:

```text
http://localhost:8025
```

Email records are also stored in:

```text
email_logs
```

---

# ❓ Troubleshooting

### `ERR_PNPM_IGNORED_BUILDS`

Run:

```bash
pnpm approve-builds @nestjs/core @prisma/client @prisma/engines argon2 esbuild msgpackr-extract prisma
```

---

### Port 3000 Already in Use

Change the API port in `.env`:

```env
PORT=3001
```

---

### Port 5173 Already in Use

Run Vite on another port:

```bash
pnpm --filter @brightloop/web dev -- --port 5174
```

---

### Inspect Database

```bash
pnpm db:studio
```

Then open:

```text
http://localhost:5555
```

---

# 📚 Documentation

Additional technical documentation is available under `docs/`:

```text
docs/
├── README.md
├── ARCHITECTURE.md
├── API.md
├── DATABASE.md
├── SECURITY.md
└── DEPLOYMENT.md
```

---

# 🔐 Security Principles

Brightloop follows several security-focused design principles:

- Argon2id password hashing
- JWT authentication
- Refresh token rotation
- Account lockout
- Token replay protection
- Role-based authorization
- Customer ownership validation
- Server-side financial calculations
- Transactional database operations
- Append-only audit logging
- HTTP security middleware
- Request throttling

---

# 🧱 Design Principles

The platform is built around:

### Security

Protect identities, sessions and customer data.

### Financial Integrity

Never rely on floating-point arithmetic for monetary values.

### Consistency

Use database transactions for operations that must remain atomic.

### Idempotency

Prevent duplicate billing operations.

### Isolation

Ensure customers can only access their own data.

### Observability

Maintain health checks, audit logs, billing-run records and email logs.

### Modularity

Keep business domains separated into independently maintainable modules.

---

# 📌 Project Status

Brightloop currently provides the core functionality required for an enterprise subscription and recurring billing platform, including:

- Authentication & authorization
- Customer management
- Product and plan management
- Quotations
- Subscription lifecycle management
- Recurring billing
- Invoicing
- Payments
- Financial reporting
- Transactional email
- Audit logging
- Customer self-service portal
- Automated testing
- Swagger API documentation

---

# ⚠️ Development Note

This repository is intended for development and project evaluation purposes.

Before production deployment:

- Replace all development secrets
- Configure production PostgreSQL
- Configure production Redis
- Configure production SMTP
- Review CORS configuration
- Configure secure JWT secrets
- Review environment variables
- Run the complete test suite
- Run the production build
- Review the deployment documentation

---

## 🏢 Brightloop

**Enterprise Subscription Management & Recurring Billing System**

Built with:

```text
NestJS • React • TypeScript • PostgreSQL • Prisma
Redis • BullMQ • Tailwind CSS • Vite
```

---
