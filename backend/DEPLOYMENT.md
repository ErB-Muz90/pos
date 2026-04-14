# Bandu POS — Deployment Checklist

## Before First Deploy

### Infrastructure
- [ ] Managed PostgreSQL provisioned (Supabase / Railway / RDS)
- [ ] Redis provisioned (Upstash free tier or Railway Redis)
- [ ] Backend hosting chosen (Railway / Render / Fly.io / EC2)
- [ ] Domain + SSL certificate configured for API
- [ ] Frontend deployed to Netlify with `VITE_API_URL` set

### Secrets
- [ ] `JWT_SECRET` — 64-char random base64 (`node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`)
- [ ] `JWT_REFRESH_SECRET` — different 64-char random base64
- [ ] `RESET_PASSWORD_SECRET` — another 64-char random base64
- [ ] `DATABASE_URL` — production Postgres connection string with `sslmode=require`
- [ ] `REDIS_HOST` / `REDIS_PASSWORD` — production Redis
- [ ] `SMTP_*` — real mail provider (Resend / SendGrid / Mailgun recommended)
- [ ] `SENTRY_DSN` — from sentry.io project settings
- [ ] `FLUTTERWAVE_SECRET_HASH` or `STRIPE_WEBHOOK_SECRET` — from payment provider dashboard
- [ ] `FRONTEND_URL` — comma-separated list of allowed origins

### Database
- [ ] Run `npx prisma migrate deploy` (NOT `migrate dev`) on production DB
- [ ] Verify migration ran: `npx prisma db pull` should match schema
- [ ] Enable automated daily backups on your managed DB provider

### Security
- [ ] `NODE_ENV=production` set
- [ ] `ENABLE_SWAGGER=false` (Swagger disabled in production by default)
- [ ] JWT secrets are NOT the dev defaults from `.env`
- [ ] CORS `FRONTEND_URL` is restricted to your actual domain(s)
- [ ] Billing webhook secrets are set and match your payment provider

## Deploy Steps

```bash
# 1. Install deps
npm ci --production

# 2. Run DB migrations
npx prisma migrate deploy

# 3. Build
npm run build

# 4. Start
node dist/main.js
```

Or with PM2:
```bash
pm2 start dist/main.js --name bandu-pos-api
pm2 save
```

## Post-Deploy Smoke Test

```bash
API_URL=https://api.yourdomain.com bash scripts/smoke-test.sh
```

Expected output: all ✅, 0 failures.

## Monitoring

- Set up UptimeRobot (free) to ping `GET /health` every 5 minutes
- Alert on `status: degraded` (DB or Redis down)
- Check Sentry for error spikes after deploy

## Rollback

```bash
# Revert to previous release
git checkout <previous-tag>
npm ci --production
npm run build
pm2 restart bandu-pos-api
```

> Note: Do NOT run `prisma migrate reset` in production. If a migration needs reverting, write a new migration.
