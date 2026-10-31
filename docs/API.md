# Brightloop API Documentation

Base URL: `/api/v1`  
Interactive Swagger Documentation: `http://localhost:3000/api/docs`

---

## 1. Authentication Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticates credentials with Argon2, issues JWT + httpOnly cookie |
| `POST` | `/auth/register` | Public | Registers a new account |
| `POST` | `/auth/refresh` | Public | Rotates refresh token and returns a fresh access token |
| `POST` | `/auth/logout` | Authenticated | Revokes current refresh token session |
| `GET` | `/auth/profile` | Authenticated | Returns current authenticated user profile |
| `POST` | `/auth/forgot-password` | Public | Issues password reset token |
| `POST` | `/auth/reset-password` | Public | Updates password using reset token |

---

## 2. Customer Management

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/customers` | ADMIN, STAFF | Paginated list of customers (`page`, `pageSize`, `search`) |
| `GET` | `/customers/:id` | ADMIN, STAFF, CUSTOMER | Customer detail record with subscriptions and invoices |
| `POST` | `/customers` | ADMIN, STAFF | Create new customer (with address, GSTIN, contact details) |
| `PUT` | `/customers/:id` | ADMIN, STAFF | Update customer profile |
| `DELETE` | `/customers/:id` | ADMIN | Soft-deletes customer |

---

## 3. Products & Plans

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Authenticated | List all products with variant counts |
| `GET` | `/products/:id` | Authenticated | Product detail with variants and plans |
| `POST` | `/products` | ADMIN, STAFF | Create product with optional variants |
| `PUT` | `/products/:id` | ADMIN, STAFF | Update product |
| `GET` | `/plans` | Authenticated | List pricing plans (filtered by interval/product) |
| `POST` | `/plans` | ADMIN, STAFF | Create plan (price in paise, features JSON, trial period) |
| `PUT` | `/plans/:id` | ADMIN, STAFF | Update plan |

---

## 4. Taxes & Discounts

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/taxes` | Authenticated | List tax rates |
| `POST` | `/taxes` | ADMIN | Create tax rate (rate stored in basis points, e.g. 1800 = 18%) |
| `PUT` | `/taxes/:id` | ADMIN | Update tax rate |
| `GET` | `/discounts` | Authenticated | List discount codes with usage counts |
| `POST` | `/discounts` | ADMIN, STAFF | Create percentage or fixed discount code |
| `PUT` | `/discounts/:id` | ADMIN, STAFF | Update discount limits and validity |

---

## 5. Quotations

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/quotations` | ADMIN, STAFF | List quotations with search and status filter |
| `GET` | `/quotations/:id` | Authenticated | Quotation details with line items |
| `POST` | `/quotations` | ADMIN, STAFF | Create quotation with calculated line items and taxes |
| `PUT` | `/quotations/:id/status`| ADMIN, STAFF | Update quotation status (`SENT`, `REJECTED`, etc.) |
| `POST` | `/quotations/:id/accept`| CUSTOMER, ADMIN | Accept quotation (validates customer identity) |

---

## 6. Subscriptions

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/subscriptions` | Authenticated | List subscriptions with customer & plan details |
| `GET` | `/subscriptions/:id` | Authenticated | Subscription detail with line items & invoices |
| `POST` | `/subscriptions` | ADMIN, STAFF | Create new subscription |
| `PUT` | `/subscriptions/:id/status`| ADMIN, STAFF | Execute state transition (`ACTIVE`, `PAUSED`, `CANCELLED`) |

---

## 7. Invoices & Payments

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/invoices` | Authenticated | List invoices with status, amounts, and customer info |
| `GET` | `/invoices/:id` | Authenticated | Complete invoice breakdown with lines and payments |
| `POST` | `/invoices` | ADMIN, STAFF | Manually generate an invoice |
| `GET` | `/payments` | Authenticated | List recorded payment transactions |
| `POST` | `/payments` | ADMIN, STAFF | Record payment transaction (updates invoice amounts) |

---

## 8. Billing Engine & Reports

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/billing/run` | ADMIN | Trigger automated recurring billing cycle |
| `GET` | `/billing/runs` | ADMIN, STAFF | List history of billing runs with processed stats |
| `GET` | `/reports/dashboard` | ADMIN, STAFF | Real-time aggregated KPIs (MRR, ARR, Cashflow, Active Subs) |
| `GET` | `/reports/revenue-by-month`| ADMIN, STAFF | Monthly revenue breakdown (last 12 months) |
| `GET` | `/reports/subscriptions-by-status`| ADMIN, STAFF | Breakdown of subscriptions by lifecycle status |
| `GET` | `/reports/invoices-by-status`| ADMIN, STAFF | Breakdown of invoices by payment status |
| `GET` | `/reports/plan-distribution`| ADMIN, STAFF | Subscriptions distribution across plans |
| `GET` | `/audit-logs` | ADMIN | Paginated immutable audit trail |
