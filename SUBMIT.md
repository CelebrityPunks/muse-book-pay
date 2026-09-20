# Muse Book-and-Pay — Submit Package

Built: Express REST API in `src/server.js`, OpenAPI in `src/openapi.json`
Local verify: `GET /health` -> {ok:true}

## Test as Custom Connector TODAY (no review)
1. Deploy to public HTTPS (Railway/Render/Fly). Muse runs in cloud VM, localhost won't work.
2. Set `servers[0].url` in openapi.json to your host.
3. In Muse: "Build a custom connector from [your openapi.json URL], list operations first, don't book anything yet."
4. Paste Bearer token into secure credential prompt, never chat.

## To submit to muse.ai/platform you need MORE than API:

1. Hosted API + public openapi.json URL
2. Auth: Bearer / API key (Secure Credentials Store compatible). OAuth if multi-tenant.
3. Stripe account with Link enabled for `/payments/deposit`
4. Privacy Policy URL + Terms URL + Support contact (required — your terms govern use)
5. Business info: name, logo, category, product description + 3 example prompts:
   - "Find me a cleaner Friday under $150 and book it"
   - "Quote a 30-min consult and take deposit"
   - "Cancel my booking bk_123"
6. Scopes doc: reads (services/availability) vs writes (book/pay/cancel) + approval setting
7. Demo merchant + test token for Meta e2e testing
8. Idempotency-Key on all POSTs (done), <2s latency, rate limits, input validation (anti prompt-injection)
9. Data handling doc: what you store, retention, revocation (deleting token cuts access)

Submit at http://muse.ai/platform -> Describe product -> Review (functional/security/legal + e2e) -> Directory + featured review.

Undisclosed by Meta: fees, rev-share, timeline. Don't assume.
