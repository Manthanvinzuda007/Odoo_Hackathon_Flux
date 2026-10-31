# Brightloop Security Architecture

## 1. Authentication & Password Security

- **Argon2id Hashing:** All passwords are encrypted using memory-hard Argon2id (`argon2` npm package) with tuned time and memory cost parameters. Plaintext passwords or weak hashes (MD5, SHA1, plain SHA256) are never used.
- **Account Lockout Policy:** Protects against brute-force password guessing. Accounts are locked for 15 minutes after 5 consecutive failed login attempts (`failedAttempts >= 5`).
- **JWT Access & Refresh Token Rotation:**
  - Access tokens have short lifetimes (15 minutes).
  - Refresh tokens are single-use (`RefreshToken` table). Whenever a refresh token is used, it is revoked, and a newly minted refresh token is issued.
  - If a revoked refresh token is presented, reuse detection activates, revoking all existing sessions for that user to protect against token theft.

---

## 2. Customer Isolation & Data Boundaries

- **Strict Multi-Tenant Customer Isolation:**
  - A user with role `CUSTOMER` can ONLY access records belonging to their own customer account.
  - Isolation is enforced strictly at the backend NestJS service/controller level by checking the user's attached `customerProfileId` or customer ownership before executing queries.
  - Direct object references (e.g., passing another customer's ID in `/invoices/:id` or `/quotations/:id/accept`) return `403 Forbidden`.

---

## 3. Financial Data Integrity & Immutability

- **Server-Side Validation:** All prices, tax percentages, and totals are computed strictly on the backend. Client-submitted prices are ignored.
- **Append-Only Payments:** Payments cannot be silently deleted or edited. Any corrections require credit notes or reversal transactions.
- **Immutable Tax Snapshots:** When an invoice line is created, the applied tax rate and tax amount are copied directly onto the `InvoiceLine`. Subsequent edits to the `Tax` entity never alter historical invoices.
- **Audit Logging:** Crucial domain mutations (`CREATE`, `UPDATE`, `DELETE`, `EXECUTE`) write an immutable log to `AuditLog` capturing actor ID, timestamp, target entity, and detailed metadata changes.

---

## 4. Network, Transport & API Hardening

- **Helmet:** Sets modern security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`).
- **CORS:** Restricts cross-origin requests to configured trusted origins with credentials support enabled.
- **Rate Limiting:** Protects endpoints using `@nestjs/throttler` (default: 100 requests per minute per IP, with stricter thresholds on `/auth/login`).
- **Structured Redaction:** NestJS Pino logs redact sensitive keys (`req.headers.authorization`, `req.headers.cookie`, password payloads) to prevent accidental credential leakage in logs.
