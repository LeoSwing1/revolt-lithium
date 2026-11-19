/* REVOLT Lithium — homepage: hero stage, product showcase, comparison, calculators, 3D view, quotation and dealer flows. */
import type { BatteryModel, Viewer } from './types';
import { track, initCommon, waLink, submitLead, validateForm, prefillFromQuery } from './common';
import { initImageFX } from './imagefx';
import SLUGS from '../scripts/slugs.json';

const MODELS = window.REVOLT_MODELS as Record<string, BatteryModel>;
const ids = Object.keys(MODELS);
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const WHKM: Record<string, number> = { rickshaw: 50, twowheeler: 28 };
const isInv = (m: BatteryModel) => m.vehicle === 'inverter';
const rangeKm = (m: BatteryModel, soc = 1) => Math.max(0, Math.round((m.kwh * 1000 * 0.9 * soc) / WHKM[m.vehicle] / 5) * 5);
const backupHr = (m: BatteryModel, soc = 1, watts = 500) => Math.round((m.kwh * 1000 * 0.9 * soc * 0.92) / watts * 10) / 10;
const perf = (m: BatteryModel, soc = 1) => isInv(m) ? { v: `≈${backupHr(m, soc)} hr`, l: 'backup at 500 W' } : { v: `≈${rangeKm(m, soc)} km`, l: 'range per charge' };
const useText = (m: BatteryModel) => m.vehicle === 'rickshaw' ? (m.note ? 'E-rickshaw, e-loader, fleet' : 'E-rickshaw') : m.vehicle === 'twowheeler' ? 'E-scooter, e-bike' : 'Home, office and solar inverters';
const catName: Record<string, string> = { rickshaw: 'E-Rickshaw', twowheeler: 'E-2 Wheeler', inverter: 'Inverter & Solar' };
const label = (m: BatteryModel) => `${m.brand} ${m.code}`;
const pageUrl = (id: string) => `batteries/${(SLUGS as Record<string, string>)[id]}/`;
const NO_ALPHA = new Set(['lg-5112']);                       // brochure artwork: framed studio image instead of a cut-out
const cut = (id: string) => NO_ALPHA.has(id) ? `img/p/${id}-1200.webp` : `img/a/${id}.webp`;
const logo = (b: string, tone: 'dark' | 'light') => `img/brand/${b.toLowerCase()}-logo-${tone}.webp`;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

initCommon();

/* ================= hero stage ================= */
{
  const FEAT = ['rt-5376', 'lg-6032', 'rt-5040', 'lg-2688', 'rt-6030'].filter(id => MODELS[id]);
  const wrap = $('#stage-items'), dots = $('#stage-dots'), stage = $('#stage');
  // first slide is server-rendered in home.html (fast LCP); the rest are added here
  wrap.insertAdjacentHTML('beforeend', FEAT.slice(1).map(id => `<div class="stage-item" aria-hidden="true"><img src="${cut(id)}" alt="${label(MODELS[id])} ${MODELS[id].v}V ${MODELS[id].ah}Ah" width="1000" height="750" loading="lazy" decoding="async"></div>`).join(''));
  dots.innerHTML = FEAT.map((id, i) => `<button type="button" role="tab" aria-label="${label(MODELS[id])}" aria-current="${i === 0}"></button>`).join('');
  const items = $$('.stage-item', wrap), btns = $$<HTMLButtonElement>('button', dots);
  let cur = 0, timer = 0;
  const show = (i: number) => {
    cur = (i + FEAT.length) % FEAT.length; const m = MODELS[FEAT[cur]];
    items.forEach((el, k) => { el.classList.toggle('on', k === cur); el.setAttribute('aria-hidden', String(k !== cur)); });
    btns.forEach((b, k) => { b.setAttribute('aria-current', String(k === cur)); if (k === cur) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; } });
    $('#st-kind').textContent = `${m.brand} · ${catName[m.vehicle]}`;
    $('#st-name').textContent = m.code;
    $('#st-specs').innerHTML = `<span>${m.v} V</span><span>${m.ah} Ah</span><span>${m.kwh} kWh</span><span>${m.warranty} mo warranty</span>`;
  };
  const play = () => { clearInterval(timer); if (!reduce) timer = window.setInterval(() => show(cur + 1), 5000); };
  btns.forEach((b, i) => b.addEventListener('click', () => { show(i); play(); }));
  stage.addEventListener('pointerenter', () => { clearInterval(timer); stage.classList.add('paused'); });
  stage.addEventListener('pointerleave', () => { stage.classList.remove('paused'); play(); });
  document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(timer) : play());
  show(0); play();
}

