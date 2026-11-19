/**
 * Revolt Lithium — Google Sheets lead log (Apps Script web app)
 *
 * Setup (5 minutes):
 * 1. Create a Google Sheet → Extensions → Apps Script → paste this file.
 * 2. Project Settings → Script properties → add SECRET = any long random string.
 * 3. Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone → Deploy.
 * 4. In Vercel env vars set SHEET_WEBHOOK_URL = the web-app URL and SHEET_WEBHOOK_SECRET = the same SECRET.
 * Quotation leads go to the "Quotes" tab and dealer enquiries to the "Dealers" tab (created automatically).
 */
const COLS = ['ts', 'quoteNo', 'kind', 'name', 'phone', 'email', 'city', 'business', 'dealerType', 'buyer', 'model', 'product', 'qty', 'message',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid', 'referrer', 'landing', 'page', 'status'];

function doPost(e) {
  const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: 'bad json' }); }
  const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (secret && d.secret !== secret) return out({ ok: false, error: 'forbidden' });

  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tab = d.kind === 'dealer' ? 'Dealers' : 'Quotes';
    const sh = ss.getSheetByName(tab) || ss.insertSheet(tab);
    if (sh.getLastRow() === 0) { sh.appendRow(COLS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold'); }
    d.status = d.status || 'New';
    // prefix phone with ' so Sheets keeps it as text
    sh.appendRow(COLS.map(c => c === 'phone' && d[c] ? "'" + d[c] : (d[c] == null ? '' : String(d[c]).slice(0, 1000))));
  } finally { lock.releaseLock(); }
  return out({ ok: true });
}

function doGet() { return ContentService.createTextOutput('Revolt lead webhook is live.'); }
