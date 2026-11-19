/* Shared by every page: consent-gated tracking + integrations, header/menus, reveals, floating actions, lead submission. */
const CFG = window.REVOLT_CONFIG;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= tracking (Consent Mode v2; every ID comes from js/config.js) ================= */
const T = CFG.tracking; window.dataLayer = window.dataLayer || [];
const dataLayer = window.dataLayer;
// eslint-disable-next-line prefer-rest-params
function gtag(..._args: unknown[]) { dataLayer.push(arguments); }
(window as any).gtag = gtag;
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
const store = { get(k: string) { try { return localStorage.getItem(k); } catch { return null; } }, set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } } };
function loadScript(src: string, attrs: Record<string, string> = {}) { const s = document.createElement('script'); s.async = true; s.src = src; Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v)); document.head.appendChild(s); return s; }
let trackersOn = false;
function startTrackers() {
  if (trackersOn) return; trackersOn = true;
  gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
  if (T.gtm) { dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' }); loadScript(`https://www.googletagmanager.com/gtm.js?id=${T.gtm}`); }
  const gid = T.ga4 || T.googleAds.id;
  if (gid) {
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${gid}`); gtag('js', new Date());
    if (T.ga4) gtag('config', T.ga4);
    if (T.googleAds.id) gtag('config', T.googleAds.id, { allow_enhanced_conversions: true });
  }
  if (T.metaPixel) { (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js'); window.fbq?.('init', T.metaPixel); window.fbq?.('track', 'PageView'); }
  if (T.clarity) { (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', T.clarity); }
  if (T.linkedin) { window._linkedin_partner_id = T.linkedin; loadScript('https://snap.licdn.com/li.lms-analytics/insight.min.js'); }
  if (T.bingUet) { (window as any).uetq = (window as any).uetq || []; const s = loadScript('https://bat.bing.com/bat.js'); s.onload = () => { const w = window as any; const o = { ti: T.bingUet, enableAutoSpaTracking: true }; w.uetq = new w.UET(o); w.uetq.push('pageLoad'); }; }
}
export function track(event: string, params: Record<string, unknown> = {}) {
  const p: Record<string, unknown> = { ...params, ...attribution() };
  dataLayer.push({ event, ...p });
  if (!trackersOn) return;
  if (T.ga4) gtag('event', event, p);
  const fbMap: Record<string, string> = { generate_lead: 'Lead', click_call: 'Contact', click_whatsapp: 'Contact', view_item: 'ViewContent', calculator_complete: 'CustomizeProduct' };
  if (window.fbq && fbMap[event]) window.fbq('track', fbMap[event], p, p.event_id ? { eventID: p.event_id } : undefined);
  if (T.googleAds.id && event === 'generate_lead' && T.googleAds.leadLabel) gtag('event', 'conversion', { send_to: `${T.googleAds.id}/${T.googleAds.leadLabel}`, transaction_id: p.event_id || undefined });
  if (T.googleAds.id && event === 'click_call' && T.googleAds.callLabel) gtag('event', 'conversion', { send_to: `${T.googleAds.id}/${T.googleAds.callLabel}` });
  const w = window as any; if (T.bingUet && w.uetq?.push && (event === 'generate_lead' || event === 'click_call')) w.uetq.push('event', event, {});
}
// first-touch attribution: UTMs, gclid, fbclid, msclkid travel with every lead
export function attribution(): Record<string, string> {
  let a: Record<string, string> | null; try { a = JSON.parse(sessionStorage.getItem('attr') || 'null'); } catch { a = null; }
  if (!a) {
    const q = new URLSearchParams(location.search); a = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid'].forEach(k => { const v = q.get(k); if (v) a![k] = v; });
    a.landing = location.pathname; a.referrer = document.referrer ? new URL(document.referrer).hostname : '';
    try { sessionStorage.setItem('attr', JSON.stringify(a)); } catch { /* storage blocked */ }
  }
  return a;
}
const cookie = (n: string) => document.cookie.split('; ').find(c => c.startsWith(n + '='))?.split('=')[1] || '';
export const waLink = (text: string) => `https://wa.me/${CFG.business.whatsapp}?text=${encodeURIComponent(text)}`;
const waHello = 'Namaste, mujhe lithium battery ki jankari chahiye.';

/* ================= Cloudflare Turnstile (spam protection, only if a site key is configured) ================= */
let turnstileReady: Promise<void> | null = null;
function initTurnstile() {
  const key = CFG.turnstileSiteKey; const slots = $$('.cf-slot'); if (!key || !slots.length) return;
  turnstileReady = new Promise(res => { (window as any).onTurnstile = () => res(); loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstile&render=explicit'); });
  turnstileReady.then(() => slots.forEach(s => (window as any).turnstile.render(s, { sitekey: key, theme: 'light', size: 'flexible' })));
}

/* ================= forms ================= */
type Rule = (v: string) => true | string;
const RULES: Record<string, Rule> = {
  name: v => v.trim().length >= 2 || 'Enter your name.',
  phone: v => /^(\+?91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')) || 'Enter a 10-digit Indian mobile number.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Enter an email so we can reply in writing.'
};
export function validateForm(f: HTMLFormElement, extra: Record<string, Rule> = {}): boolean {
  let ok = true; const rules = { ...RULES, ...extra };
  for (const [k, fn] of Object.entries(rules)) {
    const el = f.elements.namedItem(k) as HTMLInputElement | null; if (!el) continue;
    const r = fn(el.value); const msg = $(`.err[data-for=${k}]`, f); if (msg) msg.textContent = r === true ? '' : r;
    el.setAttribute('aria-invalid', String(r !== true)); if (r !== true && ok) { el.focus(); ok = false; }
  }
  const c = f.elements.namedItem('consent') as HTMLInputElement | null;
  if (c) { const m = $('.err[data-for=consent]', f); if (m) m.textContent = c.checked ? '' : 'Tick this box so we can reply to you.'; if (!c.checked) ok = false; }
  return ok;
}
type Opts = { button: HTMLButtonElement; idle: string; ok: (d: Record<string, any>) => string; wa: (d: Record<string, any>) => string; event: (d: Record<string, any>) => [string, Record<string, unknown>] };
/** Posts a lead to /api/quote. Success text only appears when the server confirms; otherwise the visitor gets a WhatsApp fallback. */
export async function submitLead(f: HTMLFormElement, data: Record<string, any>, o: Opts) {
  const st = $('.status', f)!; st.className = 'status'; st.innerHTML = '';
  if ((f.elements.namedItem('company_website') as HTMLInputElement)?.value) return;     // honeypot
  const d: Record<string, any> = { ...data, attribution: attribution(), page: location.href.split('#')[0], ts: new Date().toISOString(), gaClientId: cookie('_ga').split('.').slice(-2).join('.'), fbp: cookie('_fbp'), fbc: cookie('_fbc') };
  delete d.company_website; delete d.consent;
  const ts = (f.elements.namedItem('cf-turnstile-response') as HTMLInputElement)?.value; if (ts) d.turnstile = ts;
  o.button.disabled = true; o.button.textContent = 'Sending…';
  let sent = false, ref = '';
  try {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 15000);
    const res = await fetch(CFG.quoteEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d), signal: ctl.signal });
    clearTimeout(to);
    const j = await res.json().catch(() => ({}));
    sent = res.ok && j.ok === true; ref = j.quoteNo || '';
  } catch { sent = false; }
  o.button.disabled = false; o.button.textContent = o.idle;
  if (sent) {
    // Google Ads enhanced conversions: gtag hashes these before sending
    if (trackersOn && T.googleAds.id) gtag('set', 'user_data', { email: d.email, phone_number: '+91' + String(d.phone).replace(/\D/g, '').slice(-10) });
    const [ev, p] = o.event(d); track(ev, { ...p, event_id: ref });
    st.className = 'status ok'; st.innerHTML = o.ok(d) + (ref ? `<br><small>Reference: ${ref}</small>` : '');
    f.reset(); (window as any).turnstile?.reset?.();
  } else {
    st.className = 'status fail';
    st.innerHTML = `Our email service didn't confirm your request, so nothing was sent. Send the same details on WhatsApp and we'll reply there:<br><a href="${waLink(o.wa(d))}" target="_blank" rel="noopener">Send on WhatsApp</a> &nbsp;or call <a href="tel:+919756073477">97560 73477</a> / <a href="tel:+919990138500">99901 38500</a>`;
    track('lead_fallback', { form: d.kind });
  }
}
/** /?model=rt-5376#quote deep links from ads and product pages */
export function prefillFromQuery(set: (id: string) => void) {
  const q = new URLSearchParams(location.search).get('model'); if (q) set(q);
}

/* ================= header: scroll state, dropdowns, mega menu, mobile drawer ================= */
function initHeader() {
  const hdr = $('#hdr'); if (!hdr) return;
  const onScroll = () => hdr.classList.toggle('is-scrolled', scrollY > 12);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const btns = $$<HTMLButtonElement>('.nav-a[aria-controls]');
  const close = (except?: HTMLButtonElement) => btns.forEach(b => { if (b !== except) { b.setAttribute('aria-expanded', 'false'); $('#' + b.getAttribute('aria-controls'))?.classList.remove('open'); } });
  btns.forEach(b => {
    const dd = $('#' + b.getAttribute('aria-controls'))!; const li = b.parentElement!; let t = 0;
    const open = () => { clearTimeout(t); close(b); b.setAttribute('aria-expanded', 'true'); dd.classList.add('open'); };
    const shut = () => { clearTimeout(t); t = window.setTimeout(() => { b.setAttribute('aria-expanded', 'false'); dd.classList.remove('open'); }, 140); };
    b.addEventListener('click', () => b.getAttribute('aria-expanded') === 'true' ? (b.setAttribute('aria-expanded', 'false'), dd.classList.remove('open')) : open());
    if (matchMedia('(hover: hover)').matches) { li.addEventListener('pointerenter', open); li.addEventListener('pointerleave', shut); }
    li.addEventListener('focusout', e => { if (!li.contains(e.relatedTarget as Node)) shut(); });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const o = btns.find(b => b.getAttribute('aria-expanded') === 'true'); close(); o?.focus(); } });
  document.addEventListener('click', e => { if (!(e.target as Element).closest('.nav')) close(); });
  // drawer
  const dr = $('#drawer'), mb = $<HTMLButtonElement>('.menu-btn'); if (!dr || !mb) return;
  const openD = () => { dr.classList.add('open'); mb.setAttribute('aria-expanded', 'true'); document.body.classList.add('lock'); $<HTMLButtonElement>('.drawer-x', dr)?.focus(); };
  const closeD = () => { dr.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); document.body.classList.remove('lock'); mb.focus(); };
  mb.addEventListener('click', openD); $('.drawer-x', dr)?.addEventListener('click', closeD);
  dr.addEventListener('click', e => { if ((e.target as Element).closest('a')) { dr.classList.remove('open'); document.body.classList.remove('lock'); mb.setAttribute('aria-expanded', 'false'); } });
  dr.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeD();
    if (e.key === 'Tab') { const f = $$<HTMLElement>('a,button,summary', dr).filter(x => x.offsetParent); const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
  addEventListener('resize', () => { if (innerWidth > 1120 && dr.classList.contains('open')) closeD(); });
}

/* ================= reveal on scroll, floating action visibility ================= */
function initReveal() {
  const els = $$('[data-reveal]'); if (!els.length) return;
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  els.forEach(e => io.observe(e));
}
function initFab() {
  const fab = $('#fab'); if (!fab) return;
  const avoid = $$('form, .ftr, #consent.show'); const seen = new Set<Element>();
  const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)); fab.classList.toggle('hide', seen.size > 0 || scrollY < 300); }, { threshold: .05 });
  avoid.forEach(a => io.observe(a));
  addEventListener('scroll', () => fab.classList.toggle('hide', seen.size > 0 || scrollY < 300), { passive: true });
  fab.classList.add('hide');
}

