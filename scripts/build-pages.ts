/* Static SEO page generator (Node 22+ runs this TypeScript directly).
   Builds: index.html (from src/home.html), 15 product pages, 3 category pages, 2 brand pages, 3 guides + index, privacy, terms, sitemap.xml.
   Data comes from js/config.js, so editing the catalogue there and running `npm run build` updates every page. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { header, footer, floating, verifyMeta } from './partials.ts';

type M = { brand: string; code: string; kind: string; vehicle: 'rickshaw' | 'twowheeler' | 'inverter'; v: number; ah: number; kwh: number; warranty: number; photo: string; note?: string; fullSpec?: boolean; bluetooth?: boolean; cable?: boolean; display?: boolean };
const sandbox: any = { window: {} };
runInNewContext(readFileSync('js/config.js', 'utf8'), sandbox);
const CFG = sandbox.window.REVOLT_CONFIG, MODELS: Record<string, M> = sandbox.window.REVOLT_MODELS;
const SITE = CFG.siteUrl.replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);
const ids = Object.keys(MODELS);
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s: string) => s.toLowerCase().replace(/\./g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const label = (m: M) => `${m.brand} ${m.code}`;
const SLUGS: Record<string, string> = {
  'rt-5376': 'redtuff-rt-5376kwh-e-rickshaw-battery', 'lg-5112': 'livgreen-51-2v-105ah-e-rickshaw-battery', 'lg-96105': 'livgreen-96v-105ah-lithium-battery',
  'lg-4830': 'livgreen-lg-4830-48v-30ah-e-scooter-battery', 'lg-6030': 'livgreen-lg-6030-60v-30ah-e-scooter-battery', 'lg-6032': 'livgreen-lg-6032-60v-32ah-e-scooter-battery',
  'lg-7230': 'livgreen-lg-7230-72v-30ah-e-scooter-battery', 'rt-6030': 'redtuff-rt-6030-60v-30ah-e-scooter-battery', 'rles-6030': 'revolt-rles-60v-30ah-lithium-battery',
  'rles-4830': 'revolt-rles-48v-30ah-lithium-battery', 'rt-1344': 'redtuff-rt-1344kwh-inverter-battery', 'rt-2688': 'redtuff-rt-2688kwh-inverter-battery',
  'rt-5040': 'redtuff-rt-5040kwh-inverter-battery', 'lg-2688': 'livgreen-lg-2688kwh-inverter-battery', 'lg-5040': 'livgreen-lg-5040kwh-inverter-battery' };
const slug = (id: string) => { const m = MODELS[id]; return SLUGS[id] || slugify(`${m.brand} ${m.code} ${m.v}v ${m.ah}ah ${m.kind}`); };
const WHKM = { rickshaw: 50, twowheeler: 28 } as const;
const range = (m: M) => Math.round(m.kwh * 900 / WHKM[m.vehicle as 'rickshaw'] / 5) * 5;
const backup = (m: M, w = 500) => Math.round(m.kwh * 1000 * .9 * .92 / w * 10) / 10;
const CAT = {
  rickshaw: { path: 'e-rickshaw-battery', name: 'E-Rickshaw Batteries', h1: 'Lithium e-rickshaw battery, 51.2V 105Ah LiFePO4',
    title: 'Lithium E-Rickshaw Battery 51.2V 105Ah in Muzaffarnagar | Livgreen & Redtuff',
    desc: 'LiFePO4 e-rickshaw battery 51.2V 105Ah (5.376 kWh), 44 kg, 4–5 hr charge, 36-month warranty. Livgreen and Redtuff by Revolt Lithium, Muzaffarnagar. Call 97560 73477.',
    lede: 'One 44 kg LiFePO4 pack replaces a 4 × 12V lead-acid set, charges in 4–5 hours and carries a 36-month warranty. Made in Muzaffarnagar under the Livgreen and Redtuff brands.' },
  twowheeler: { path: 'e-scooter-battery', name: 'E-Scooter Batteries', h1: 'Lithium e-scooter battery, 48V, 60V and 72V',
    title: 'Lithium E-Scooter Battery 48V, 60V, 72V 30Ah LiFePO4 | Livgreen, Redtuff, Revolt',
    desc: 'LiFePO4 batteries for electric scooters and e-bikes: 48V 30Ah, 60V 30Ah, 60V 32Ah, 72V 30Ah with smart BMS and 36-month warranty. Revolt Lithium, Muzaffarnagar.',
    lede: 'Match your scooter\'s voltage and get a lighter battery with more range per charge. Every pack has a smart BMS, an Anderson-type connector and a 36-month warranty.' },
  inverter: { path: 'lithium-inverter-battery', name: 'Inverter & Solar Batteries', h1: 'Lithium inverter and solar battery, 12.8V to 48V',
    title: 'Lithium Inverter Battery 12.8V, 25.6V, 48V 105Ah LiFePO4 | 60-Month Warranty',
    desc: 'LiFePO4 inverter and solar batteries: 1.344, 2.688 and 5.040 kWh, 105Ah, zero maintenance, 60-month warranty. Livgreen and Redtuff by Revolt Lithium, Muzaffarnagar.',
    lede: 'Maintenance-free LiFePO4 storage for home, office and solar inverters. No acid, no water top-up and a 60-month warranty.' }
} as const;
const BRAND = {
  livgreen: { name: 'Livgreen', tag: 'Powering the future with advanced technology', title: 'Livgreen Lithium Battery — E-Rickshaw, E-Scooter & Inverter LiFePO4',
    desc: 'Livgreen LiFePO4 batteries by Revolt Lithium Energy Solutions, Muzaffarnagar: 51.2V 105Ah e-rickshaw, 48–72V scooter, 96V and inverter batteries. Up to 60-month warranty.',
    lede: 'Livgreen is the advanced-technology line from Revolt Lithium Energy Solutions: gen-next lithium and LFP batteries for e-rickshaws, scooters, fleets, home inverters and solar storage.' },
  redtuff: { name: 'Redtuff', tag: 'Always on, always win', title: 'Redtuff Lithium Battery — E-Rickshaw, E-Scooter & Inverter LiFePO4',
    desc: 'Redtuff LiFePO4 batteries by Revolt Lithium, Muzaffarnagar: RT-5.376KWH e-rickshaw, RT-6030 scooter and RT inverter batteries. 36–60 month warranty. Call 97560 73477.',
    lede: 'Redtuff is the heavy-duty line from Revolt Lithium Energy Solutions, built in a bright lime steel case for full-day e-rickshaw routes and long inverter backup.' }
} as const;

// css/site.css is hand-written (design system); nothing is generated here.

const pic = (id: string, alt: string, rel: string, sizes = '(max-width: 900px) 92vw, 600px', eager = false) => `<picture><source type="image/avif" srcset="${rel}img/p/${id}-600.avif 600w, ${rel}img/p/${id}-1200.avif 1200w" sizes="${sizes}"><img src="${rel}img/p/${id}-1200.webp" srcset="${rel}img/p/${id}-600.webp 600w, ${rel}img/p/${id}-1200.webp 1200w" sizes="${sizes}" alt="${esc(alt)}" width="1200" height="900" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
const card = (id: string, rel: string) => { const m = MODELS[id], u = `${rel}batteries/${slug(id)}/`; return `<li class="card" data-brand="${m.brand}"><a class="pic fx" href="${u}" tabindex="-1" aria-hidden="true">${pic(id, `${label(m)} ${m.v}V ${m.ah}Ah`, rel, '(max-width: 620px) 92vw, 380px')}<span class="bt ${m.brand}">${m.brand}</span><span class="seal"><b>${m.warranty}</b>months<br>warranty</span></a>
  <div class="card-b"><h3><a href="${u}">${esc(m.code)}</a></h3><ul class="pills"><li><b>${m.v}</b> V</li><li><b>${m.ah}</b> Ah</li><li><b>${m.kwh}</b> kWh</li></ul>
  <p class="perf"><b>${m.vehicle === 'inverter' ? '≈' + backup(m) + ' hr' : '≈' + range(m) + ' km'}</b> ${m.vehicle === 'inverter' ? 'backup at 500 W' : 'range per charge'}</p></div>
  <div class="card-act"><a class="btn btn--ghost btn--sm" href="${u}">Details</a><a class="btn btn--lime btn--sm" href="${rel}?model=${id}#quote">Get quote</a></div></li>`; };
const ld = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const crumbsLd = (items: [string, string][]) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITE + u })) });
const faqLd = (qs: [string, string][]) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const faqHtml = (qs: [string, string][]) => qs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
const crumbsHtml = (items: [string, string][], rel: string) => `<nav class="crumbs container" aria-label="Breadcrumb"><ol>${items.map(([n, u], i) => i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${rel}${u.replace(/^\//, '')}">${esc(n)}</a></li>`).join('')}</ol></nav>`;

function shell(o: { path: string; title: string; desc: string; body: string; schema: unknown[]; og?: string; product?: string; noindex?: boolean; file?: boolean }) {
  const depth = o.path.split('/').filter(Boolean).length - (o.file ? 1 : 0), rel = depth > 0 ? '../'.repeat(depth) : './';
  const url = SITE + o.path, og = o.og || `${SITE}/img/og.jpg`;
  const ctx = { rel, home: false, product: o.product, cfg: CFG, models: MODELS, slug };
  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${url}"><link rel="alternate" hreflang="en-IN" href="${url}"><link rel="alternate" hreflang="x-default" href="${url}">
<meta name="robots" content="${o.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large'}"><meta name="theme-color" content="#0B1D36">
<meta name="geo.region" content="IN-UP"><meta name="geo.placename" content="Muzaffarnagar">
${verifyMeta(CFG)}
<meta property="og:type" content="${o.product ? 'product' : 'website'}"><meta property="og:site_name" content="REVOLT Lithium Energy Solutions">
<meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${og}"><meta property="og:locale" content="en_IN"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${rel}favicon.svg" type="image/svg+xml"><link rel="manifest" href="${rel}site.webmanifest">
<link rel="preload" href="${rel}fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${rel}fonts/figtree-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${rel}css/site.css">
${o.schema.map(ld).join('\n')}
<script>document.documentElement.classList.add('js')</script>
<script defer src="${rel}js/config.js"></script>
</head>
<body${o.product ? ` data-product="${o.product}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
${header(ctx)}
<main id="main" class="page-top">
${o.body}
</main>
${footer(ctx)}
${floating(ctx)}
<script type="module" src="${rel}js/page.js"></script>
</body>
</html>
`;
}
const write = (path: string, html: string) => { const dir = '.' + path; mkdirSync(dir, { recursive: true }); writeFileSync(dir + 'index.html', html); };
const ORG = { '@id': `${SITE}/#org` };
const sitemap: [string, string][] = [['/', '1.0']];

/* ---------- product pages ---------- */
const PROT = ['Over-voltage', 'Under-voltage / over-discharge', 'Short-circuit', 'Charge over-temperature', 'Discharge over-temperature', 'Low-battery shut-down'];
for (const id of ids) {
  const m = MODELS[id], cat = CAT[m.vehicle], path = `/batteries/${slug(id)}/`, rel = '../../';
  const isInv = m.vehicle === 'inverter';
  const perf = isInv ? `about ${backup(m)} hours at a 500 W load and ${backup(m, 1000)} hours at 1000 W` : `about ${range(m)} km per charge on a level road`;
  const use = m.vehicle === 'rickshaw' ? (m.note ? 'e-rickshaws, e-loaders and fleet EVs' : 'e-rickshaws') : m.vehicle === 'twowheeler' ? `${m.v}V electric scooters, e-bikes and mopeds` : `${m.v === 12.8 ? '12V' : m.v === 25.6 ? '24V' : '48V'} home, office and solar inverters`;
  const lede = `The ${label(m)} is a ${m.v}V ${m.ah}Ah lithium ferrophosphate (LiFePO4) battery with ${m.kwh} kWh of energy, built by Revolt Lithium Energy Solutions in Muzaffarnagar for ${use}. It gives ${perf}, has a smart BMS with six protections and carries a ${m.warranty}-month warranty.`;
  const rows: [string, string][] = [['Brand', m.brand], ['Model', m.code], ['Chemistry', 'Lithium ferrophosphate (LiFePO4)'], ['Nominal voltage', `${m.v} V`], ['Capacity', `${m.ah} Ah`], ['Energy', `${m.kwh} kWh`],
    [isInv ? 'Backup' : 'Approx. range', isInv ? `${backup(m)} hr at 500 W, ${backup(m, 1000)} hr at 1000 W` : `${range(m)} km per charge`], ['Warranty', `${m.warranty} months`], ['BMS protections', PROT.join(', ')], ['Casing', 'Steel (MS sheet metal)']];
  if (m.fullSpec) rows.push(['Configuration', '16S1P prismatic, 3.2V 105Ah cells'], ['Voltage range', '40 V – 58.4 V (working 44.8 V – 57.6 V)'], ['Charging current', '20 A standard, 25 A maximum (≈4–5 hr)'], ['Discharge', '60 A continuous, 100 A peak (5 s)'], ['Operating temperature', 'Charge 0–55°C, discharge −10–55°C'], ['Weight', '44 ± 1 kg'], ['Communication', 'UART standard, CAN optional']);
  if (m.cable) rows.push(['Connector', 'Anderson-type plug']);
  if (m.bluetooth) rows.push(['Smart BMS', 'Bluetooth app shows every cell voltage and temperature']);
  if (m.display) rows.push(['Display', 'Built-in screen with charge level and pack status']);
  const faqs: [string, string][] = [
    [`What is the warranty on the ${label(m)}?`, `${m.warranty} months from purchase, backed by Revolt Lithium Energy Solutions, Muzaffarnagar. Keep the serial number on the pack for claims.`],
    isInv ? [`How long will the ${label(m)} run my inverter?`, `About ${backup(m)} hours at 500 W (roughly 5 ceiling fans and a few LED lights) and ${backup(m, 1000)} hours at 1000 W, using 90% of the energy through a 92% efficient inverter.`]
          : [`How many km does the ${label(m)} give per charge?`, `About ${range(m)} km on a level road with a normal load. Heavy loads, slopes and low tyre pressure reduce it.`],
    [`What is the price of the ${label(m)}?`, `Price depends on quantity and your city. Request a quotation on this page and it is emailed to you, or call 97560 73477.`],
    [`Is the ${label(m)} safe?`, 'Yes. LiFePO4 cells are thermally stable and spill proof, and the BMS protects against over-voltage, over-discharge, short circuit and high temperature.']
  ];
  const related = ids.filter(x => x !== id && MODELS[x].vehicle === m.vehicle).slice(0, 3);
  const desc = `${label(m)} ${m.v}V ${m.ah}Ah LiFePO4 ${m.kind.toLowerCase()}: ${m.kwh} kWh, ${isInv ? backup(m) + ' hr backup at 500 W' : '≈' + range(m) + ' km range'}, smart BMS, ${m.warranty}-month warranty. Revolt Lithium, Muzaffarnagar.`;
  const crumbs: [string, string][] = [['Home', '/'], [cat.name, `/${cat.path}/`], [label(m), path]];
  const body = `${crumbsHtml(crumbs, rel)}
<section class="container phero">
  <div class="shot fx">${pic(id, `${label(m)} ${m.v}V ${m.ah}Ah LiFePO4 ${m.kind}`, rel, '(max-width: 900px) 92vw, 640px', true)}<span class="seal"><b>${m.warranty}</b>months<br>warranty</span></div>
  <div>
    <img src="${rel}img/brand/${m.brand.toLowerCase()}-logo-dark.webp" alt="${m.brand}" width="400" height="160" style="height:44px;width:auto;margin-bottom:16px">
    <h1>${esc(label(m))} ${m.v}V ${m.ah}Ah ${esc(m.kind.replace('E-Vehicle', 'E-Scooter'))}</h1>
    <ul class="pills"><li><b>${m.v}</b> V</li><li><b>${m.ah}</b> Ah</li><li><b>${m.kwh}</b> kWh</li><li><b>LiFePO4</b></li><li><b>${m.warranty}</b> months warranty</li></ul>
    <p class="lede">${esc(lede)}</p>
    ${m.note ? `<p class="note">${esc(m.note)}</p>` : ''}
    <div class="row"><a class="btn btn--lime" href="${rel}?model=${id}#quote" data-track="cta_quote">Get a quotation</a><a class="btn btn--ghost" href="https://wa.me/${CFG.business.whatsapp}?text=${encodeURIComponent(`Namaste, ${label(m)} ${m.v}V ${m.ah}Ah ki price batayein.`)}" target="_blank" rel="noopener" data-track="whatsapp">WhatsApp for price</a><a class="btn btn--ghost" href="tel:+919756073477" data-track="call">Call 97560 73477</a></div>
    <figure class="real" style="margin-top:20px"><img src="${rel}${m.photo}" alt="Actual photo of ${esc(label(m))}" loading="lazy" width="84" height="64"><figcaption>Actual product photo from our assembly floor</figcaption></figure>
  </div>
</section>
<section class="sec sec--white"><div class="container two">
  <div><h2>Specifications</h2><table class="spec"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div>
  <div><h2>Why choose it</h2><ul class="ticks">${(isInv ? ['Zero maintenance: no acid, no water top-up', 'Fast recharge after every power cut', 'Long cycle life for daily cuts and solar cycling', 'Compact steel cabinet, wall or floor', `${m.warranty}-month warranty`] : ['About a third of the weight of lead-acid', 'Charges in hours, not overnight', 'Long cycle life, years of daily use', 'Spill proof, no gassing, no lead', `${m.warranty}-month warranty`]).map(t => `<li>${t}</li>`).join('')}</ul>
  <h2 style="margin-top:40px">Common questions</h2><div class="faq">${faqHtml(faqs)}</div></div>
</div></section>
${related.length ? `<section class="sec"><div class="container"><h2 style="margin-bottom:28px">Related batteries</h2><ul class="cards">${related.map(r => card(r, rel)).join('')}</ul></div></section>` : ''}
<div class="container"><div class="cta-band"><h2>Get the ${esc(m.code)} quotation on email</h2><a class="btn btn--lime" href="${rel}?model=${id}#quote">Request quotation</a></div></div>`;
  const schema = [
    { '@context': 'https://schema.org', '@type': 'Product', name: `${label(m)} ${m.v}V ${m.ah}Ah LiFePO4 ${m.kind}`, sku: m.code, mpn: m.code, brand: { '@type': 'Brand', name: m.brand },
      manufacturer: { '@type': 'Organization', name: 'Revolt Lithium Energy Solutions', ...ORG }, category: cat.name, description: lede,
      image: [`${SITE}/img/p/${id}-1200.webp`, `${SITE}/${m.photo}`], url: SITE + path,
      additionalProperty: [['Nominal voltage', `${m.v} V`], ['Capacity', `${m.ah} Ah`], ['Energy', `${m.kwh} kWh`], ['Chemistry', 'LiFePO4'], ['Warranty', `${m.warranty} months`]].map(([n, v]) => ({ '@type': 'PropertyValue', name: n, value: v })) },
    crumbsLd(crumbs), faqLd(faqs)];
  write(path, shell({ path, title: `${label(m)} ${m.v}V ${m.ah}Ah ${m.kind.replace('E-Vehicle', 'E-Scooter')} | ${m.warranty}-Month Warranty`, desc, body, schema, og: `${SITE}/img/p/${id}-1200.webp`, product: id }));
  sitemap.push([path, '0.8']);
}

