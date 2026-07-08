# Deploy Checklist (pre-public-launch)

Mark each before going public. Estimated effort: one weekend.

## Phase 1: Infrastructure (~3-4 hours)

- [ ] **Domain registered** (Namecheap/Porkbun, ~$10/year)
- [ ] **DNS on Cloudflare** (free plan: proxy on, SSL auto, DDoS basic)
- [ ] **GitHub repo created** (private), code pushed
- [ ] **Hosting chosen**: Railway ($5/mo) OR Render (free/$7/mo) OR DigitalOcean App Platform ($12/mo)
- [ ] **Managed MySQL** provisioned (Railway/Render add-on, or DO Managed DB)
- [ ] **Managed Redis** provisioned (or use database cache only to start)

## Phase 2: Deploy (1-2 hours)

- [ ] **Dockerfile of production** ready (in `.deploy/backend.Dockerfile`)
- [ ] **Env vars** configured in hosting dashboard from `.deploy/env.production.template`
- [ ] **APP_KEY generated** (`php artisan key:generate --show`)
- [ ] **New LARAVEL_INTERNAL_SECRET** (NOT the dev one)
- [ ] **All external API keys rotated** (Gemini, WhatsApp, Stripe, Telegram, etc.)
- [ ] **First deploy successful**, app responds
- [ ] **Domain pointed** to hosting (CNAME or A record)
- [ ] **HTTPS works** (Cloudflare proxy auto-issues cert)

## Phase 3: Production hardening (2-3 hours)

- [ ] **Sentry** integrated (free, 5K errors/mo)
  - `composer require sentry/sentry-laravel` in backend
  - `pip install sentry-sdk[fastapi]` in channels-service & ai-service
- [ ] **UptimeRobot** monitoring (free, 50 monitors)
  - HTTP check on `/`, `/api/health`, channels-service, ai-service
- [ ] **Backup script** deployed to B2 (`.deploy/backup-db.sh`)
  - First manual backup run + restore test (CRITICAL: untested backup = no backup)
- [ ] **Rate limiting** confirmed in Laravel (login: 5/min, APIs: 60/min)
- [ ] **APP_DEBUG=false** in production
- [ ] **CORS** restricted to your real frontend domain (not localhost)
- [ ] **Sentry source maps** uploaded for frontend

## Phase 4: Legal / compliance (1-2 hours)

- [ ] **Privacy policy** published (use a generator + lawyer review later)
- [ ] **Terms of service** published
- [ ] **Cookie banner** if you use any non-essential cookies
- [ ] **Data deletion endpoint** (GDPR-style right to be forgotten)
  - User can request account deletion, processed within 30 days
- [ ] **Data export endpoint** (user can download their data)

## Phase 5: Pre-public smoke test (1 hour)

- [ ] Sign up flow works end-to-end
- [ ] Login + logout
- [ ] Password reset email
- [ ] WhatsApp channel: send + receive
- [ ] AI service responds
- [ ] Stripe payment (test mode first, then live)
- [ ] All 4 services healthy in hosting dashboard
- [ ] Backup ran successfully + restore tested
- [ ] UptimeRobot alerts working (test by stopping service)

## Phase 6: Launch day

- [ ] **Soft launch**: invite 3-5 trusted beta users, watch Sentry + logs for 48h
- [ ] **Fix what breaks** (there will be something)
- [ ] **Public announcement** only after 48h clean
- [ ] **Monitoring active**: check Sentry/UptimeRobot daily for first week

---

## Cost summary

| Item | Monthly |
|---|---|
| Hosting (Railway Pro or Render) | $5-10 |
| Domain (annual ÷ 12) | ~$0.83 |
| Cloudflare | $0 |
| Sentry | $0 |
| UptimeRobot | $0 |
| Backblaze B2 | $0 (under 10GB) |
| **Total** | **~$6-12 USD/mo** |

## When to upgrade

- **>100 active users OR >50GB DB**: move to DigitalOcean or Hetzner ($20-30/mo), get a proper VPS
- **>1000 users**: time to split DB read replicas, add Redis Sentinel
- **You start charging $1K+/mo**: invest in AWS/GCP proper infra