export function initCommon(): void {
  // consent
  const box = $('#consent'); const choice = store.get('consent');
  if (!T.requireConsent || choice === 'yes') startTrackers(); else if (!choice && box) box.classList.add('show');
  box?.addEventListener('click', e => { const b = (e.target as Element).closest<HTMLElement>('[data-consent]'); if (!b) return; store.set('consent', b.dataset.consent!); box.classList.remove('show'); if (b.dataset.consent === 'yes') startTrackers(); });
  // click tracking
  document.addEventListener('click', e => {
    const a = (e.target as Element).closest<HTMLElement>('[data-track]'); if (!a) return;
    const map: Record<string, string> = { call: 'click_call', whatsapp: 'click_whatsapp', email: 'click_email', directions: 'click_directions' };
    track(map[a.dataset.track!] || a.dataset.track!, { link: a.getAttribute('href') });
  });
  attribution();
  $$<HTMLAnchorElement>('a[href^="https://wa.me/"]').forEach(a => { if (!a.href.includes('?text=')) a.href = waLink(waHello); });
  const r = CFG.business.googleReviewUrl; if (r) { $$<HTMLAnchorElement>('[data-review]').forEach(a => { a.href = r; a.hidden = false; }); $$('[data-review-li]').forEach(li => li.hidden = false); }
  const yr = $('#yr'); if (yr) yr.textContent = String(new Date().getFullYear());
  initHeader(); initReveal(); initFab(); initTurnstile();
}
