/* ============================================================
   REVOLT LITHIUM — SITE CONFIG
   Edit this one file to go live. Every ID left blank stays off.
   ============================================================ */
window.REVOLT_CONFIG = {
  siteUrl: 'https://www.livgreenlithium.com',          // canonical domain (from brochure)
  business: {
    name: 'Revolt Lithium Energy Solutions',
    phones: ['+919756073477', '+919990138500'],        // shown everywhere on the site
    whatsapp: '919756073477',                           // confirm this number is on WhatsApp
    email: 'livgreenlithium@gmail.com',
    owner: 'Muhammad Sajid',
    googleReviewUrl: '',                                // paste the GBP 'Ask for reviews' link (g.page/r/...) to show review buttons
    gbpMapsUrl: ''                                      // paste the Google Maps link of the verified profile
  },

  // Where customers can buy today. Add dealers here as they sign up; the dealer locator reads this list.
  salesPoints: [
    { name: 'REVOLT factory showroom', type: 'Manufacturer showroom', city: 'Muzaffarnagar',
      address: 'Railway Under Pass, Sandhawali Road, Muzaffarnagar, UP 251003', phone: '+91 97560 73477',
      maps: 'https://www.google.com/maps/search/?api=1&query=Railway+Under+Pass+Sandhawali+Road+Muzaffarnagar+251003' }
  ],

  // Social profiles: footer icons + schema sameAs appear only for filled links.
  social: { facebook: '', instagram: '', youtube: '', linkedin: '' },

  // Search Console / Bing / Meta / Pinterest domain verification tokens (the content="..." value only).
  verification: { google: '', bing: '', facebook: '', pinterest: '' },

  // Cloudflare Turnstile site key (spam protection on both forms). Leave blank to switch off.
  turnstileSiteKey: '',

  // Quotation email: POST target (see /api/quote.js). Leave as-is on Vercel.
  quoteEndpoint: '/api/quote',

  // Prices for the emailed quotation live server-side in /api/catalog.js (never shown in page code).

  // ---------- Marketing & analytics (paste IDs, nothing else to change) ----------
  tracking: {
    gtm: '',                 // GTM-XXXXXXX
    ga4: '',                 // G-XXXXXXXXXX
    metaPixel: '',           // 15-16 digit Pixel ID
    googleAds: { id: '', leadLabel: '', callLabel: '' },   // AW-XXXXXXXXX + conversion labels
    clarity: '',             // Microsoft Clarity project ID
    linkedin: '',            // LinkedIn Insight partner ID (dealer B2B ads)
    bingUet: '',             // Microsoft Advertising UET tag ID
    requireConsent: true     // DPDP-friendly: trackers load after "Accept"
  }
};

