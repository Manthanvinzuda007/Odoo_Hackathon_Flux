# Brightloop Architecture & Domain Design

## 1. System Architecture Overview

Brightloop is designed as a modular, type-safe full-stack application following Hexagonal / Clean Architecture principles within a high-performance pnpm monorepo.

```
+-------------------------------------------------------------------------+
|                               Web Client                                |
|   React 18 + Vite + Tailwind CSS + TanStack Query + shadcn/ui           |
|   Role-driven UI: Admin/Staff Dashboard vs. Customer Portal             |
+------------------------------------+------------------------------------+
                                     |
                          HTTPS / JSON REST API
                          Authorization: Bearer <JWT>
                                     |
+------------------------------------v------------------------------------+
|                             NestJS Backend                              |
|                                                                         |
|  [Global Middleware] Helmet · Pino · Rate Throttler · CookieParser      |
|  [Guards]            JwtAuthGuard · RolesGuard (ADMIN, STAFF, CUSTOMER) |
|                                                                         |
|  +------------------+  +-------------------+  +----------------------+   |
|  |   Auth Module    |  |  Billing Engine   |  |     Domain Modules   |   |
|  | Argon2 · Refresh |  | Recurring Runner  |  | Customers, Products  |   |
|  | Lockout Policy   |  | BillingRun Entity |  | Plans, Quotes, Subs  |   |
|  +------------------+  +-------------------+  +----------------------+   |
|                                                                         |
|  +------------------+  +-------------------+  +----------------------+   |
|  |  Invoice Engine  |  |  Payments Engine  |  |     Email Service    |   |
|  | Server-side GST  |  | Transactional DB  |  | Nodemailer Templates |   |
|  | Immutable Paired |  | Atomic Overpay Guard | MailHog Development  |   |
|  +------------------+  +-------------------+  +----------------------+   |
+------------------------------------+------------------------------------+
                                     |
                           Prisma ORM 5 (Pooled)
                                     |
+------------------------------------v------------------------------------+
|                         PostgreSQL 16 Database                          |
|   Strict FKs · Composite Indexes · Sequence Generation Table            |
|   Money as Integer Minor Units (Paise) · Basis Point Percentages         |
+-------------------------------------------------------------------------+
```

---

## 2. Core Lifecycle State Machines

### 2.1 Subscription State Machine

```
              +--------------+
              |    DRAFT     |
              +-------+------+
                      |
             +--------+--------+
             |                 |
             v                 v
     +---------------+ +---------------+
     |   QUOTATION   | |   CONFIRMED   |
     +-------+-------+ +-------+-------+
             |                 |
             +--------+--------+
                      |
                      v
              +---------------+
              |    ACTIVE     |<-------+
              +---+-------+---+        |
                  |       |            |
                  |       v            |
                  |  +---------+       |
                  |  | PAUSED  +-------+
                  |  +----+----+
                  |       |
                  v       v
              +---------------+
              |    CLOSED     |
              +---------------+
              |   CANCELLED   |
              +---------------+
```

Valid transition matrix enforced by `@brightloop/shared`:
- `DRAFT` $\to$ `QUOTATION`, `CONFIRMED`, `CANCELLED`
- `QUOTATION` $\to$ `CONFIRMED`, `CANCELLED`
- `CONFIRMED` $\to$ `ACTIVE`, `CANCELLED`
- `ACTIVE` $\to$ `PAUSED`, `CANCELLED`, `CLOSED`
- `PAUSED` $\to$ `ACTIVE`, `CANCELLED`, `CLOSED`
- `CANCELLED` $\to$ Terminal state
- `CLOSED` $\to$ Terminal state

### 2.2 Quotation State Machine

- `DRAFT` $\to$ `SENT`, `CANCELLED`
- `SENT` $\to$ `ACCEPTED`, `REJECTED`, `EXPIRED`, `CANCELLED`
- `ACCEPTED` $\to$ Terminal state (can be converted to a confirmed subscription)
- `REJECTED` $\to$ `DRAFT` (allows revising proposal)
- `EXPIRED` $\to$ `DRAFT` (allows reviving proposal with updated validity)

### 2.3 Invoice State Machine

- `DRAFT` $\to$ `ISSUED`, `VOID`
- `ISSUED` $\to$ `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `VOID`
- `PARTIALLY_PAID` $\to$ `PAID`, `OVERDUE`, `VOID`
- `PAID` $\to$ `VOID` (requires explicit audit log)
- `OVERDUE` $\to$ `PARTIALLY_PAID`, `PAID`, `VOID`
- `VOID` $\to$ Terminal state

---

## 3. Financial Precision & Money Rules

1. **Integer Minor Units:** All monetary values (`subtotalPaise`, `taxPaise`, `totalPaise`, `amountPaidPaise`, `amountDuePaise`, `unitPricePaise`) are strictly stored as 64-bit integer paise (1 INR = 100 paise).
2. **Never Floating Point:** Mathematical operations never multiply or divide raw floats. Rate percentages are stored in **basis points** (e.g., $18.00\% = 1800$ basis points).
3. **Server-Side Authority:** The frontend never submits calculated totals or taxes. The backend recalculates line items, taxes, discounts, and totals atomically inside database transactions.
4. **Non-Negative Invariants:** Invoices and discounts enforce `totalPaise = Math.max(0, subtotal + tax - discount)`. Negative totals are strictly prevented.
5. **Partial Payment Mechanics:** Payments verify `amountPaise <= amountDuePaise`. When `amountPaid == totalPaise`, invoice automatically updates to `PAID`. When `amountPaid > 0` but `< totalPaise`, status becomes `PARTIALLY_PAID`.
