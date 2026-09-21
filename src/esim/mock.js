// eSIM mock module — NO live purchases. Fixtures only.
// Mounted under /esim/* by server.js on feat/esim-connector. Book-Pay /v1/* untouched.
const PLANS = [
  { id: 'mock_jp_2gb_7d', name: 'Japan 2GB / 7 days', destinations: ['JP'], data_mb: 2048, validity_days: 7, price: { currency: 'USD', minor: 950 }, disclosures: ['Data-only.', 'Mock fixture — not purchasable live.'] },
  { id: 'mock_eu_5gb_15d', name: 'Europe 5GB / 15 days', destinations: ['FR', 'DE', 'IT', 'ES'], data_mb: 5120, validity_days: 15, price: { currency: 'USD', minor: 1900 }, disclosures: ['Data-only.', 'Mock fixture — not purchasable live.'] },
  { id: 'mock_us_3gb_10d', name: 'USA 3GB / 10 days', destinations: ['US'], data_mb: 3072, validity_days: 10, price: { currency: 'USD', minor: 1200 }, disclosures: ['Data-only.', 'Mock fixture — not purchasable live.'] }
];
const quotes = new Map();
const orders = new Map();
let n = 1;
function envelope(data, extra = {}) {
  return { ok: true, mode: 'mock', data, warnings: ['Mock supplier — no eSIM issued, no charge.'], next_actions: ['Complete Airalo approval + live config before sales.'], trace_id: `mock_trace_${Date.now()}`, ...extra };
}
function router(app, auth) {
  app.get('/esim/health', (req, res) => res.json({ ok: true, mode: 'mock', live_sales: false }));
  app.get('/esim/plans', auth, (req, res) => {
    const dest = (req.query.destination || '').toUpperCase();
    const list = dest ? PLANS.filter(p => p.destinations.includes(dest)) : PLANS;
    res.json(envelope({ plans: list.slice(0, 3), freshness: 'mock-snapshot' }));
  });
  app.post('/esim/quotes', auth, (req, res) => {
    const { planId } = req.body || {};
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return res.status(404).json({ ok: false, mode: 'mock', error: 'PLAN_UNAVAILABLE' });
    const q = { quote_id: `mock_q_${n++}`, planId: plan.id, total: plan.price, currency: 'USD', purchase_ready: false, expires_at: new Date(Date.now() + 15 * 60000).toISOString(), disclosures: [...plan.disclosures, 'Device check + live config required before checkout.'] };
    quotes.set(q.quote_id, q);
    res.json(envelope(q));
  });
  app.post('/esim/checkout', auth, (req, res) => {
    // Mock checkout: creates pending order, NEVER provisions.
    const { quoteId } = req.body || {};
    const q = quotes.get(quoteId);
    if (!q) return res.status(404).json({ ok: false, mode: 'mock', error: 'QUOTE_EXPIRED' });
    const o = { order_id: `mock_o_${n++}`, quote_id: quoteId, payment: 'awaiting_payment', fulfillment: 'not_started', delivery: 'not_ready', note: 'Pay nothing — mock only. Live sales disabled (ALLOW_LIVE_SALES=false).' };
    orders.set(o.order_id, o);
    res.json(envelope(o));
  });
  app.get('/esim/orders/:id', auth, (req, res) => {
    const o = orders.get(req.params.id);
    if (!o) return res.status(404).json({ ok: false, mode: 'mock', error: 'NOT_FOUND' });
    res.json(envelope(o));
  });
}
module.exports = { router };
