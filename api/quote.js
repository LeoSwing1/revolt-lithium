// POST /api/quote — Vercel serverless function (Node 18+). Handles two lead kinds: 'quote' and 'dealer'.
//
// Always:   validate → (Turnstile) → email customer + business via Resend → respond { ok, quoteNo }
// Optional (each runs only when its env vars are set; failures never block the customer's reply):
//   Google Sheet log ......... SHEET_WEBHOOK_URL            (scripts/google-sheets-webhook.gs)
//   Zoho CRM lead ............ ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_DC (in | com | eu …)
//   GA4 Measurement Protocol . GA4_MEASUREMENT_ID, GA4_API_SECRET
//   Meta Conversions API ..... META_PIXEL_ID, META_CAPI_TOKEN (dedupes with the browser pixel by event_id = quoteNo)
//   WhatsApp Cloud API ....... WA_TOKEN, WA_PHONE_ID, WA_NOTIFY_TO (owner number, 91XXXXXXXXXX), WA_TEMPLATE (optional)
//   Cloudflare Turnstile ..... TURNSTILE_SECRET (pair with turnstileSiteKey in js/config.js)
// Email:    RESEND_API_KEY, QUOTE_FROM ("Revolt Lithium <quotes@yourdomain>"), QUOTE_TO (default livgreenlithium@gmail.com)
import { createHash } from 'node:crypto';
import { CATALOG, GST_RATE, QUOTE_VALID_DAYS } from './catalog.js';

const E = process.env;
const sha = v => createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
const PHONES = ['97560 73477', '99901 38500'];
const hits = new Map();                                   // basic per-IP rate limit (5 / 10 min / instance)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const clip = (s, n = 500) => String(s ?? '').trim().slice(0, n);
const withTimeout = (p, ms = 6000) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);

/* ---------------- integrations ---------------- */
async function verifyTurnstile(token, ip) {
  if (!E.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const r = await withTimeout(fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: E.TURNSTILE_SECRET, response: token, remoteip: ip })
  }));
  return (await r.json()).success === true;
}

