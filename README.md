# Revolt Lithium website (Livgreen + Redtuff)

Static site + one serverless function. Deploys to Vercel in about 5 minutes.

## Go live
1. Push this folder to GitHub → Vercel → New Project → import (framework preset: **Other**).
2. Add the environment variables below (Vercel → Settings → Environment Variables). Only the first three are required; every other integration switches on by itself when its keys are present.
3. Point `www.livgreenlithium.com` to Vercel. SSL, HTTP/2, Brotli and the global edge CDN (load balancing) come with Vercel.
4. Fill `js/config.js` → `tracking`, `verification`, `social`, `turnstileSiteKey`, `business.googleReviewUrl` and `salesPoints` (dealers), then run `npm run build`.
5. Add prices in `api/catalog.js`. Emailed quotations then show price + 18% GST; while a price is `null` the quotation says the price will be shared on call.
6. Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Integrations

### Server side (`api/quote.js`, env vars)
| Integration | Env vars | What it does |
| --- | --- | --- |
| **Resend email** (required) | `RESEND_API_KEY`, `QUOTE_FROM`, `QUOTE_TO` | Quotation email to the customer + lead email to the business. Dealer enquiries get their own acknowledgement and lead email. |
| Cloudflare Turnstile | `TURNSTILE_SECRET` (+ `turnstileSiteKey` in config.js) | Invisible bot check on both forms, verified on the server. |
| Google Sheets log | `SHEET_WEBHOOK_URL`, `SHEET_WEBHOOK_SECRET` | Every lead appended to a sheet (Quotes / Dealers tabs). Script: `scripts/google-sheets-webhook.gs`. |
| Zoho CRM | `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_DC` (`in` for India) | Creates a Lead with source, product, quantity and message; triggers your Zoho workflows. Self-client token scope: `ZohoCRM.modules.leads.CREATE`. |
| GA4 Measurement Protocol | `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` | Server-confirmed `generate_lead_server` event tied to the visitor's GA client ID (survives ad blockers). |
| Meta Conversions API | `META_PIXEL_ID`, `META_CAPI_TOKEN` | Server `Lead` event with hashed email/phone/city, fbp/fbc; deduplicated with the browser Pixel by quote number. |
| WhatsApp Cloud API | `WA_TOKEN`, `WA_PHONE_ID`, `WA_NOTIFY_TO` (e.g. `919756073477`), optional `WA_TEMPLATE`, `WA_TEMPLATE_LANG` | Instant WhatsApp alert to the owner for every lead. Use an approved template (1 body variable) to notify outside the 24-hour window. |

Side integrations run in parallel with a 6-second timeout each and never block or fail the customer's request. The API returns `integrations: { sheet, zoho, ga4, meta, whatsapp }` with `ok / skipped / error` for quick debugging.

### Browser side (`js/config.js`)
GTM, GA4, Google Ads (lead + call conversions, enhanced conversions), Meta Pixel, Microsoft Clarity, LinkedIn Insight, Bing UET. All load only after the visitor accepts the consent banner (Google Consent Mode v2). Attribution (UTM, gclid, fbclid, msclkid, landing, referrer) travels with every lead.

Events: `generate_lead` (quote / dealer), `click_call`, `click_whatsapp`, `click_email`, `click_directions`, `view_item`, `select_item`, `calculator_complete`, `lead_fallback`.

### Honest failure handling
The form shows success **only** when the API answers `ok: true`. Anything else shows a one-tap WhatsApp message with the same details, plus both phone numbers, so a lead is never lost and the visitor is never told something was sent when it wasn't.

## Design system (`css/site.css`)
Midnight `#0B1D36`, deep navy `#102B50`, ivory `#F8FAF7`, lime `#A8D829`, graphite `#252D38`, soft grey `#E9EEF2`. Type: Archivo (display, variable width) + Figtree (text), self-hosted. Light and dark sections alternate. Motion is limited to one hero carousel and section reveals, and switches off with `prefers-reduced-motion`.

## Homepage sections
Sticky header with Brands dropdown and Batteries mega menu → hero carousel → trust strip → interactive showcase (E-Rickshaw / E-2 Wheeler / Inverter & Solar, zoom, 3D, spec panel) → Livgreen & Redtuff brand stories → engineering (BMS diagram) → comparison table + 51.2V spec sheet → 4 calculators → quality & manufacturing (real factory photos) → dealer network (map, search, enquiry form) → quotation form → guides → FAQ → footer (privacy, terms).

## Development (TypeScript)
- `src/home.html` homepage template · `src/app.ts` homepage logic · `src/page.ts` sub-pages · `src/common.ts` header, consent, tracking, forms · `src/viewer.ts` Three.js 3D (lazy, in a dialog) · `src/imagefx.ts` WebGL image shader · `scripts/partials.ts` shared header/footer
- `npm install`, then `npm run build`: esbuild bundles to `js/` (code-split) and `scripts/build-pages.ts` generates every page, `privacy.html`, `terms.html`, `sitemap.xml`
- `npm run typecheck` runs `tsc`

## SEO pages generated
15 product pages, 3 category pages, 2 brand pages, 3 guides + index, privacy, terms. Unique titles, descriptions, canonicals, OG images, breadcrumbs and Product / ItemList / Brand / Article / FAQ / LocalBusiness schema. Google Business Profile: keep NAP identical to the footer (Railway Under Pass, Sandhawali Road, Muzaffarnagar 251003, 97560 73477).