/* ---------- category pages ---------- */
const catFaq = {
  rickshaw: [['Which lithium battery fits an e-rickshaw?', 'The 51.2V 105Ah LiFePO4 pack replaces a 48V lead-acid set (4 × 12V) in most e-rickshaws. Use a lithium-compatible charger; we check your controller and charger before fitting.'],
             ['How long does an e-rickshaw lithium battery last?', 'LFP cells are built for years of daily cycling, and every pack carries a 36-month warranty. A lead-acid set usually needs replacing every 12–15 months in daily use.']],
  twowheeler: [['How do I choose the right scooter battery?', 'Match your scooter\'s system voltage (48V, 60V or 72V), then choose capacity for range. 30Ah gives roughly 45–70 km depending on voltage.'],
               ['Will a lithium battery fit my existing scooter?', 'Most 48V, 60V and 72V scooters accept our packs with an Anderson-type connector. Send your scooter model and we confirm fit and charger.']],
  inverter: [['Can I use a lithium battery with my existing inverter?', 'Yes, with the matching system voltage: 12.8V for 12V inverters, 25.6V for 24V and 48V for 48V/solar hybrid systems. Set the inverter to lithium or a suitable charging profile.'],
             ['How much backup will I get?', 'At 500 W the 1.344 kWh battery gives about 2.2 hours, the 2.688 kWh about 4.5 hours and the 5.040 kWh about 8.3 hours.']]
} as Record<string, [string, string][]>;
for (const [k, c] of Object.entries(CAT)) {
  const list = ids.filter(id => MODELS[id].vehicle === k), path = `/${c.path}/`, rel = '../';
  const crumbs: [string, string][] = [['Home', '/'], [c.name, path]];
  const body = `${crumbsHtml(crumbs, rel)}
<section class="container" style="padding-block:24px 56px"><div class="sec-head" style="margin:0"><h1 style="font-size:clamp(2.2rem,1.4rem + 3vw,3.8rem);max-width:20ch">${c.h1}</h1><p class="lede">${c.lede}</p>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px"><a class="btn btn--lime" href="${rel}#quote" data-track="cta_quote">Get a quotation</a><a class="btn btn--ghost" href="tel:+919756073477" data-track="call">Call 97560 73477</a></div></div></section>
<section class="sec" style="padding-top:0"><div class="container"><ul class="cards">${list.map(id => card(id, rel)).join('')}</ul></div></section>
<section class="sec sec--white"><div class="container two"><div><h2>Compare models</h2><div class="tbl-wrap"><table class="tbl" style="min-width:560px"><thead><tr><th>Model</th><th>Voltage / capacity</th><th>Energy</th><th>${k === 'inverter' ? 'Backup at 500 W' : 'Approx. range'}</th></tr></thead><tbody>${list.map(id => { const m = MODELS[id]; return `<tr><td><a href="${rel}batteries/${slug(id)}/">${esc(label(m))}</a></td><td>${m.v} V / ${m.ah} Ah</td><td>${m.kwh} kWh</td><td>${k === 'inverter' ? '≈' + backup(m) + ' hr' : '≈' + range(m) + ' km'}</td></tr>`; }).join('')}</tbody></table></div></div>
<div><h2>Questions</h2><div class="faq">${faqHtml(catFaq[k])}</div><p class="note" style="margin-top:20px">Read the <a href="${rel}guides/">buying guides</a> or try the <a href="${rel}#calculators">calculators</a>.</p></div></div></section>`;
  const schema = [crumbsLd(crumbs), faqLd(catFaq[k]),
    { '@context': 'https://schema.org', '@type': 'ItemList', name: c.name, itemListElement: list.map((id, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/batteries/${slug(id)}/`, name: label(MODELS[id]) })) }];
  write(path, shell({ path, title: c.title, desc: c.desc, body, schema }));
  sitemap.push([path, '0.9']);
}

/* ---------- brand pages ---------- */
for (const [k, b] of Object.entries(BRAND)) {
  const list = ids.filter(id => MODELS[id].brand === b.name), path = `/${k}/`, rel = '../';
  const crumbs: [string, string][] = [['Home', '/'], [b.name, path]];
  const lg = k === 'livgreen';
  const body = `${crumbsHtml(crumbs, rel)}
<section class="container"><div class="brand-hero ${lg ? 'lg' : 'rt'}">
<img src="${rel}img/brand/${k}-logo-light.webp" alt="${b.name}" width="700" height="400">
<h1>${b.name}: ${b.tag}</h1>
<p class="lede" style="color:#D6E2DC">${b.lede}</p>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:28px"><a class="btn btn--lime" href="${rel}#quote" data-track="cta_quote">Get a ${b.name} quotation</a><a class="btn btn--ghost-l" href="${rel}#dealers">Become a ${b.name} dealer</a></div></div></section>
<section class="sec" style="padding-top:0"><div class="container"><h2 style="margin-bottom:28px">${b.name} range</h2><ul class="cards">${list.map(id => card(id, rel)).join('')}</ul></div></section>`;
  const schema = [crumbsLd(crumbs), { '@context': 'https://schema.org', '@type': 'Brand', name: b.name, slogan: b.tag, description: b.lede, url: SITE + path, logo: `${SITE}/img/brand/${k}-logo-dark.webp` },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: `${b.name} batteries`, itemListElement: list.map((id, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/batteries/${slug(id)}/`, name: label(MODELS[id]) })) }];
  write(path, shell({ path, title: b.title, desc: b.desc, body, schema }));
  sitemap.push([path, '0.8']);
}