/* 3D models + catalogue. size = [width, height, depth] in metres (visual only). */
window.REVOLT_MODELS = {
  'rt-5376': { brand: 'Redtuff', code: 'RT-5.376KWH', kind: 'E-Rickshaw Battery', vehicle: 'rickshaw', v: 51.2, ah: 105, kwh: 5.376, warranty: 36,
    size: [0.6, 0.34, 0.4], face: [0.5, 0.28], case: 'lime', handles: 'ends', cells: 16,
    photo: 'img/redtuff-e-rickshaw-51v-105ah.webp', fullSpec: true },
  'lg-5112': { brand: 'Livgreen', code: 'LG 51.2V 105Ah', kind: 'E-Rickshaw Battery', vehicle: 'rickshaw', v: 51.2, ah: 105, kwh: 5.376, warranty: 36,
    size: [0.6, 0.34, 0.4], face: [0.5, 0.28], case: 'lime', handles: 'ends', cells: 16,
    photo: 'img/livgreen-e-rickshaw-51v-105ah.webp', fullSpec: true },
  'lg-96105': { brand: 'Livgreen', brandText: 'LIVGREEN', code: 'LG 96V 105Ah', kind: 'High-voltage EV battery', vehicle: 'rickshaw', v: 96, ah: 105, kwh: 10.08, warranty: 36,
    size: [0.7, 0.58, 0.34], face: [0.42, 0.24], faceY: 0.1, finish: 'engraved', case: 'black', handles: 'four', display: true, cells: 30,
    photo: 'img/livgreen-96v-105ah.webp', note: 'For e-loaders, fleet and custom high-voltage EVs. Application check on call.' },
  'lg-4830': { brand: 'Livgreen', brandText: 'LIVGREEN', code: 'LG-4830', kind: 'E-Vehicle Battery', vehicle: 'twowheeler', v: 48, ah: 30, kwh: 1.44, warranty: 36,
    size: [0.26, 0.33, 0.18], face: [0.22, 0.24], finish: 'engraved', handles: 'top', cable: true, cells: 15,
    photo: 'img/livgreen-lg-4830-48v-30ah.webp' },
  'lg-6030': { brand: 'Livgreen', brandText: 'LIVGREEN', code: 'LG-6030', kind: 'E-Vehicle Battery', vehicle: 'twowheeler', v: 60, ah: 30, kwh: 1.8, warranty: 36,
    size: [0.26, 0.36, 0.18], face: [0.22, 0.26], finish: 'engraved', handles: 'top', cable: true, cells: 19,
    photo: 'img/livgreen-lg-6030-lg-7230.webp' },
  'lg-6032': { brand: 'Livgreen', code: 'LG 6032', kind: 'E-Vehicle Battery', vehicle: 'twowheeler', v: 60, ah: 32, kwh: 1.92, warranty: 36,
    size: [0.26, 0.34, 0.18], face: [0.22, 0.2], faceY: -0.03, case: 'black', lid: true, handles: 'top', cable: true, cells: 20,
    photo: 'img/livgreen-lg-6032-60v-32ah.webp' },
  'lg-7230': { brand: 'Livgreen', brandText: 'LIVGREEN', code: 'LG-7230', kind: 'E-Vehicle Battery', vehicle: 'twowheeler', v: 72, ah: 30, kwh: 2.16, warranty: 36,
    size: [0.26, 0.4, 0.18], face: [0.22, 0.29], finish: 'engraved', handles: 'top', cable: true, cells: 23,
    photo: 'img/livgreen-lg-7230-72v-30ah.webp' },
  'rt-6030': { brand: 'Redtuff', code: 'RT-6030', kind: 'E-Vehicle Battery', vehicle: 'twowheeler', v: 60, ah: 30, kwh: 1.8, warranty: 36,
    size: [0.26, 0.34, 0.18], face: [0.22, 0.2], faceY: -0.03, case: 'black', lid: true, handles: 'top', cable: true, cells: 19,
    photo: 'img/redtuff-e-vehicle-battery.webp', alt: 'img/redtuff-rt-6030-60v-30ah.webp' },
  'rles-6030': { brand: 'Revolt', brandText: 'REVOLT', code: 'RLES 60V 30Ah', kind: 'E-Vehicle Battery', vehicle: 'twowheeler', v: 60, ah: 30, kwh: 1.8, warranty: 36,
    size: [0.2, 0.4, 0.18], face: [0.17, 0.3], finish: 'engraved', handles: 'top', cable: true, cells: 19, bluetooth: true,
    photo: 'img/revolt-rles-60v-connector.webp', alt: 'img/smart-bms-bluetooth-60v.webp' },
  'rles-4830': { brand: 'Revolt', brandText: 'REVOLT', code: 'RLES 48V 30Ah', kind: 'E-Vehicle Battery', vehicle: 'twowheeler', v: 48, ah: 30, kwh: 1.44, warranty: 36,
    size: [0.26, 0.3, 0.18], face: [0.22, 0.22], finish: 'engraved', handles: 'top', cable: true, cells: 15, bluetooth: true,
    photo: 'img/revolt-48v-30ah-pack.webp' }
  ,
  'rt-1344': { brand: 'Redtuff', code: 'RT-1.344KWH', kind: 'Inverter Battery', vehicle: 'inverter', v: 12.8, ah: 105, kwh: 1.344, warranty: 60,
    size: [0.3, 0.46, 0.24], face: [0.24, 0.38], case: 'steel', bezel: 0x8fca22, handles: 'top', cells: 4,
    photo: 'img/redtuff-inverter-12v-105ah.webp', note: 'For home inverters up to about 900 VA (12V systems).' },
  'rt-2688': { brand: 'Redtuff', code: 'RT-2.688KWH', kind: 'Inverter Battery', vehicle: 'inverter', v: 25.6, ah: 105, kwh: 2.688, warranty: 60,
    size: [0.44, 0.42, 0.26], face: [0.36, 0.34], case: 'steel', bezel: 0x8fca22, handles: 'top', cells: 8,
    photo: 'img/redtuff-inverter-25v-105ah.webp', note: 'For 24V home and office inverters (about 1.5–2 kVA).' },
  'rt-5040': { brand: 'Redtuff', code: 'RT-5.040KWH', kind: 'Inverter Battery', vehicle: 'inverter', v: 48, ah: 105, kwh: 5.04, warranty: 60,
    size: [0.42, 0.74, 0.22], face: [0.34, 0.5], faceY: -0.08, case: 'steel', bezel: 0x8fca22, display: true, displayY: 0.3, cells: 15,
    photo: 'img/redtuff-inverter-48v-105ah.webp', note: 'For 48V inverters and solar hybrid systems (about 3–5 kVA). Built-in display.' },
  'lg-2688': { brand: 'Livgreen', code: 'LG 2.688KWH', kind: 'Inverter Battery', vehicle: 'inverter', v: 25.6, ah: 105, kwh: 2.688, warranty: 60,
    size: [0.44, 0.42, 0.26], face: [0.36, 0.34], case: 'steel', bezel: 0x8fca22, handles: 'top', cells: 8,
    photo: 'img/livgreen-inverter-25v-105ah.webp', alt: 'img/livgreen-inverter-white.webp', note: 'For 24V home and office inverters (about 1.5–2 kVA).' },
  'lg-5040': { brand: 'Livgreen', code: 'LG-5.040KWH', kind: 'Inverter Battery', vehicle: 'inverter', v: 48, ah: 105, kwh: 5.04, warranty: 60,
    size: [0.42, 0.74, 0.22], face: [0.34, 0.5], faceY: -0.06, case: 'white', display: true, displayY: 0.3, cells: 15,
    photo: 'img/livgreen-inverter-48v-105ah.webp', note: 'For 48V inverters and solar hybrid systems (about 3–5 kVA). LCD shows pack info and status.' }
};