/* ================= showcase ================= */
let cat = 'rickshaw', sel = 'rt-5376';
const DEFAULT: Record<string, string> = { rickshaw: 'rt-5376', twowheeler: 'lg-6032', inverter: 'rt-2688' };
['rickshaw', 'twowheeler', 'inverter'].forEach(c => { const el = $('#cnt-' + c); if (el) el.textContent = String(ids.filter(id => MODELS[id].vehicle === c).length); });

function renderList() {
  $('#pick-list').innerHTML = ids.filter(id => MODELS[id].vehicle === cat).map(id => {
    const m = MODELS[id];
    return `<button class="pick" type="button" role="option" data-pick="${id}" aria-selected="${id === sel}">
      <img src="${cut(id)}" alt="" width="84" height="64" loading="lazy" decoding="async">
      <span><span class="bt ${m.brand}">${m.brand}</span><b>${m.code}</b><small>${useText(m)}</small></span>
      <span class="v">${m.v} V<br>${m.ah} Ah</span></button>`;
  }).join('');
}
function renderFeature(animate = true) {
  const m = MODELS[sel], p = perf(m), img = $<HTMLImageElement>('#f-img'), media = $('#f-media');
  const apply = () => {
    img.src = cut(sel); img.alt = `${label(m)} ${m.v}V ${m.ah}Ah LiFePO4 ${m.kind}`;
    media.dataset.brand = m.brand;
    const bl = $<HTMLImageElement>('#f-brand'); bl.src = logo(m.brand, 'dark'); bl.alt = m.brand;
    $('#f-w').textContent = String(m.warranty);
    $('#f-kind').textContent = `${catName[m.vehicle]} · ${m.kind}`;
    $('#f-name').textContent = `${m.code} — ${m.v}V ${m.ah}Ah`;
    const bt = $('#f-bt'); bt.className = 'bt ' + m.brand; bt.textContent = m.brand;
    $('#f-specs').innerHTML = [['Voltage', `${m.v} V`], ['Capacity', `${m.ah} Ah`], ['Energy', `${m.kwh} kWh`], ['Chemistry', 'LiFePO4'], ['Warranty', `${m.warranty} months`], [isInv(m) ? 'Backup at 500 W' : 'Approx. range', p.v.replace('≈', '≈ ')]]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $<HTMLAnchorElement>('#f-page').href = pageUrl(sel);
    $<HTMLAnchorElement>('#f-quote').dataset.quote = sel;
    $<HTMLAnchorElement>('#f-wa').href = waLink(`Namaste, ${label(m)} ${m.v}V ${m.ah}Ah ki price batayein.`);
    img.classList.remove('out');
  };
  media.classList.remove('zoom'); $('#f-zoom').setAttribute('aria-pressed', 'false');
  if (animate && !reduce) { img.classList.add('out'); setTimeout(apply, 220); } else apply();
}
function selectCat(c: string, pick?: string) {
  cat = c; sel = pick && MODELS[pick]?.vehicle === c ? pick : DEFAULT[c];
  $$('#cat-tabs [role=tab]').forEach(b => { const on = b.dataset.cat === c; b.setAttribute('aria-selected', String(on)); (b as HTMLButtonElement).tabIndex = on ? 0 : -1; });
  renderList(); renderFeature();
}
function selectModel(id: string) {
  if (!MODELS[id]) return;
  if (MODELS[id].vehicle !== cat) return selectCat(MODELS[id].vehicle, id);
  sel = id; $$('.pick').forEach(b => { const on = b.dataset.pick === id; b.setAttribute('aria-selected', String(on)); });
  renderFeature(); track('view_item', { item_id: id, item_name: label(MODELS[id]), item_brand: MODELS[id].brand, source: 'showcase' });
}
$('#cat-tabs').addEventListener('click', e => { const b = (e.target as Element).closest<HTMLElement>('[data-cat]'); if (b) selectCat(b.dataset.cat!); });
$('#pick-list').addEventListener('click', e => { const b = (e.target as Element).closest<HTMLElement>('[data-pick]'); if (b) selectModel(b.dataset.pick!); });
$('#f-zoom').addEventListener('click', () => { const z = $('#f-media').classList.toggle('zoom'); $('#f-zoom').setAttribute('aria-pressed', String(z)); });
$('#f-media').addEventListener('pointermove', e => {
  const media = $('#f-media'); if (!media.classList.contains('zoom')) return;
  const r = media.getBoundingClientRect(); $<HTMLImageElement>('#f-img').style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`;
});
$('#f-media').addEventListener('click', e => { if ((e.target as Element).closest('.chip-btn')) return; $('#f-zoom').click(); });
$('#f-real').addEventListener('click', () => openProduct(sel));
$('#f-3d').addEventListener('click', () => open3D(sel));
renderList(); renderFeature(false);
// hash routes: #inverter, #e-rickshaw, #e-2-wheeler open the matching tab; #p-<id> opens the product overlay
const HASHCAT: Record<string, string> = { '#inverter': 'inverter', '#e-rickshaw': 'rickshaw', '#e-2-wheeler': 'twowheeler', '#batteries': '' };
function route() {
  const h = location.hash;
  if (HASHCAT[h]) { selectCat(HASHCAT[h]); $('#batteries').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  if (h.startsWith('#p-')) { const id = h.slice(3); if (MODELS[id]) { selectModel(id); openProduct(id); } }
}
addEventListener('hashchange', route);
$$('[data-showbrand]').forEach(b => b.addEventListener('click', () => {
  const brand = b.dataset.showbrand!, first = ids.find(id => MODELS[id].brand === brand && MODELS[id].vehicle === 'rickshaw') || ids.find(id => MODELS[id].brand === brand)!;
  selectModel(first); $('#batteries').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

/* ================= comparison table ================= */
$('#cmp tbody').innerHTML = ids.map(id => {
  const m = MODELS[id];
  return `<tr data-cat="${m.vehicle}"><td><a href="${pageUrl(id)}">${m.code}</a></td><td><span class="bt ${m.brand}">${m.brand}</span></td><td>${catName[m.vehicle]}</td><td>${m.v} V</td><td>${m.ah} Ah</td><td>${m.kwh} kWh</td><td>LiFePO4</td><td class="w">${m.warranty} months</td><td>${isInv(m) ? `≈${backupHr(m)} hr at 500 W` : `≈${rangeKm(m)} km`}</td></tr>`;
}).join('');
$('#cmp-tabs').addEventListener('click', e => {
  const b = (e.target as Element).closest<HTMLElement>('[data-f]'); if (!b) return;
  $$('#cmp-tabs [role=tab]').forEach(x => { const on = x === b; x.setAttribute('aria-selected', String(on)); (x as HTMLButtonElement).tabIndex = on ? 0 : -1; });
  $$<HTMLTableRowElement>('#cmp tbody tr').forEach(tr => tr.hidden = !(b.dataset.f === 'all' || tr.dataset.cat === b.dataset.f));
});

/* ================= product overlay ================= */
const dlg = $<HTMLDialogElement>('#dlg');
function openProduct(id: string) {
  const m = MODELS[id]; if (!m) return;
  const img = $<HTMLImageElement>('#dlg-img'); img.src = cut(id); img.alt = `${label(m)} studio view`;
  const rows: [string, string][] = [
    ['Brand', m.brand], ['Model', m.code], ['Use', useText(m)], ['Chemistry', 'Lithium ferrophosphate (LiFePO4)'], ['Nominal voltage', `${m.v} V`], ['Capacity', `${m.ah} Ah`], ['Energy', `${m.kwh} kWh`],
    [isInv(m) ? 'Approx. backup' : 'Approx. range', isInv(m) ? `${backupHr(m)} hr at 500 W, ${backupHr(m, 1, 1000)} hr at 1000 W` : `${rangeKm(m)} km per charge`], ['Warranty', `${m.warranty} months`],
    ['BMS protection', 'Over/under voltage, over-discharge, short circuit, charge and discharge over-temperature, low-battery shut-down'],
    ...(m.bluetooth ? [['Smart BMS', 'Bluetooth app: live cell voltage and temperature']] as [string, string][] : []),
    ...(m.cable ? [['Connector', 'Anderson-type plug, ready to fit']] as [string, string][] : []),
    ...(m.display ? [['Display', 'Built-in screen with charge level and pack status']] as [string, string][] : []),
    ...(m.fullSpec ? [['Configuration', '16S1P prismatic, 44 ± 1 kg'], ['Charging', '20 A standard, 25 A max (≈4–5 hr)']] as [string, string][] : [])
  ];
  $('#dlg-body').innerHTML = `<div><span class="bt ${m.brand}">${m.brand}</span><h3 id="dlg-title" style="font-size:clamp(1.4rem,1.1rem + 1vw,1.9rem)">${m.code} ${m.v}V ${m.ah}Ah</h3><p class="note" style="margin-top:.3rem">${catName[m.vehicle]} · ${m.kind}</p></div>
    ${m.note ? `<p>${m.note}</p>` : ''}
    <figure class="real"><img src="${m.photo}" alt="Actual photo of ${label(m)} at our assembly floor" loading="lazy" width="88" height="66"><figcaption>Actual product photo from our assembly floor</figcaption></figure>
    <table class="spec"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>
    <div class="f-cta"><a class="btn btn--lime" href="#quote" data-quote="${id}" data-close>Get a quotation</a><a class="btn" href="${pageUrl(id)}">Detailed specification</a><button class="btn btn--ghost" type="button" data-3d="${id}">View in 3D</button></div>`;
  if (!dlg.open) dlg.showModal();
  track('view_item', { item_id: id, item_name: label(m), item_brand: m.brand, source: 'overlay' });
}
const closeDlg = () => { if (dlg.open) dlg.close(); if (location.hash.startsWith('#p-')) history.replaceState(null, '', location.pathname + location.search); };
$('.dlg-x', dlg).addEventListener('click', closeDlg);
dlg.addEventListener('click', e => { if (e.target === dlg || (e.target as Element).closest('[data-close]')) closeDlg(); });

/* ================= 3D modal (WebGL loads only when asked) ================= */
const d3 = $<HTMLDialogElement>('#d3');
let viewer: Viewer | null = null, d3Model = 'rt-5376', booting: Promise<void> | null = null;
function readout() {
  const m = MODELS[d3Model], soc = +$<HTMLInputElement>('#charge').value / 100, p = perf(m, soc);
  $('#ro-km').textContent = p.v; $('#ro-unit').textContent = isInv(m) ? 'backup at 500 W at this charge' : 'range at this charge';
  $('#charge-out').textContent = Math.round(soc * 100) + '%'; $('#d3-title').textContent = `${label(m)} · ${m.v}V ${m.ah}Ah`;
}
async function open3D(id: string) {
  d3Model = id; if (dlg.open) dlg.close(); d3.showModal(); readout();
  track('view_3d', { item_id: id });
  if (viewer) { viewer.setModel(id); return; }
  booting ??= (async () => {
    try {
      const { initViewer } = await import('./viewer');
      viewer = initViewer($<HTMLCanvasElement>('#stage3d'));
      if (!viewer) throw new Error('no webgl');
      viewer.setCharge(+$<HTMLInputElement>('#charge').value / 100); await viewer.start(d3Model);
    } catch { $('#stage3d').replaceWith(Object.assign(document.createElement('p'), { className: 'note', style: 'padding:24px', textContent: '3D view needs WebGL, which this browser has turned off. The photos and specifications above show the same battery.' })); }
  })();
  await booting; viewer?.setModel(d3Model);
}
$('.dlg-x', d3).addEventListener('click', () => d3.close());
d3.addEventListener('click', e => { if (e.target === d3) d3.close(); });
$('#charge').addEventListener('input', e => { viewer?.setCharge(+(e.target as HTMLInputElement).value / 100); readout(); });
$('#xray').addEventListener('change', e => { const on = (e.target as HTMLInputElement).checked; viewer?.setXray(on); if (on) track('view_inside', { item_id: d3Model }); });

document.addEventListener('click', e => {
  const t = e.target as Element;
  const q = t.closest<HTMLElement>('[data-quote]'); if (q) setQuoteModel(q.dataset.quote!);
  const v = t.closest<HTMLElement>('[data-3d]'); if (v) open3D(v.dataset['3d']!);
  const ct = t.closest<HTMLElement>('[data-calc-tab]'); if (ct) selectCalc('t-' + ct.dataset.calcTab);
});

/* ================= calculators (logic unchanged) ================= */
const tabsEl = $('#calc-tabs'), calcTabs = $$<HTMLButtonElement>('[role=tab]', tabsEl);
function selectCalc(tid: string) {
  calcTabs.forEach(x => { const on = x.id === tid; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
}
calcTabs.forEach(t => t.addEventListener('click', () => selectCalc(t.id)));
tabsEl.addEventListener('keydown', e => {
  const i = calcTabs.indexOf(document.activeElement as HTMLButtonElement); if (i < 0) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = calcTabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + calcTabs.length) % calcTabs.length]; selectCalc(n.id); n.focus(); }
});
const opt = (list: string[]) => list.map(id => `<option value="${id}">${label(MODELS[id])} — ${MODELS[id].v}V ${MODELS[id].ah}Ah</option>`).join('');
$('#g-model').innerHTML = opt(ids.filter(id => !isInv(MODELS[id])));
$('#b-model').innerHTML = opt(ids.filter(id => isInv(MODELS[id])));
type F = HTMLFormElement & { elements: any };
const num = (f: F, n: string) => parseFloat(f.elements[n].value) || 0;
const calcTracked: Record<string, 1> = {};
const calcDone = (name: string) => { if (!calcTracked[name]) { calcTracked[name] = 1; track('calculator_complete', { calculator: name }); } };
// slider fill + live value labels
function syncRanges(f: F) {
  $$<HTMLInputElement>('input[type=range]', f).forEach(r => {
    r.style.setProperty('--p', ((+r.value - +r.min) / (+r.max - +r.min) * 100) + '%');
    const o = $<HTMLOutputElement>(`output[for="${r.id}"]`, f); if (o) o.textContent = (o.dataset.pre || '') + (+r.value).toLocaleString('en-IN') + (o.dataset.post || '');
  });
}
const sForm = $<F>('[data-calc=save]');
sForm.elements.veh.addEventListener('change', (e: Event) => {
  const r = (e.target as HTMLSelectElement).value === 'rickshaw';
  sForm.elements.km.value = r ? 90 : 40; sForm.elements.lead.value = r ? 30000 : 12000;
  sForm.elements.leadlife.value = r ? 12 : 15; sForm.elements.li.value = r ? 62000 : 30000;
});
function calcSave() {
  const f = sForm, veh = f.elements.veh.value, months = num(f, 'years') * 12;
  const kmMonth = num(f, 'km') * num(f, 'days'), wh = WHKM[veh], unit = num(f, 'unit');
  const liElec = kmMonth * wh / 0.95 / 1000 * unit * months;
  const ldElec = kmMonth * wh * 1.08 / 0.75 / 1000 * unit * months;          // heavier pack + lower efficiency
  const sets = Math.ceil(months / Math.max(1, num(f, 'leadlife')));
  const ld = sets * num(f, 'lead') + ldElec + 200 * months;
  const li = num(f, 'li') + liElec;
  const save = ld - li;
  $('#r-save').textContent = save > 0 ? inr(save) : inr(0);
  $('#r-save-sub').textContent = save > 0 ? `over ${months / 12} years, about ${inr(save / months)} a month` : 'No saving at these numbers. Try your actual daily kilometres.';
  const mx = Math.max(ld, li);
  $('#r-li-l').textContent = `${inr(li)} · 1 pack`; $('#r-li-b').style.width = (li / mx * 100) + '%';
  $('#r-ld-l').textContent = `${inr(ld)} · ${sets} sets`; $('#r-ld-b').style.width = (ld / mx * 100) + '%';
}
const gForm = $<F>('[data-calc=range]');
function calcRange() {
  const m = MODELS[gForm.elements.model.value]; if (!m) return;
  const km = m.kwh * 1000 * num(gForm, 'dod') / (WHKM[m.vehicle] * num(gForm, 'load'));
  const amp = Math.max(1, num(gForm, 'amp')), from = Math.min(95, num(gForm, 'from'));
  const hr = m.ah * (1 - from / 100) / amp * 1.05;
  $('#r-km').textContent = `≈${Math.round(km)} km`;
  $('#r-km-pct').textContent = `${Math.min(999, Math.round(km))}%`; $('#r-km-b').style.width = Math.min(100, km) + '%';
  const h = Math.floor(hr), mi = Math.round((hr - h) * 60);
  $('#r-hr').textContent = `${h} hr ${mi} min`;
}
gForm.elements.model.addEventListener('change', () => { const m = MODELS[gForm.elements.model.value]; gForm.elements.amp.value = m.vehicle === 'rickshaw' ? 20 : 6; });
const eForm = $<F>('[data-calc=eco]');
eForm.elements.veh.addEventListener('change', (e: Event) => { const r = (e.target as HTMLSelectElement).value === 'rickshaw'; eForm.elements.km.value = r ? 90 : 40; eForm.elements.fuel.value = r ? 88 : 95; });
function calcEco() {
  const r = eForm.elements.veh.value === 'rickshaw';
  const kmYr = num(eForm, 'km') * num(eForm, 'days');
  const fuelKmL = r ? 25 : 45, fuelCO2 = r ? 2.68 : 2.31;
  const evKwh = kmYr * WHKM[r ? 'rickshaw' : 'twowheeler'] / 0.95 / 1000;
  const co2 = kmYr / fuelKmL * fuelCO2 - evKwh * 0.72;
  const fuelCost = kmYr / fuelKmL * num(eForm, 'fuel'), elecCost = evKwh * 7.5;
  const lead = r ? 3 * 72 : 3 * 18;
  $('#r-co2').textContent = co2 >= 1000 ? `${(co2 / 1000).toFixed(1)} tonnes` : `${Math.round(co2)} kg`;
  $('#r-trees').textContent = `Same as ${Math.round(co2 / 21)} trees growing for a year`;
  $('#r-fuel').textContent = `${inr(fuelCost - elecCost)} a year saved on fuel, after paying for electricity`;
  $('#r-lead').textContent = `About ${lead} kg of lead kept out of scrap over 3 years`;
}
const bForm = $<F>('[data-calc=backup]');
function calcBackup() {
  const m = MODELS[bForm.elements.model.value]; if (!m) return;
  const w = Math.max(10, num(bForm, 'watts')), hr = m.kwh * 1000 * 0.9 * 0.92 / w;
  const h = Math.floor(hr), mi = Math.round((hr - h) * 60);
  $('#r-bk').textContent = `${h} hr ${mi} min`;
  const amp = Math.max(1, num(bForm, 'amp')), ch = m.ah * 0.9 / amp * 1.05;
  $('#r-bc').textContent = `${Math.floor(ch)} hr ${Math.round((ch % 1) * 60)} min`;
  const fans = Math.floor(w / 75), lights = Math.floor((w - fans * 75) / 15);
  $('#r-bl').textContent = `${w} W is about ${fans} ceiling fan${fans === 1 ? '' : 's'}${lights > 0 ? ` and ${lights} LED light${lights === 1 ? '' : 's'}` : ''} running together.`;
}
([[bForm, calcBackup, 'backup'], [sForm, calcSave, 'savings'], [gForm, calcRange, 'range'], [eForm, calcEco, 'pollution']] as [F, () => void, string][]).forEach(([f, fn, n]) => {
  const run = () => { syncRanges(f); fn(); };
  f.addEventListener('input', () => { run(); calcDone(n); }); f.addEventListener('change', () => { run(); calcDone(n); }); run();
});

/* ================= quotation ================= */
const qf = $<HTMLFormElement>('#qform');
function fillModels(c: string, keep?: string) {
  const list = ids.filter(id => MODELS[id].vehicle === c);
  $('#q-model').innerHTML = opt(list) + '<option value="help">Not sure, help me choose</option>';
  if (keep && list.includes(keep)) $<HTMLSelectElement>('#q-model').value = keep;
}
function setQuoteModel(id: string) {
  if (id === 'help') { $<HTMLSelectElement>('#q-model').value = 'help'; return; }
  const m = MODELS[id]; if (!m) return;
  $<HTMLInputElement>(`input[name=category][value=${m.vehicle}]`, qf).checked = true; fillModels(m.vehicle, id);
  const buyer = $<HTMLSelectElement>('#q-buyer'); if (m.vehicle === 'inverter' && buyer.selectedIndex === 0) buyer.value = 'Home / office owner';
  track('select_item', { item_id: id });
}
$$<HTMLInputElement>('input[name=category]', qf).forEach(r => r.addEventListener('change', () => fillModels(r.value)));
fillModels('rickshaw');
qf.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateForm(qf)) return;
  const fd: Record<string, any> = Object.fromEntries(new FormData(qf));
  const m = MODELS[fd.model];
  await submitLead(qf, { kind: 'quote', ...fd, qty: Math.max(1, +fd.qty || 1), modelName: m ? `${label(m)} ${m.v}V ${m.ah}Ah` : 'Help me choose', categoryName: catName[fd.category] }, {
    button: $<HTMLButtonElement>('#q-btn'), idle: 'Send me the quotation',
    ok: d => `Quotation sent to <b>${String(d.email).replace(/</g, '')}</b>. Check your inbox (and spam folder). We'll also call you from 97560 73477.`,
    wa: d => `Quotation request\nName: ${d.name}\nMobile: ${d.phone}\nEmail: ${d.email}\nCity: ${d.city || '-'}\nCategory: ${d.categoryName}\nBattery: ${d.modelName}\nQty: ${d.qty}\n${d.message ? 'Note: ' + d.message : ''}`,
    event: d => ['generate_lead', { item_id: d.model, item_category: d.category, buyer: d.buyer, qty: d.qty, value: 1, currency: 'INR' }]
  });
  fillModels('rickshaw');
});