/* ---------- guides ---------- */
const G = JSON.parse(readFileSync('scripts/guides.json', 'utf8')) as { slug: string; title: string; desc: string; h1: string; summary: string; html: string; faq: [string, string][] }[];
for (const g of G) {
  const path = `/guides/${g.slug}/`, rel = '../../';
  const crumbs: [string, string][] = [['Home', '/'], ['Guides', '/guides/'], [g.h1, path]];
  const body = `${crumbsHtml(crumbs, rel)}<article class="article container"><h1>${esc(g.h1)}</h1><p class="meta">By the Revolt Lithium team, Muzaffarnagar · Updated ${TODAY}</p>${g.html.replace(/\{rel\}/g, rel)}
<h2>Questions</h2><div class="faq">${faqHtml(g.faq)}</div>
<div class="cta-band" style="margin-top:40px"><h2>Get a quotation on email</h2><a class="btn btn--lime" href="${rel}#quote">Request quotation</a></div></article>`;
  const schema = [crumbsLd(crumbs), faqLd(g.faq), { '@context': 'https://schema.org', '@type': 'Article', headline: g.h1, description: g.desc, datePublished: TODAY, dateModified: TODAY, inLanguage: 'en-IN',
    author: { '@type': 'Organization', name: 'Revolt Lithium Energy Solutions', url: SITE }, publisher: { '@type': 'Organization', name: 'Revolt Lithium Energy Solutions', logo: { '@type': 'ImageObject', url: `${SITE}/img/icon-512.png` } }, image: `${SITE}/img/og.jpg`, mainEntityOfPage: SITE + path }];
  write(path, shell({ path, title: g.title, desc: g.desc, body, schema }));
  sitemap.push([path, '0.7']);
}
{
  const path = '/guides/', rel = '../', crumbs: [string, string][] = [['Home', '/'], ['Guides', path]];
  const body = `${crumbsHtml(crumbs, rel)}<section class="container" style="padding-block:24px 96px"><h1 style="font-size:clamp(2.2rem,1.4rem + 3vw,3.6rem);margin-bottom:var(--s3)">Lithium battery buying guides</h1><p class="lede" style="margin-bottom:var(--s7)">Straight answers from the team that builds Livgreen and Redtuff batteries.</p>
<ul class="guides">${G.map(g => `<li><a href="${g.slug}/"><b>${esc(g.h1)}</b><span>${esc(g.summary)}</span></a></li>`).join('')}</ul></section>`;
  write(path, shell({ path, title: 'Lithium Battery Buying Guides | Revolt Lithium (Livgreen & Redtuff)', desc: 'Guides on e-rickshaw, e-scooter and inverter lithium batteries: cost vs lead-acid, choosing voltage, and backup hours.', body, schema: [crumbsLd(crumbs)] }));
  sitemap.push([path, '0.6']);
}

