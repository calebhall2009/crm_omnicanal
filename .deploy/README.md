# Deploy resources

Everything you need is in this folder. Order of use:

## 1. Read first
- `CHECKLIST.md` — full pre-launch checklist, do it in order

## 2. Files to use
- `backend.Dockerfile` — production Laravel image (php-fpm + nginx + supervisor)
  - **Rename to `Dockerfile`** and put in your `backend/` folder when ready
  - OR copy its content into your existing `backend/Dockerfile`
- `env.production.template` — copy values into your hosting dashboard env vars
- `backup-db.sh` — MySQL backup script (after you have a managed MySQL)

## 3. Don't commit
- Anything in this folder can be committed (templates only, no secrets)
- The `env.production.template` has placeholders, not real keys

## Decisions you still need to make

1. **Hosting**: Railway vs Render vs DigitalOcean App Platform
2. **Domain registrar**: Namecheap vs Porkbun vs Cloudflare Registrar
3. **Managed MySQL**: hosting add-on (easiest) vs DigitalOcean Managed DB vs PlanetScale
4. **Email provider**: Resend (easiest) vs Postmark (best deliverability) vs SES (cheapest at scale)
5. **When to launch beta**: this week? next week? after fixing X?

## Don't change in your repo

- `docker-compose.yml` — keep it as is, it's your dev environment
- `backend/Dockerfile` — current one is fine for local dev
- Any service code, configs, or business logic

The deploy Dockerfile is a NEW file in `.deploy/`. You choose when to wire it up.
