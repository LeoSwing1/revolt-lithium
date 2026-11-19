with open('scripts/partials.ts', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# The new header template with data-i18n attributes
new_header = '''return `<header class="hdr" id="hdr">
  <div class="container">
    <a class="logo" href="${c.home ? '#top' : r}" aria-label="REVOLT Lithium Energy Solutions, home"><span class="logo-text">REVOLT</span></a>
    <nav aria-label="Main"><ul class="nav">
      <li><button class="nav-a" type="button" aria-expanded="false" aria-controls="dd-brands" data-i18n="brands">Our Brands ${ic.chev}</button>
        <div class="dd" id="dd-brands">
          <a href="${r}livgreen/"><img src="${r}img/brand/livgreen-logo-dark.webp" alt="" width="706" height="465"><span><b>Livgreen</b><small>Advanced lithium battery technology</small></span></a>
          <a href="${r}redtuff/"><img src="${r}img/brand/redtuff-logo-dark.webp" alt="" width="785" height="352"><span><b>Redtuff</b><small>Always on. Always win.</small></span></a>
          <a href="${a(c, '#brands')}"><img src="${r}img/brand/revolt-logo-dark.webp" alt="" width="888" height="304"><span><b>Revolt RLES</b><small>Our own series with Bluetooth BMS</small></span></a>
        </div></li>
      <li><button class="nav-a" type="button" aria-expanded="false" aria-controls="dd-batteries" data-i18n="batteries">Batteries ${ic.chev}</button>
        <div class="dd mega" id="dd-batteries">${mega}<div class="feature"><div><b>Not sure which battery?</b><p style="margin-top:.5rem;font-size:.9rem">Compare range, backup and 3-year cost before you buy.</p></div><a class="btn btn--lime btn--sm" href="${a(c, '#calculators')}">Open calculators</a></div></div></li>
      <li><a class="nav-a" href="${a(c, '#inverter')}" data-i18n="inverter">Inverter & Solar</a></li>
      <li><a class="nav-a" href="${a(c, '#specs')}" data-i18n="specs">Specifications</a></li>
      <li><a class="nav-a" href="${a(c, '#quality')}" data-i18n="quality">Quality</a></li>
      <li><a class="nav-a" href="${a(c, '#calculators')}" data-i18n="calc">Calculators</a></li>
      <li><a class="nav-a" href="${a(c, '#dealers')}" data-i18n="dealers">Dealers</a></li>
      <li><button class="nav-a" type="button" aria-expanded="false" aria-controls="dd-lang">${ic.lang} <span id="current-lang" data-i18n="lang_label">Language</span> ${ic.chev}</button>
        <div class="dd" id="dd-lang" style="min-width:140px;">${langBtns}</div></li>
    </ul></nav>
    <div class="hdr-cta">
      <a class="hdr-phone" href="tel:+919756073477" data-track="call"><span data-i18n="call">Call us</span><b>97560 73477</b></a>
      <a class="btn btn--lime" href="${a(c, '#quote')}" data-track="cta_quote" data-i18n="quote">Get a Quotation</a>
      <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="drawer"><span></span></button>
    </div>
  </div>
</header>
<div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Menu">
  <div class="drawer-top"><span class="logo-text">REVOLT</span><button class="drawer-x" type="button" aria-label="Close menu">×</button></div>
  <nav aria-label="Mobile">
    <details><summary data-i18n="batteries">Batteries</summary><div class="sub">${g.map(x => `<a href="${r}${x.path}">${x.name}<span>${x.ids.length} models</span></a>`).join('')}<a href="${a(c, '#batteries')}">Product showcase<span>3D view</span></a></div></details>
    <details><summary data-i18n="brands">Our Brands</summary><div class="sub"><a href="${r}livgreen/">Livgreen<span>Advanced technology</span></a><a href="${r}redtuff/">Redtuff<span>Always on</span></a><a href="${a(c, '#brands')}">Revolt RLES<span>Bluetooth BMS</span></a></div></details>
    <a class="d-link" href="${a(c, '#inverter')}" data-i18n="inverter">Inverter & Solar</a>
    <a class="d-link" href="${a(c, '#specs')}" data-i18n="specs">Specifications</a>
    <a class="d-link" href="${a(c, '#quality')}" data-i18n="quality">Quality</a>
    <a class="d-link" href="${a(c, '#calculators')}" data-i18n="calc">Calculators</a>
    <a class="d-link" href="${a(c, '#dealers')}" data-i18n="dealers">Dealers</a>
    <a class="d-link" href="${r}guides/">Buying guides</a>
    <a class="d-link" href="${a(c, '#quote')}" data-i18n="quote">Get a Quotation</a>
  </nav>
  <div class="drawer-foot">
    <a class="btn btn--lime btn--block" href="${a(c, '#quote')}" data-track="cta_quote" data-i18n="quote">Get a Quotation</a>
    <div class="phones"><a href="tel:+919756073477" data-track="call"><small data-i18n="call">Sales</small>97560 73477</a><a href="tel:+919990138500" data-track="call"><small>Dealers</small>99901 38500</a></div>
  </div>
</div>`;'''

# Find positions
start = content.find('return `<header')
end = content.find('</div>`;', start)
if end != -1:
    end += len('</div>`;')
    content = content[:start] + new_header + content[end:]
    with open('scripts/partials.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')