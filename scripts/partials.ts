/* Shared header, mobile drawer, footer, floating actions and consent — one source for every page. */
export type Ctx = { rel: string; home: boolean; product?: string; cfg: any; models: Record<string, any>; slug: (id: string) => string };

const ic = {
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4l-.8-.5zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8a0 0 0 0 1 0 0z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  yt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12a31 31 0 0 0 .4 3.8 3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.3-1.3.4-2.5.4-3.8s-.1-2.5-.4-3.8zM10 15V9l5.2 3z"/></svg>',
  li: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9h4v12H4zM6 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4 6h4v1.7c.6-1 1.9-2 3.9-2 4.1 0 4.1 2.7 4.1 6.2V21h-4v-5.3c0-1.3 0-3-1.8-3s-2.2 1.4-2.2 2.9V21h-4z"/></svg>'
};
export const icons = ic;

const groups = (c: Ctx) => ([
  ['E-Rickshaw', 'rickshaw', 'e-rickshaw-battery/'], ['E-2 Wheeler', 'twowheeler', 'e-scooter-battery/'], ['Inverter & Solar', 'inverter', 'lithium-inverter-battery/']
] as const).map(([name, key, path]) => ({ name, key, path, ids: Object.keys(c.models).filter(id => c.models[id].vehicle === key) }));
const a = (c: Ctx, hash: string) => (c.home ? '' : c.rel) + hash;   // section anchors resolve to the homepage from sub-pages

export function header(c: Ctx): string {
  const r = c.rel, g = groups(c), M = c.models;
  const mega = g.map(x => `<div><p class="h4">${x.name}</p>${x.ids.map(id => `<a href="${r}batteries/${c.slug(id)}/"><b style="font-weight:600">${M[id].brand} ${M[id].code}</b><span>${M[id].v}V ${M[id].ah}Ah</span></a>`).join('')}<a href="${r}${x.path}" class="link" style="text-decoration:none">All ${x.name.toLowerCase()} batteries</a></div>`).join('');
  return `<header class="hdr" id="hdr">
  <div class="container">
    <a class="logo" href="${c.home ? '#top' : r}" aria-label="REVOLT Lithium Energy Solutions, home"><img class="l-dark" src="${r}img/brand/revolt-logo-dark.webp" alt="" width="888" height="304"><img class="l-light" src="${r}img/brand/revolt-logo-light.webp" alt="" width="888" height="304"></a>
    <nav aria-label="Main"><ul class="nav">
      <li><button class="nav-a" type="button" aria-expanded="false" aria-controls="dd-brands">Our Brands ${ic.chev}</button>
        <div class="dd" id="dd-brands">
          <a href="${r}livgreen/"><img src="${r}img/brand/livgreen-logo-dark.webp" alt="" width="706" height="465"><span><b>Livgreen</b><small>Advanced lithium battery technology</small></span></a>
          <a href="${r}redtuff/"><img src="${r}img/brand/redtuff-logo-dark.webp" alt="" width="785" height="352"><span><b>Redtuff</b><small>Always on. Always win.</small></span></a>
          <a href="${a(c, '#brands')}"><img src="${r}img/brand/revolt-logo-dark.webp" alt="" width="888" height="304"><span><b>Revolt RLES</b><small>Our own series with Bluetooth BMS</small></span></a>
        </div></li>
      <li><button class="nav-a" type="button" aria-expanded="false" aria-controls="dd-batteries">Batteries ${ic.chev}</button>
        <div class="dd mega" id="dd-batteries">${mega}<div class="feature"><div><b>Not sure which battery?</b><p style="margin-top:.5rem;font-size:.9rem">Compare range, backup and 3-year cost before you buy.</p></div><a class="btn btn--lime btn--sm" href="${a(c, '#calculators')}">Open calculators</a></div></div></li>
      <li><a class="nav-a" href="${a(c, '#inverter')}">Inverter &amp; Solar</a></li>
      <li><a class="nav-a" href="${a(c, '#specs')}">Specifications</a></li>
      <li><a class="nav-a" href="${a(c, '#quality')}">Quality</a></li>
      <li><a class="nav-a" href="${a(c, '#calculators')}">Calculators</a></li>
      <li><a class="nav-a" href="${a(c, '#dealers')}">Dealers</a></li>
    </ul></nav>
    <div class="hdr-cta">
      <a class="hdr-phone" href="tel:+919756073477" data-track="call">Call us<b>97560 73477</b></a>
      <a class="btn btn--lime" href="${a(c, '#quote')}" data-track="cta_quote">Get a Quotation</a>
      <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="drawer"><span></span></button>
    </div>
  </div>
</header>
<div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Menu">
  <div class="drawer-top"><img src="${r}img/brand/revolt-logo-light.webp" alt="REVOLT Lithium Energy Solutions" width="888" height="304"><button class="drawer-x" type="button" aria-label="Close menu">×</button></div>
  <nav aria-label="Mobile">
    <details><summary>Batteries</summary><div class="sub">${g.map(x => `<a href="${r}${x.path}">${x.name}<span>${x.ids.length} models</span></a>`).join('')}<a href="${a(c, '#batteries')}">Product showcase<span>3D view</span></a></div></details>
    <details><summary>Our Brands</summary><div class="sub"><a href="${r}livgreen/">Livgreen<span>Advanced technology</span></a><a href="${r}redtuff/">Redtuff<span>Always on</span></a><a href="${a(c, '#brands')}">Revolt RLES<span>Bluetooth BMS</span></a></div></details>
    <a class="d-link" href="${a(c, '#inverter')}">Inverter &amp; Solar</a>
    <a class="d-link" href="${a(c, '#specs')}">Specifications</a>
    <a class="d-link" href="${a(c, '#quality')}">Quality</a>
    <a class="d-link" href="${a(c, '#calculators')}">Calculators</a>
    <a class="d-link" href="${a(c, '#dealers')}">Dealers</a>
    <a class="d-link" href="${r}guides/">Buying guides</a>
  </nav>
  <div class="drawer-foot">
    <a class="btn btn--lime btn--block" href="${a(c, '#quote')}" data-track="cta_quote">Get a Quotation</a>
    <div class="phones"><a href="tel:+919756073477" data-track="call"><small>Sales</small>97560 73477</a><a href="tel:+919990138500" data-track="call"><small>Dealers</small>99901 38500</a></div>
  </div>
</div>`;
}