let zohoToken = { v: '', exp: 0 };
async function zohoLead(L) {
  if (!(E.ZOHO_CLIENT_ID && E.ZOHO_CLIENT_SECRET && E.ZOHO_REFRESH_TOKEN)) return 'skipped';
  const dc = E.ZOHO_DC || 'in';
  if (Date.now() > zohoToken.exp) {
    const t = await (await withTimeout(fetch(`https://accounts.zoho.${dc}/oauth/v2/token`, {
      method: 'POST', body: new URLSearchParams({ refresh_token: E.ZOHO_REFRESH_TOKEN, client_id: E.ZOHO_CLIENT_ID, client_secret: E.ZOHO_CLIENT_SECRET, grant_type: 'refresh_token' })
    }))).json();
    if (!t.access_token) throw new Error('zoho auth');
    zohoToken = { v: t.access_token, exp: Date.now() + (t.expires_in - 120) * 1000 };
  }
  const [first, ...rest] = L.name.split(/\s+/);
  const rec = {
    First_Name: rest.length ? first : '', Last_Name: rest.length ? rest.join(' ') : first,
    Company: L.business || (L.kind === 'dealer' ? 'Dealer prospect' : 'Individual'),
    Email: L.email, Mobile: L.phone, City: L.city, Lead_Source: L.attribution.utm_source ? `Web - ${L.attribution.utm_source}` : 'Website',
    Description: [`${L.kind === 'dealer' ? 'Dealer enquiry' : 'Quotation'} ${L.quoteNo}`, `Product: ${L.product} × ${L.qty}`, `Buyer: ${L.buyer}`, L.message && `Message: ${L.message}`, `Page: ${L.page}`].filter(Boolean).join('\n')
  };
  const r = await withTimeout(fetch(`https://www.zohoapis.${dc}/crm/v5/Leads`, {
    method: 'POST', headers: { Authorization: `Zoho-oauthtoken ${zohoToken.v}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [rec], trigger: ['workflow', 'approval'] })
  }));
  return r.ok ? 'ok' : 'error';
}

async function ga4(L) {
  if (!(E.GA4_MEASUREMENT_ID && E.GA4_API_SECRET && L.gaClientId)) return 'skipped';
  const r = await withTimeout(fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${E.GA4_MEASUREMENT_ID}&api_secret=${E.GA4_API_SECRET}`, {
    method: 'POST', body: JSON.stringify({
      client_id: L.gaClientId,
      events: [{ name: 'generate_lead_server', params: { lead_type: L.kind, transaction_id: L.quoteNo, item_id: L.model, quantity: L.qty, city: L.city, currency: 'INR', value: 1 } }]
    })
  }));
  return r.ok ? 'ok' : 'error';
}

async function metaCapi(L, req, ip) {
  if (!(E.META_PIXEL_ID && E.META_CAPI_TOKEN)) return 'skipped';
  const ud = { em: [sha(L.email)], ph: [sha('91' + L.phone10)], ct: L.city ? [sha(L.city.replace(/\s/g, ''))] : undefined, country: [sha('in')], client_ip_address: ip, client_user_agent: req.headers['user-agent'] || '' };
  if (L.fbp) ud.fbp = L.fbp;
  if (L.fbc) ud.fbc = L.fbc; else if (L.attribution.fbclid) ud.fbc = `fb.1.${Date.now()}.${L.attribution.fbclid}`;
  const r = await withTimeout(fetch(`https://graph.facebook.com/v21.0/${E.META_PIXEL_ID}/events?access_token=${E.META_CAPI_TOKEN}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [{ event_name: 'Lead', event_time: Math.floor(Date.now() / 1000), event_id: L.quoteNo, action_source: 'website', event_source_url: L.page, user_data: ud,
      custom_data: { lead_type: L.kind, content_ids: [L.model], content_category: L.product, num_items: L.qty } }] })
  }));
  return r.ok ? 'ok' : 'error';
}

async function whatsappNotify(L) {
  if (!(E.WA_TOKEN && E.WA_PHONE_ID && E.WA_NOTIFY_TO)) return 'skipped';
  const text = `New ${L.kind === 'dealer' ? 'DEALER enquiry' : 'quotation'} ${L.quoteNo}\n${L.name} · ${L.phone10}\n${L.city || '-'} · ${L.product} × ${L.qty}${L.message ? '\n“' + clip(L.message, 160) + '”' : ''}`;
  // Free-form text works only inside a 24h customer-service window; set WA_TEMPLATE to an approved
  // template with 1 body variable to notify at any time.
  const body = E.WA_TEMPLATE
    ? { messaging_product: 'whatsapp', to: E.WA_NOTIFY_TO, type: 'template', template: { name: E.WA_TEMPLATE, language: { code: E.WA_TEMPLATE_LANG || 'en' }, components: [{ type: 'body', parameters: [{ type: 'text', text: text.replace(/\n/g, ' | ').slice(0, 1000) }] }] } }
    : { messaging_product: 'whatsapp', to: E.WA_NOTIFY_TO, type: 'text', text: { body: text } };
  const r = await withTimeout(fetch(`https://graph.facebook.com/v21.0/${E.WA_PHONE_ID}/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${E.WA_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }));
  return r.ok ? 'ok' : 'error';
}

async function sheet(L) {
  if (!E.SHEET_WEBHOOK_URL) return 'skipped';
  const r = await withTimeout(fetch(E.SHEET_WEBHOOK_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: E.SHEET_WEBHOOK_SECRET || '', quoteNo: L.quoteNo, ts: new Date().toISOString(), kind: L.kind, name: L.name, phone: L.phone10, email: L.email, city: L.city,
      business: L.business, dealerType: L.dealerType, buyer: L.buyer, model: L.model, product: L.product, qty: L.qty, message: L.message, page: L.page, ...L.attribution })
  }));
  return r.ok ? 'ok' : 'error';
}

/* ---------------- email templates ---------------- */
const shell = (title, inner) => `<!doctype html><html><body style="margin:0;background:#E9EEF2;font-family:Arial,Helvetica,sans-serif;color:#252D38">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:100%">
  <tr><td style="background:#0B1D36;padding:24px 28px;color:#fff"><div style="font-size:24px;font-weight:900;letter-spacing:1px">REVOLT</div>
    <div style="font-size:12px;color:#A9B8CC">Lithium Energy Solutions · Livgreen &amp; Redtuff</div></td></tr>
  <tr><td style="padding:28px">${inner}</td></tr>
  <tr><td style="background:#F8FAF7;padding:18px 28px;font-size:12px;color:#55606E">Showroom: Railway Under Pass, Sandhawali Road, Muzaffarnagar, UP 251003<br>
    Regd. office: 581, Brahmapuri, Civil Line Uttari, Muzaffarnagar, UP 251001 · livgreenlithium@gmail.com</td></tr>
</table></td></tr></table><span style="display:none">${esc(title)}</span></body></html>`;
const rows = r => r.map(([k, v]) => `<tr><td style="padding:6px 0;color:#55606E;width:42%">${k}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`).join('');
const waBtn = `<a href="https://wa.me/919756073477" style="display:inline-block;background:#A8D829;color:#0B1D36;padding:12px 18px;border-radius:999px;font-weight:700;text-decoration:none">Reply on WhatsApp</a>`;

/* ---------------- handler ---------------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'POST only' }); }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (list.length >= 5) return res.status(429).json({ ok: false, error: 'Too many requests. Call 97560 73477.' });
  hits.set(ip, [...list, now]);

  let b;
  try { b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
  catch { return res.status(400).json({ ok: false, error: 'Bad request' }); }
  if (b.company_website) return res.status(200).json({ ok: true });          // bot honeypot

  const kind = b.kind === 'dealer' ? 'dealer' : 'quote';
  const phone = String(b.phone || '').replace(/[\s-]/g, '');
  const email = clip(b.email, 120);
  const name = clip(b.name, 80);
  if (name.length < 2) return res.status(400).json({ ok: false, error: 'Name required' });
  if (!/^(\+?91)?[6-9]\d{9}$/.test(phone)) return res.status(400).json({ ok: false, error: 'Valid mobile required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ ok: false, error: 'Valid email required' });
  if (kind === 'dealer' && clip(b.city).length < 2) return res.status(400).json({ ok: false, error: 'City required' });

  try { if (!(await verifyTurnstile(b.turnstile, ip))) return res.status(403).json({ ok: false, error: 'Verification failed. Please retry.' }); }
  catch { return res.status(503).json({ ok: false, error: 'Verification unavailable' }); }

  const key = E.RESEND_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: 'Email not configured' });

  const item = kind === 'quote' ? CATALOG[b.model] : null;
  const qty = Math.min(500, Math.max(1, parseInt(b.qty, 10) || 1));
  const prefix = kind === 'dealer' ? 'RLES-D' : 'RLES';
  const quoteNo = `${prefix}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const a = (b.attribution && typeof b.attribution === 'object') ? b.attribution : {};
  const L = {
    kind, quoteNo, name, email, phone, phone10: phone.replace(/\D/g, '').slice(-10), city: clip(b.city, 80), business: clip(b.business, 120), dealerType: clip(b.dealerType, 60),
    buyer: clip(b.buyer, 60), message: clip(b.message, 1000), model: clip(b.model, 30) || 'help', product: kind === 'dealer' ? 'Dealership' : (item ? item.name : 'Help me choose'),
    qty, page: clip(b.page, 300), attribution: a, gaClientId: /^\d+\.\d+$/.test(b.gaClientId || '') ? b.gaClientId : '', fbp: clip(b.fbp, 120), fbc: clip(b.fbc, 200)
  };

  let customerHtml, customerSubject;
  if (kind === 'dealer') {
    customerSubject = `Dealer enquiry received ${quoteNo} — Revolt Lithium`;
    customerHtml = shell(customerSubject, `
      <p style="margin:0 0 6px;font-size:13px;color:#55606E">Reference ${quoteNo}</p>
      <h1 style="margin:0 0 16px;font-size:22px;color:#0B1D36">Namaste ${esc(name)}, thank you for your dealer enquiry</h1>
      <p style="font-size:14px;margin:0 0 14px">Our dealer team will call you within working hours to discuss dealer pricing, margins and a stock plan for <b>${esc(L.city)}</b>.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows([['Business', L.business || '-'], ['City / town', L.city], ['Current business', L.dealerType || '-']])}</table>
      <p style="font-size:14px;margin:20px 0">Brands: <b>Livgreen</b> and <b>Redtuff</b> LiFePO4 batteries for e-rickshaws, e-2 wheelers, inverters and solar. Call ${PHONES.join(' / ')}.</p>${waBtn}`);
  } else {
    const valid = new Date(now + QUOTE_VALID_DAYS * 864e5).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    let priceRows = `<tr><td colspan="2" style="padding:12px 0;color:#55606E">Today's best price for your city and quantity will be shared on call within working hours.</td></tr>`;
    if (item && item.price) {
      const base = item.price * qty, gst = base * GST_RATE;
      priceRows = `<tr><td style="padding:6px 0">Price (${qty} × ${inr(item.price)})</td><td align="right">${inr(base)}</td></tr>
        <tr><td style="padding:6px 0">GST @ ${GST_RATE * 100}%</td><td align="right">${inr(gst)}</td></tr>
        <tr><td style="padding:10px 0;font-weight:800;border-top:2px solid #0B1D36">Total</td><td align="right" style="font-weight:800;border-top:2px solid #0B1D36">${inr(base + gst)}</td></tr>`;
    }
    const spec = item ? [['Battery', item.name], ['Voltage / capacity', `${item.v} V / ${item.ah} Ah`], ['Energy', `${item.kwh} kWh`], ['Chemistry', 'LiFePO4 (lithium ferrophosphate)'], ['Warranty', `${item.warranty} months`], ['Details', item.extra], ['Quantity', qty]]
      : [['Battery', 'We will suggest the right pack for your vehicle or inverter'], ['Quantity', qty]];
    customerSubject = `Your lithium battery quotation ${quoteNo} — Revolt Lithium`;
    customerHtml = shell(customerSubject, `
      <p style="margin:0 0 6px;font-size:13px;color:#55606E">Quotation ${quoteNo} · valid till ${valid}</p>
      <h1 style="margin:0 0 16px;font-size:22px;color:#0B1D36">Namaste ${esc(name)}, here is your quotation</h1>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows(spec)}</table>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:16px;border-top:1px solid #D5DCE3">${priceRows}</table>
      <p style="font-size:14px;margin:20px 0 8px">Every pack has a smart BMS (over/under voltage, short circuit and temperature protection).</p>
      <p style="font-size:14px;margin:0 0 20px">Questions? Call or WhatsApp <b>${PHONES.join('</b> / <b>')}</b>.</p>${waBtn}`);
  }

  const src = [a.utm_source, a.utm_medium, a.utm_campaign].filter(Boolean).join(' / ') || a.referrer || 'direct';
  const leadRows = kind === 'dealer'
    ? [['Name', name], ['Mobile', L.phone10], ['Email', email], ['Business', L.business], ['City', L.city], ['Current business', L.dealerType], ['Message', L.message]]
    : [['Name', name], ['Mobile', L.phone10], ['Email', email], ['City', L.city], ['Buyer', L.buyer], ['Battery', L.product], ['Qty', qty], ['Message', L.message]];
  const leadHtml = `<h2 style="font-family:Arial">${kind === 'dealer' ? 'New DEALER enquiry' : 'New quotation request'} ${quoteNo}</h2><table cellpadding="6" style="font-family:Arial;font-size:14px">
    ${[...leadRows, ['Source', src], ['Click IDs', [a.gclid, a.fbclid, a.msclkid].filter(Boolean).join(' ')], ['Landing', a.landing], ['Page', L.page]]
      .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('')}</table>
    <p style="font-family:Arial"><a href="tel:+91${L.phone10}">Call</a> · <a href="https://wa.me/91${L.phone10}">WhatsApp customer</a></p>`;

  const from = E.QUOTE_FROM || 'Revolt Lithium <onboarding@resend.dev>';
  const to = E.QUOTE_TO || 'livgreenlithium@gmail.com';
  const send = body => withTimeout(fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), 10000);

  try {
    const [c, l] = await Promise.all([
      send({ from, to: [email], reply_to: to, subject: customerSubject, html: customerHtml }),
      send({ from, to: [to], reply_to: email, subject: kind === 'dealer' ? `Dealer lead: ${name} · ${L.city}` : `New lead: ${name} · ${L.product} × ${qty}`, html: leadHtml })
    ]);
    // Side integrations run together and never fail the request; their status is returned for debugging.
    const names = ['sheet', 'zoho', 'ga4', 'meta', 'whatsapp'];
    const results = await Promise.allSettled([sheet(L), zohoLead(L), ga4(L), metaCapi(L, req, ip), whatsappNotify(L)]);
    const integrations = Object.fromEntries(results.map((r, i) => [names[i], r.status === 'fulfilled' ? r.value : 'error']));
    if (!c.ok || !l.ok) return res.status(502).json({ ok: false, error: 'Email provider error', integrations });
    return res.status(200).json({ ok: true, quoteNo, integrations });
  } catch {
    return res.status(502).json({ ok: false, error: 'Email provider unreachable' });
  }
}
