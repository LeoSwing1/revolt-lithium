/* Entry for the SEO sub-pages (product, category, brand, guide): tracking, consent, WhatsApp, image shader. */
import { initCommon, track } from './common';
import { initImageFX } from './imagefx';
initCommon();
initImageFX('.fx');
const id = document.body.dataset.product;
if (id) track('view_item', { item_id: id, source: 'product_page' });