export function footer(c: Ctx): string {
  const r = c.rel, s = c.cfg.social || {};
  const soc = [['facebook', 'Facebook', ic.fb], ['instagram', 'Instagram', ic.ig], ['youtube', 'YouTube', ic.yt], ['linkedin', 'LinkedIn', ic.li]].filter(([k]) => s[k]);
  return `<footer class="ftr">
  <div class="container">
    <div class="ftr-top">
      <div class="ftr-brand"><img src="${r}img/brand/revolt-logo-light.webp" alt="REVOLT Lithium Energy Solutions" width="888" height="304" loading="lazy">
        <p>Revolt Lithium Energy Solutions designs and builds LiFePO4 batteries in Muzaffarnagar, Uttar Pradesh, for e-rickshaws, electric two-wheelers, inverters and solar storage.</p>
        <div class="ftr-brands"><a href="${r}livgreen/" aria-label="Livgreen"><img src="${r}img/brand/livgreen-logo-light.webp" alt="Livgreen" width="706" height="465" loading="lazy"></a><a href="${r}redtuff/" aria-label="Redtuff"><img src="${r}img/brand/redtuff-logo-light.webp" alt="Redtuff" width="785" height="352" loading="lazy"></a></div>
        ${soc.length ? `<div class="social">${soc.map(([k, n, i]) => `<a href="${s[k]}" target="_blank" rel="noopener" aria-label="${n}">${i}</a>`).join('')}</div>` : ''}
      </div>
      <div><p class="h4">Batteries</p><ul><li><a href="${r}e-rickshaw-battery/">E-rickshaw</a></li><li><a href="${r}e-scooter-battery/">E-2 wheeler</a></li><li><a href="${r}lithium-inverter-battery/">Inverter &amp; solar</a></li><li><a href="${a(c, '#specs')}">Compare all models</a></li></ul></div>
      <div><p class="h4">Brands</p><ul><li><a href="${r}livgreen/">Livgreen</a></li><li><a href="${r}redtuff/">Redtuff</a></li><li><a href="${a(c, '#brands')}">Revolt RLES</a></li></ul>
        <p class="h4" style="margin-top:22px">Company</p><ul><li><a href="${a(c, '#quality')}">Quality &amp; manufacturing</a></li><li><a href="${a(c, '#dealers')}">Dealer network</a></li><li><a href="${r}guides/">Buying guides</a></li><li><a href="${a(c, '#calculators')}">Calculators</a></li></ul></div>
      <div><p class="h4">Contact</p><ul><li><a href="tel:+919756073477" data-track="call">+91 97560 73477</a></li><li><a href="tel:+919990138500" data-track="call">+91 99901 38500</a></li><li><a href="mailto:${c.cfg.business.email}" data-track="email">${c.cfg.business.email}</a></li><li><a data-review hidden href="#" target="_blank" rel="noopener">Review us on Google</a></li></ul></div>
      <div><p class="h4">Location</p><p>Showroom: Railway Under Pass, Sandhawali Road, Muzaffarnagar, UP 251003</p><p style="margin-top:.6rem">Registered office: 581, Brahmapuri, Civil Line Uttari, Muzaffarnagar, UP 251001</p><p style="margin-top:.6rem"><a href="https://www.google.com/maps/search/?api=1&amp;query=Railway+Under+Pass+Sandhawali+Road+Muzaffarnagar+251003" target="_blank" rel="noopener" data-track="directions">Get directions</a></p></div>
    </div>
    <div class="ftr-bot"><span>© <span id="yr">${new Date().getFullYear()}</span> Revolt Lithium Energy Solutions. Livgreen and Redtuff are brands of Revolt Lithium Energy Solutions.</span>
      <nav aria-label="Legal"><a href="${r}privacy.html">Privacy policy</a><a href="${r}terms.html">Terms &amp; conditions</a><a href="https://vsmgrowth.com" rel="noopener">Website by VSM Marketing</a></nav></div>
  </div>
</footer>`;
}

