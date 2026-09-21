// Universal Book-and-Pay API — Muse-ready
// Design rules for agents: narrow typed endpoints, idempotent writes,
// read vs write separation, <2s responses, Bearer auth via Secure Credentials Store.
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8787;

// --- Simple auth (replace with real check + Stripe Link in prod) ---
// Muse sends: Authorization: Bearer <token> from Secure Credentials Store
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ') || h.length < 12) {
    return res.status(401).json({ error: 'missing_or_invalid_bearer_token' });
  }
  req.merchantId = 'demo-merchant';
  next();
}

// --- Catalog: discoverable by category (seed — replace with DB + Square import) ---
const services = [
  { id: 'cleaning_std', merchant: 'Spark Clean SD', category: 'cleaning', name: 'Standard Cleaning', duration_min: 120, base_price_cents: 12000, currency: 'usd' },
  { id: 'consult_30', merchant: 'Book-and-Pay Demo', category: 'consult', name: '30-min Consult', duration_min: 30, base_price_cents: 7500, currency: 'usd' },
  { id: 'nails_gel', merchant: 'Luxe Nails North Park', category: 'nail_salon', name: 'Gel Manicure', duration_min: 60, base_price_cents: 6500, currency: 'usd' },
  { id: 'nails_pedi', merchant: 'Luxe Nails North Park', category: 'nail_salon', name: 'Spa Pedicure', duration_min: 60, base_price_cents: 7000, currency: 'usd' },
  { id: 'hair_fade', merchant: 'True Fade Barbers', category: 'barber', name: 'Skin Fade', duration_min: 30, base_price_cents: 4000, currency: 'usd' },
  { id: 'hair_beard', merchant: 'True Fade Barbers', category: 'barber', name: 'Beard Sculpt', duration_min: 20, base_price_cents: 2500, currency: 'usd' },
  { id: 'beauty_facial', merchant: 'Glow Studio SD', category: 'beauty_salon', name: 'Signature Facial', duration_min: 50, base_price_cents: 9500, currency: 'usd' },
  { id: 'beauty_brows', merchant: 'Glow Studio SD', category: 'beauty_salon', name: 'Brow Lamination', duration_min: 40, base_price_cents: 8000, currency: 'usd' }
];
const bookings = new Map(); // idempotencyKey -> booking
let seq = 1;

// Health (no auth, for Meta e2e + uptime)
app.get('/health', (req, res) => res.json({ ok: true, version: '0.1.0' }));

// Merchant onboard page (no auth — public)
app.get('/merchant', (req, res) => res.sendFile(__dirname + '/merchant.html'));

// Merchant registry (MVP in-memory — move to Postgres before scale)
const merchants = [];
app.post('/v1/merchants', (req, res) => {
  const { business, service, hours, stripe_email } = req.body || {};
  if (!business || !service) return res.status(400).json({ error: 'business and service required' });
  const m = { merchant_id: `m_${Date.now().toString(36)}`, business, service, hours: hours || '', stripe_email: stripe_email || '', created_at: new Date().toISOString() };
  merchants.push(m);
  console.log('new merchant', m.merchant_id, business);
  res.status(201).json(m);
});
app.get('/v1/merchants', (req, res) => res.json({ merchants }));

// OpenAPI doc
app.get('/openapi.json', (req, res) => res.sendFile(__dirname + '/openapi.json'));

// eSIM mock module (feat/esim-connector) — Book-Pay /v1/* untouched
try { require('./esim/mock').router(app, auth); } catch (e) { console.log('esim mock not loaded', e.message); }

// --- Reads (least-privilege safe) ---
app.get('/v1/services', auth, (req, res) => {
  const { category } = req.query;
  const list = category ? services.filter(s => s.category === category) : services;
  res.json({ services: list });
});

app.get('/v1/availability', auth, (req, res) => {
  const { service_id, date } = req.query;
  if (!service_id || !date) return res.status(400).json({ error: 'service_id and date required (YYYY-MM-DD)' });
  // Demo slots — replace with real calendar logic
  res.json({
    service_id, date,
    slots: [`${date}T09:00:00`, `${date}T13:00:00`, `${date}T16:00:00`],
    currency: 'usd'
  });
});

app.get('/v1/bookings/:id', auth, (req, res) => {
  const found = [...bookings.values()].find(b => b.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'not_found' });
  res.json(found);
});

// --- Writes (idempotent, require confirmation client-side) ---
app.post('/v1/quotes', auth, (req, res) => {
  const { service_id, notes } = req.body || {};
  const svc = services.find(s => s.id === service_id);
  if (!svc) return res.status(400).json({ error: 'unknown service_id' });
  res.json({
    quote_id: `q_${Date.now()}`,
    service_id, amount_cents: svc.base_price_cents,
    currency: svc.currency, notes: notes || '',
    expires_at: new Date(Date.now() + 30 * 60000).toISOString()
  });
});

app.post('/v1/bookings', auth, (req, res) => {
  const key = req.headers['idempotency-key'];
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header required' });
  if (bookings.has(key)) return res.json(bookings.get(key)); // safe retry

  const { service_id, slot, customer_name, quote_id } = req.body || {};
  if (!service_id || !slot) return res.status(400).json({ error: 'service_id and slot required' });

  const booking = {
    id: `bk_${seq++}`,
    service_id, slot, customer_name: customer_name || 'Muse user',
    quote_id: quote_id || null,
    status: 'held_pending_deposit',
    created_at: new Date().toISOString()
  };
  bookings.set(key, booking);
  res.status(201).json(booking);
});

app.post('/v1/payments/deposit', auth, (req, res) => {
  const key = req.headers['idempotency-key'];
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header required' });
  const { booking_id, amount_cents, currency = 'usd' } = req.body || {};
  if (!booking_id || !amount_cents) return res.status(400).json({ error: 'booking_id and amount_cents required' });
  // TODO: create Stripe PaymentIntent + Link here. Return client intent for now.
  res.json({
    booking_id, amount_cents, currency,
    status: 'deposit_intent_created',
    stripe_link_hint: 'complete via Stripe Link',
    payment_id: `pi_${Date.now()}`
  });
});

app.post('/v1/bookings/:id/cancel', auth, (req, res) => {
  const found = [...bookings.values()].find(b => b.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'not_found' });
  found.status = 'cancelled';
  res.json(found);
});

app.listen(PORT, '0.0.0.0', () => console.log(`muse-book-pay on :${PORT}`));