/* ---------- homepage (src/home.html template) ---------- */
{
  const H = JSON.parse(readFileSync('scripts/home-ld.json', 'utf8'));
  const sameAs = Object.values(CFG.social || {}).filter(Boolean);
  for (const n of H.graph['@graph']) {
    if (n['@type'] === 'Organization') { n.logo = `${SITE}/img/brand/revolt-logo-dark.webp`; n.name = 'Revolt Lithium Energy Solutions'; if (sameAs.length) n.sameAs = sameAs; else delete n.sameAs; }
  }
  const faq = H.faq.mainEntity.map((q: any) => [q.name, q.acceptedAnswer.text]) as [string, string][];
  const ctx = { rel: '', home: true, cfg: CFG, models: MODELS, slug };
  const html = readFileSync('src/home.html', 'utf8')
    .replaceAll('{{SITE}}', SITE)
    .replace('{{VERIFY}}', verifyMeta(CFG))
    .replace('{{LD}}', ld(H.graph) + '\n' + ld(H.faq))
    .replace('{{HEADER}}', header(ctx))
    .replace('{{FOOTER}}', footer(ctx))
    .replace('{{FLOATING}}', floating(ctx))
    .replace('{{FAQ}}', faqHtml(faq));
  if (/\{\{[A-Z]+\}\}/.test(html)) throw new Error('unfilled placeholder in home.html');
  writeFileSync('index.html', html);
}

