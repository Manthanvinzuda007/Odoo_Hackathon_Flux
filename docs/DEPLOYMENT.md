# Brightloop Production Deployment Guide

## 1. Production Deployment Checklist

- [x] Strict TypeScript compilation passes across all workspaces (`pnpm typecheck`)
- [x] Production build passes (`pnpm build`)
- [x] All unit test suites pass (`pnpm test`)
- [x] PostgreSQL 16+ configured with connection pooling
- [x] Redis 7+ configured with authentication
- [x] Strong random secrets set for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [x] Environment configured with `NODE_ENV=production`
- [x] SMTP server configured with credentials for transactional emails
- [x] CORS origin set to production frontend domain
- [x] Cookie settings enabled with `secure: true` for HTTPS environments

---

## 2. Docker Compose Deployment

A complete production-ready `docker-compose.yml` is provided at the repository root.

```bash
# Start all supporting services in detached mode
docker compose up -d

# Verify services are healthy
docker compose ps
```

Services started:
- `postgres`: PostgreSQL 16 on port `5432` with volume persistence
- `redis`: Redis 7 on port `6379`
- `mailhog`: Local SMTP capture on port `1025` and Web UI on port `8025`

---

## 3. Database Migration in Production

Always run migrations via Prisma deploy in CI/CD or deployment hooks:

```bash
# Run pending Prisma migrations safely
pnpm db:migrate:prod

# Verify schema state
pnpm db:studio
```

---

## 4. Running Application Processes

### API Server:
```bash
cd apps/api
node dist/main.js
```

### Web Frontend (Nginx / Static Host):
The compiled Vite assets in `apps/web/dist` can be served via Nginx, Cloudflare Pages, AWS S3 + CloudFront, or any static file server:

```nginx
server {
    listen 80;
    server_name app.brightloop.in;
    root /var/www/brightloop/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Health Probes

- **Liveness & Readiness Probe:** `GET /api/v1/health`
  Returns HTTP 200 with database connectivity and memory metrics.