export function floating(c: Ctx): string {
  const q = (c.home ? '' : c.rel) + (c.product ? `?model=${c.product}` : '') + '#quote';
  return `<a class="fab" id="fab" href="https://wa.me/${c.cfg.business.whatsapp}" target="_blank" rel="noopener" data-track="whatsapp">${ic.wa}<span>WhatsApp us</span></a>
<nav class="dock" aria-label="Quick actions"><a href="tel:+919756073477" data-track="call">${ic.phone}Call</a><a class="wa" href="https://wa.me/${c.cfg.business.whatsapp}" target="_blank" rel="noopener" data-track="whatsapp">${ic.wa}WhatsApp</a><a class="q" href="${q}" data-track="cta_quote">Get quotation</a></nav>
<div class="consent" id="consent" role="region" aria-label="Cookie choice"><p>We use cookies only to measure which ads and pages bring enquiries. Nothing is tracked until you accept. <a href="${c.rel}privacy.html">Privacy policy</a></p><div><button class="btn btn--lime btn--sm" type="button" data-consent="yes">Accept</button><button class="btn btn--ghost-l btn--sm" type="button" data-consent="no">Essential only</button></div></div>`;
}

/* <head> meta that comes from config: verification tokens. */
export function verifyMeta(cfg: any): string {
  const v = cfg.verification || {};
  return [['google-site-verification', v.google], ['msvalidate.01', v.bing], ['facebook-domain-verification', v.facebook], ['p:domain_verify', v.pinterest]]
    .filter(([, x]) => x).map(([n, x]) => `<meta name="${n}" content="${x}">`).join('\n');
}
