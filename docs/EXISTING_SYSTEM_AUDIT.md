# Existing System Audit — Book-and-Pay baseline (tag bookpay-submit-1)

Date: 2026-09-21. Branch: feat/esim-connector. Baseline tag: bookpay-submit-1.
No secret values recorded — names and locations only.

## Runtime
- Language: JavaScript (Node 22 per Railway logs v22.23.2)
- Framework: Express 4.19.2, cors 2.8.5, npm, lockfile package-lock.json
- Entry: src/server.js, start: `node src/server.js`, dev: `node --watch src/server.js`
- Env PORT honored, listens on 0.0.0.0. Dockerfile: node:22-alpine, no hardcoded PORT, EXPOSE 8080, CMD npm start.
- Health: GET /health -> {ok, version}. OpenAPI: GET /openapi.json (single file, servers .../v1).

## Connector transport / auth
- Muse transport: Raw API + public OpenAPI 3.0.3 (NOT MCP). Verified in submit form step 2 (Raw API selected).
- Auth: `Authorization: Bearer <token>` checked by length only in `auth()` middleware (src/server.js). No per-merchant keys, no OAuth. Tokens via Muse Secure Credentials Store. Demo token: test12345678 (public demo only).
- Identity: req.merchantId hardcoded 'demo-merchant'. No user scoping — all callers share catalog/bookings.
- Connector routes: /v1/services (optional ?category), /v1/availability (?service_id&date), /v1/quotes, /v1/bookings (Idempotency-Key), /v1/bookings/:id, /v1/bookings/:id/cancel, /v1/payments/deposit (stub intent), /v1/merchants (public POST/GET), /merchant (landing page).

## Payments
- Adapter: stub. POST /v1/payments/deposit validates booking_id+amount, returns {status: deposit_intent_created, payment_id: pi_<ts>, stripe_link_hint}. No Stripe SDK, no webhook, no verification.
- Stripe account context: none configured in repo. No STRIPE_* env vars. No webhook URLs. No live/test separation.
- Merchant money: manual/Squares future. No Connect, no destination transfers.

## Persistence
- In-memory only: services[] seed (8 items, categories cleaning/consult/nail_salon/barber/beauty_salon), bookings Map keyed by Idempotency-Key, merchants[] array, seq counter.
- No database, no volume, no migrations. Railway redeploy wipes bookings/merchants. No background jobs, no callbacks owed. Outstanding demo hold bk_1 was cancelled via API (status cancelled) before tag.

## Railway
- Service: muse-book-pay-production.up.railway.app (domain known; project/service IDs not recorded here — copy from dashboard if needed).
- Start: npm start. Healthcheck path: /health. Deploys from main (auto). Branch feat/esim-connector NOT deployed.
- Usage: Free-trial $5 credit context per spec; actual consumption not measured here.

## Reuse plan for eSIM (no Book-Pay breakage)
- Reuse: Express app, PORT/0.0.0.0 pattern, /health, Bearer middleware shape (to be hardened with user scoping), Idempotency-Key pattern, Railway service, docs/ Pages pattern for policies.
- Do NOT reuse: stub deposit as eSIM payment proof; shared in-memory stores for orders; single demo-merchant identity for eSIM ownership.
- eSIM module: new isolated `src/esim/*` (mock provider + fixtures), new routes under `/esim/*`, new `esim-openapi.json` served separately. No changes to /v1/* behavior. Kill switches + ALLOW_LIVE_SALES=false default. SQLite only if no durable DB and single instance — currently none, so mock stays memory-only with explicit non-persistence labels.
