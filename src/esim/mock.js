// eSIM mock module — NO live purchases. Fixtures only.
// Mounted under /esim/* by server.js on feat/esim-connector. Book-Pay /v1/* untouched.
const PLANS = [
  { id: 'mock_jp_2gb_7d', name: 'Japan 2GB / 7 days', destinations: ['JP'], data_mb: 2048, validity_days: 7, price: { currency: 'USD', minor: 950 }, topups: [{ id: 'mock_jp_1gb', name: 'Japan 1GB top-up', minor: 550 }], disclosures: ['Data-only.', 'Mock fixture — not purchasable live.'] },
  { id: 'mock_eu_5gb_15d', name: 'Europe 5GB / 15 days', destinations: ['FR', 'DE', 'IT', 'ES'], data_mb: 5120, validity_days: 15, price: { currency: 'USD', minor: 1900 }, topups: [{ id: 'mock_eu_2gb', name: 'Europe 2GB top-up', minor: 950 }], disclosures: ['Data-only.', 'Mock fixture — not purchasable live.'] },
  { id: 'mock_us_3gb_10d', name: 'USA 3GB / 10 days', destinations: ['US'], data_mb: 3072, validity_days: 10, price: { currency: 'USD', minor: 1200 }, topups: [{ id: 'mock_us_1gb', name: 'USA 1GB top-up', minor: 600 }], disclosures: ['Data-only.', 'Mock fixture — not purchasable live.'] }
];
const quotes = new Map();
const orders = new Map();
const refunds = new Map();
let n = 1;
const money = m => `$${(m.minor / 100).toFixed(2)}`;
function envelope(data, extra = {}) {
  return { ok: true, mode: 'mock', data, warnings: ['Mock supplier — no eSIM issued, no charge.'], next_actions: ['Complete Airalo approval + live config before sales.'], trace_id: `mock_trace_${Date.now()}`, ...extra };
}
const CSS = `*{box-sizing:border-box}body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:radial-gradient(1000px 500px at 70% -10%,#12325c 0%,#0a0c12 55%);color:#f2f4fa}.w{max-width:960px;margin:0 auto;padding:48px 22px 72px}.pill{font-size:12px;border:1px solid #263043;border-radius:99px;padding:5px 12px;color:#9aa3b8}h1{font-size:44px;margin:16px 0;letter-spacing:-1px}h1 span{background:linear-gradient(90deg,#60a5fa,#22c55e);-webkit-background-clip:text;background-clip:text;color:transparent}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}@media(max-width:800px){.grid{grid-template-columns:1fr}}.c{background:rgba(255,255,255,.04);border:1px solid #232a3d;border-radius:16px;padding:18px}.c b{font-size:17px}.m{color:#9aa3b8;font-size:13px}.p{font-size:26px;font-weight:800;margin:8px 0}button{background:#fff;color:#0a0c12;border:0;border-radius:10px;padding:11px 14px;font-weight:700;cursor:pointer;width:100%}a{color:#cbd5e1}.ok{color:#22c55e}.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}`;
function page(title, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${CSS}</style></head><body><div class="w"><span class="pill">eSIM · Mock — no charge, no issuance</span><h1>${title}</h1>${inner}<p class="m" style="margin-top:26px"><a href="/esim">Catalog</a> · <a href="/esim/health">Health</a> · <a href="/health">API health</a></p></div></body></html>`;
}
function router(app, auth) {
  app.get('/esim/health', (req, res) => res.json({ ok: true, mode: 'mock', live_sales: false }));
  // Catalog landing — public, flagship CSS
  app.get('/esim', (req, res) => {
    const cards = PLANS.map(p => `<div class="c"><b>${p.name}</b><div class="m">${p.destinations.join(', ')} · ${(p.data_mb / 1024).toFixed(0)}GB · ${p.validity_days} days · Data-only</div><div class="p">${money(p.price)}</div><div class="m">${p.disclosures.join(' ')}</div><div style="margin-top:10px"><button onclick="q('${p.id}')">Quote ${p.id}</button></div><div class="m" id="o-${p.id}"></div></div>`).join('');
    res.send(page('Travel eSIM <span>mock store</span>', `<p class="m">Fixtures only — nothing issued, nothing charged. Live sales disabled.</p><div class="grid">${cards}</div><div class="row"><a href="/merchant">Book-and-Pay merchant page</a></div><script>async function q(id){const r=await fetch('/esim/quotes',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer test12345678'},body:JSON.stringify({planId:id})});const j=await r.json();document.getElementById('o-'+id).innerHTML='Quote '+(j.data?.quote_id||j.error)+' — mock only, <a href=\"/esim/receipt/'+'\"'+'>receipt</a>';}</script>`));
  });
  app.get('/esim/plans', auth, (req, res) => {
    const dest = (req.query.destination || '').toUpperCase();
    const list = dest ? PLANS.filter(p => p.destinations.includes(dest)) : PLANS;
    res.json(envelope({ plans: list.slice(0, 3), freshness: 'mock-snapshot' }));
  });
  app.post('/esim/device-check', auth, (req, res) => {
    const { device = '', unlocked } = req.body || {};
    if (!device) return res.json(envelope({ status: 'needs_more_information', note: 'Send device model + unlocked status.' }));
    if (unlocked === false) return res.json(envelope({ status: 'incompatible', note: 'Locked handsets cannot use travel eSIMs.' }));
    res.json(envelope({ status: 'eligible_with_customer_confirmation', note: 'Customer must confirm unlocked + eSIM-capable before payment.' }));
  });
  app.post('/esim/quotes', auth, (req, res) => {
    const { planId } = req.body || {};
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return res.status(404).json({ ok: false, mode: 'mock', error: 'PLAN_UNAVAILABLE' });
    const q = { quote_id: `mock_q_${n++}`, planId: plan.id, plan: plan.name, total: plan.price, currency: 'USD', purchase_ready: false, expires_at: new Date(Date.now() + 15 * 60000).toISOString(), disclosures: [...plan.disclosures, 'Device check + live config required before checkout.'] };
    quotes.set(q.quote_id, q);
    res.json(envelope(q));
  });
  app.post('/esim/checkout', auth, (req, res) => {
    const { quoteId } = req.body || {};
    const q = quotes.get(quoteId);
    if (!q) return res.status(404).json({ ok: false, mode: 'mock', error: 'QUOTE_EXPIRED' });
    const o = { order_id: `mock_o_${n++}`, quote_id: quoteId, plan: q.plan, payment: 'awaiting_payment', fulfillment: 'not_started', delivery: 'not_ready', receipt_url: '', note: 'Pay nothing — mock only. Live sales disabled (ALLOW_LIVE_SALES=false).' };
    o.receipt_url = `/esim/receipt/${o.order_id}`;
    orders.set(o.order_id, o);
    res.json(envelope(o));
  });
  app.get('/esim/orders/:id', auth, (req, res) => {
    const o = orders.get(req.params.id);
    if (!o) return res.status(404).json({ ok: false, mode: 'mock', error: 'NOT_FOUND' });
    res.json(envelope(o));
  });
  app.get('/esim/usage/:id', auth, (req, res) => {
    const o = orders.get(req.params.id);
    if (!o) return res.status(404).json({ ok: false, mode: 'mock', error: 'NOT_FOUND' });
    res.json(envelope({ order_id: o.order_id, remaining_mb: null, note: 'Mock: no live telemetry. Freshness undisclosed — do not display as live usage.' }));
  });
  app.get('/esim/topups', auth, (req, res) => {
    const plan = PLANS.find(p => p.id === req.query.planId) || PLANS[0];
    res.json(envelope({ planId: plan.id, topups: plan.topups, note: 'Mock eligibility only.' }));
  });
  app.post('/esim/refunds', auth, (req, res) => {
    const { orderId, reason = '' } = req.body || {};
    const o = orders.get(orderId);
    if (!o) return res.status(404).json({ ok: false, mode: 'mock', error: 'NOT_FOUND' });
    const r = { refund_id: `mock_r_${n++}`, order_id: orderId, status: 'refund_pending', reason, note: 'Mock: customer refund tracked separately from supplier credit. Nothing refunded live.' };
    refunds.set(r.refund_id, r);
    res.json(envelope(r));
  });
  // Private receipt — flagship CSS, mock-labeled
  app.get('/esim/receipt/:id', (req, res) => {
    const o = orders.get(req.params.id);
    if (!o) return res.status(404).send(page('Receipt not found', `<p class="m">Unknown mock order ${req.params.id}.</p>`));
    const q = quotes.get(o.quote_id);
    res.send(page(`Receipt <span>${o.order_id}</span>`, `<div class="c"><b>${q?.plan || o.plan || 'eSIM order'}</b><div class="m">Mock fixture — no eSIM issued, no charge.</div><div class="row"><div class="c">Payment<div class="p" style="font-size:18px">${o.payment}</div></div><div class="c">Fulfillment<div class="p" style="font-size:18px">${o.fulfillment}</div></div><div class="c">Delivery<div class="p" style="font-size:18px">${o.delivery}</div></div></div><p class="m">Quote ${o.quote_id} · ${q ? money(q.total) + ' USD' : ''} · Installation via provider page after live approval. Support: billing → us; install/connectivity → confirmed supplier route.</p></div>`));
  });
}
module.exports = { router };