/* ---------- privacy + terms ---------- */
{
  const legal = (path: string, title: string, desc: string, inner: string) =>
    writeFileSync('.' + path, shell({ path, file: true, title, desc, schema: [crumbsLd([['Home', '/'], [title.split(' |')[0], path]])],
      body: `${crumbsHtml([['Home', '/'], [title.split(' |')[0], path]], './')}<article class="article container">${inner}</article>` }));
  legal('/privacy.html', 'Privacy policy | Revolt Lithium Energy Solutions', 'How Revolt Lithium Energy Solutions uses the details you share in quotation and dealer enquiries.', `
<h1>Privacy policy</h1><p class="meta">Last updated ${TODAY}</p>
<p>Revolt Lithium Energy Solutions, 581, Brahmapuri, Civil Line Uttari, Muzaffarnagar, Uttar Pradesh 251001 ("we") runs this website.</p>
<h2>What we collect</h2><p>When you ask for a quotation or send a dealer enquiry we collect your name, mobile number, email, city, the battery or business details you choose and any message you write. We also record which ad or link brought you to the site (UTM tags and Google, Meta or Microsoft click IDs).</p>
<h2>How we use it</h2><p>We use these details to email your quotation, to call or WhatsApp you about it, to keep a record of enquiries in our customer system, and to measure which of our ads work. We do not sell your data.</p>
<h2>Service providers</h2><p>Depending on how the site is set up, enquiries may pass through our email provider, a spreadsheet or CRM we use to track leads, and spam protection by Cloudflare Turnstile. They process data only to provide that service to us.</p>
<h2>Cookies and analytics</h2><p>Google Analytics, Google Ads, Meta Pixel, Microsoft Clarity, Microsoft Advertising and LinkedIn tags load only after you press "Accept" on the cookie notice. Choosing "Essential only" keeps them off. The Google Map on the home page loads only when you press "Load Google Map".</p>
<h2>Your rights</h2><p>Under the Digital Personal Data Protection Act, 2023 you can ask us to see, correct or delete your data. Email <a href="mailto:${CFG.business.email}">${CFG.business.email}</a> or call 97560 73477.</p>`);
  legal('/terms.html', 'Terms and conditions | Revolt Lithium Energy Solutions', 'Quotation, warranty and website terms for Livgreen, Redtuff and Revolt lithium batteries.', `
<h1>Terms and conditions</h1><p class="meta">Last updated ${TODAY}</p>
<h2>Quotations</h2><p>Quotations sent from this website are valid for 7 days from the date shown on the quotation. Prices are subject to GST and to stock at the time of order. A quotation is not an order; an order is confirmed only when we confirm it in writing or by invoice.</p>
<h2>Warranty</h2><p>Electric-vehicle batteries carry a 36-month warranty and inverter batteries a 60-month warranty from the invoice date, unless your invoice states otherwise. Keep your invoice and the serial number on the pack; both are needed for a claim.</p>
<p>The warranty does not cover damage from opening or modifying the pack, physical impact, water, fire, exposure to direct sunlight, or charging with a charger other than the recommended lithium charger. As printed on every battery label, no claim is accepted if the usage instructions are not followed.</p>
<h2>Specifications and estimates</h2><p>Specifications are from our technical sheets and product labels. Range, backup and savings shown by the website calculators are estimates for guidance; real results depend on load, road, temperature, charger and usage.</p>
<h2>Website use</h2><p>Product photos, logos and text on this website belong to Revolt Lithium Energy Solutions. Livgreen and Redtuff are brands of Revolt Lithium Energy Solutions.</p>
<h2>Contact</h2><p>Revolt Lithium Energy Solutions, 581, Brahmapuri, Civil Line Uttari, Muzaffarnagar, Uttar Pradesh 251001. Phone 97560 73477, email <a href="mailto:${CFG.business.email}">${CFG.business.email}</a>.</p>`);
  sitemap.push(['/terms.html', '0.2']);
}

/* ---------- sitemap ---------- */
sitemap.push(['/privacy.html', '0.2']);
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemap.map(([p, pr]) => { const id = ids.find(i => p === `/batteries/${slug(i)}/`); return `  <url><loc>${SITE}${p}</loc><lastmod>${TODAY}</lastmod><priority>${pr}</priority>${id ? `<image:image><image:loc>${SITE}/img/p/${id}-1200.webp</image:loc></image:image>` : ''}</url>`; }).join('\n')}
</urlset>
`);
writeFileSync('scripts/slugs.json', JSON.stringify(Object.fromEntries(ids.map(i => [i, slug(i)])), null, 1));
console.log(`pages: ${sitemap.length} urls`, existsSync('css/site.css') ? 'css ok' : '');