/* ================= dealers ================= */
{
  const TOWNS: [string, number, number][] = [['Saharanpur', 250, 52], ['Roorkee', 400, 62], ['Shamli', 112, 168], ['Muzaffarnagar', 268, 178], ['Bijnor', 470, 170], ['Khatauli', 262, 262], ['Baghpat', 104, 330], ['Meerut', 268, 340]];
  const pts = (window.REVOLT_CONFIG.salesPoints || []) as { name: string; type: string; city: string; address: string; phone: string; maps: string }[];
  const svg = `<svg viewBox="0 0 560 400" role="img" aria-label="Service area around Muzaffarnagar"><defs><radialGradient id="glow"><stop offset="0" stop-color="#A8D829" stop-opacity=".35"/><stop offset="1" stop-color="#A8D829" stop-opacity="0"/></radialGradient></defs>
    <path d="M60 30 C 180 10, 420 20, 520 70 C 540 160, 520 300, 470 370 C 330 395, 170 392, 60 360 C 30 260, 35 120, 60 30z" fill="#102B50" stroke="#2A4D7F" stroke-dasharray="4 6"/>
    <circle cx="268" cy="178" r="140" fill="url(#glow)"/>
    <path d="M250 52 L268 178 L268 340 M112 168 L268 178 L470 170 M400 62 L268 178 M104 330 L268 262" stroke="#2F5A93" stroke-width="1.5" fill="none"/>
    ${TOWNS.map(([n, x, y]) => `<g class="town${n === 'Muzaffarnagar' ? ' hq' : ''}" data-town="${n}" tabindex="0" role="button" aria-label="${n}"><circle cx="${x}" cy="${y}" r="${n === 'Muzaffarnagar' ? 9 : 6}"/>${n === 'Muzaffarnagar' ? `<circle cx="${x}" cy="${y}" r="16" fill="none" stroke="#A8D829" class="pulse"/>` : ''}<text x="${x + 14}" y="${y + 5}">${n}</text></g>`).join('')}
  </svg>`;
  $('#d-map').innerHTML = svg;
  $('#d-towns').innerHTML = TOWNS.map(([n]) => `<option value="${n}">`).join('');
  const pin = '<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></span>';
  const card = (p: typeof pts[0]) => `<div class="point">${pin}<div><small>${p.type}</small><b>${p.name}</b><p>${p.address}</p><div class="acts"><a class="btn btn--lime btn--sm" href="tel:${p.phone.replace(/\s/g, '')}" data-track="call">Call ${p.phone.replace('+91', '').trim()}</a><a class="btn btn--ghost btn--sm" href="${p.maps}" target="_blank" rel="noopener" data-track="directions">Directions</a></div></div></div>`;
  const render = (q: string) => {
    const t = q.trim().toLowerCase();
    const hit = pts.filter(p => !t || p.city.toLowerCase().includes(t) || p.name.toLowerCase().includes(t));
    $$('#d-map .town').forEach(g => g.classList.toggle('on', !!t && g.dataset.town!.toLowerCase().startsWith(t)));
    const town = q.trim().replace(/^./, c => c.toUpperCase());
    $('#d-points').innerHTML = hit.length ? hit.map(card).join('') :
      `<div class="empty">No REVOLT dealer is listed in <b>${town.replace(/</g, '')}</b> yet. Buy direct from our Muzaffarnagar showroom, or <a class="link" href="#dform" data-dealer-city="${town.replace(/"/g, '')}">become the first dealer in ${town.replace(/</g, '')}</a>.</div>${pts.map(card).join('')}`;
  };
  const input = $<HTMLInputElement>('#d-search');
  input.addEventListener('input', () => render(input.value));
  $('#d-map').addEventListener('click', e => { const g = (e.target as Element).closest<SVGGElement>('[data-town]'); if (g) { input.value = g.dataset.town!; render(input.value); track('dealer_search', { town: input.value }); } });
  $('#d-map').addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Enter') ((e.target as Element).closest('[data-town]') as HTMLElement)?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  document.addEventListener('click', e => { const a = (e.target as Element).closest<HTMLElement>('[data-dealer-city]'); if (a) $<HTMLInputElement>('#d-city').value = a.dataset.dealerCity!; });
  render('');
  // Google Map: click-to-load (no third-party request until the visitor asks)
  $('#d-embed-btn').addEventListener('click', () => {
    const q = encodeURIComponent('Railway Under Pass, Sandhawali Road, Muzaffarnagar 251003');
    $('#d-embed').innerHTML = `<iframe title="Map of the REVOLT showroom, Sandhawali Road, Muzaffarnagar" src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    track('map_loaded', {});
  });
  const df = $<HTMLFormElement>('#dform');
  df.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm(df, { city: (v: string) => v.trim().length >= 2 || 'Enter your city or town.' })) return;
    const fd: Record<string, any> = Object.fromEntries(new FormData(df));
    await submitLead(df, { kind: 'dealer', buyer: 'Dealer / distributor', model: 'help', modelName: 'Dealership', qty: 1, ...fd }, {
      button: $<HTMLButtonElement>('button[type=submit]', df), idle: 'Send dealer enquiry',
      ok: d => `Thank you, ${String(d.name).replace(/</g, '')}. Your dealer enquiry for ${String(d.city).replace(/</g, '')} has reached our team, and a confirmation is on its way to your email. We'll call you from 99901 38500.`,
      wa: d => `Dealer enquiry\nName: ${d.name}\nBusiness: ${d.business || '-'}\nMobile: ${d.phone}\nEmail: ${d.email}\nCity: ${d.city}\nCurrent business: ${d.dealerType}\n${d.message ? 'Note: ' + d.message : ''}`,
      event: d => ['generate_lead', { lead_type: 'dealer', city: d.city, value: 1, currency: 'INR' }]
    });
  });
}

/* ================= boot ================= */
prefillFromQuery(id => setQuoteModel(id));
route();
initImageFX('.step .ph');
