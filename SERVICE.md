# Book-and-Pay — Directory Listing Pack

## Name
Book-and-Pay

## Tagline
Book any service and pay deposit via chat

## Short description (for muse.ai/platform form)
Book-and-Pay gives Muse live availability, fixed quotes, idempotent holds, cancel, and Stripe Link deposits — all from natural language. Built for cleaners, barbers, clinics, consultants, rentals.

## Long description
People reach your service just by asking. Book-and-Pay exposes 7 typed operations: list services, get availability, create quote, hold booking (Idempotency-Key safe), get booking, cancel booking, create deposit intent. Reads are separate from writes; all writes require user approval in Muse. You pay the merchant via Stripe Link — we never hold funds. Test merchant + demo token included for Meta e2e.

## Category
Business / Bookings & Payments

## Logo
- 512 PNG: `assets/logo-512.png` in repo
- Raw: https://raw.githubusercontent.com/CelebrityPunks/muse-book-pay/main/assets/logo-512.png
- Full: `assets/logo.png`
- Design: blue calendar + green booked check + blue card = book + pay. High contrast at 32px, reads instantly in directory.

## Example prompts (paste into submit)
1. "Find me a cleaner Friday under $150 and book it"
2. "Quote a 30-min consult and pay deposit"
3. "Cancel my booking bk_1"

## Scopes
Reads (no charge): services, availability, getBooking
Writes (require approval): quotes, bookings, cancel, payments/deposit

## Links for submit
- API base: https://muse-book-pay-production.up.railway.app
- Spec: https://muse-book-pay-production.up.railway.app/openapi.json
- Health: https://muse-book-pay-production.up.railway.app/health
- Merchant onboard: https://muse-book-pay-production.up.railway.app/merchant
- Privacy: https://celebritypunks.github.io/muse-book-pay/privacy.html
- Terms: https://celebritypunks.github.io/muse-book-pay/terms.html
- Support: bob.haddad.33@gmail.com
- Demo token: test12345678
- Repo: https://github.com/CelebrityPunks/muse-book-pay
