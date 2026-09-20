# Book-and-Pay — Directory Listing Pack

## Name
Book-and-Pay

## Tagline (60 chars)
Book any service and take deposit via chat

## Short description (for muse.ai/platform form)
Universal booking + deposit API for Muse. Muse checks availability, creates fixed quotes, holds slots idempotently, cancels, and starts Stripe Link deposits — all from natural language. Built for cleaners, barbers, clinics, consultants, rentals.

## Long description
People reach your service just by asking. Book-and-Pay gives Muse 7 typed operations: list services, get availability, create quote, hold booking (Idempotency-Key safe), get booking, cancel booking, create deposit intent. Reads are separate from writes; all writes require user approval in Muse. Test merchant included for Meta e2e.

## Category
Business / Bookings & Payments

## Logo
- SVG: `assets/logo.svg` in repo
- Raw: https://raw.githubusercontent.com/CelebrityPunks/muse-book-pay/main/assets/logo.svg
- 512 PNG: export from SVG at 512x512 (open SVG in Chrome → screenshot, or Figma export). Upload the PNG in the submit form.
- Design: dark rounded square, white calendar, green check = booked + paid.

## Example prompts (paste into submit)
1. "Find me a cleaner Friday under $150 and book it"
2. "Quote a 30-min consult and take deposit"
3. "Cancel my booking bk_1"

## Scopes
Reads (no charge): services, availability, getBooking
Writes (require approval): quotes, bookings, cancel, payments/deposit

## Links for submit
- API base: https://muse-book-pay-production.up.railway.app
- Spec: https://muse-book-pay-production.up.railway.app/openapi.json
- Health: https://muse-book-pay-production.up.railway.app/health
- Privacy: https://celebritypunks.github.io/muse-book-pay/privacy.html
- Terms: https://celebritypunks.github.io/muse-book-pay/terms.html
- Support: bob.haddad.33@gmail.com
- Demo token: test12345678
- Repo: https://github.com/CelebrityPunks/muse-book-pay
