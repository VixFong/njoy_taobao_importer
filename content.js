// ── Shared URL cleaner ────────────────────────────────────────────────────────
function cleanImageUrl(url) {
      if (!url) return '';
      url = url.replace(/^\/\//, 'https://');
      if (!url.startsWith('http') || url.startsWith('data:')) return '';
      url = url.split('?')[0];
      // Strip CDN resize/format suffixes (Taobao & 1688 alike)
      // e.g. file.jpg_.webp  /  file.jpg_q50.jpg_.webp  /  file.jpg_960x960.jpg
      url = url.replace(/\.(jpg|jpeg|png|webp)_.*$/i, '.$1');
      return url;
}

// ── Image collector (normal DOM) ──────────────────────────────────────────────
function collectImages(selectors) {
      const seen = new Set();
      const urls = [];
      for (const sel of selectors) {
              document.querySelectorAll(sel).forEach(img => {
                        const raw =
                                    img.getAttribute('data-src') ||
                                    img.getAttribute('data-lazy-src') ||
                                    img.getAttribute('data-original') ||
                                    img.getAttribute('data-image') ||
                                    img.src || '';
                        const clean = cleanImageUrl(raw);
                        if (clean && !seen.has(clean) && /\.(jpg|jpeg|png|webp)$/i.test(clean)) {
                                    seen.add(clean);
                                    urls.push(clean);
                        }
              });
      }
      return urls;
}

// ── Image collector from Shadow DOM ──────────────────────────────────────────
function collectShadowImages(hostSelector) {
      const seen = new Set();
      const urls = [];
      document.querySelectorAll(hostSelector).forEach(host => {
              const root = host.shadowRoot;
              if (!root) return;
              root.querySelectorAll('img').forEach(img => {
                        const raw = img.getAttribute('data-src') || img.src || '';
                        const clean = cleanImageUrl(raw);
                        if (clean && !seen.has(clean) && /\.(jpg|jpeg|png|webp)$/i.test(clean)) {
                                    seen.add(clean);
                                    urls.push(clean);
                        }
              });
      });
      return urls;
}

// ── Price extraction ──────────────────────────────────────────────────────────
const CNY_TO_VND = 4100;

function extractPrice() {
      const is1688 = location.hostname.includes('1688.com');
    
      if (is1688) {
              // 1688 price: .price-comp contains .currency spans (e.g. "11" + ".00")
              const priceComp = document.querySelector('.price-comp');
              if (priceComp) {
                        const parts = [...priceComp.querySelectorAll('.currency')].map(s => s.textContent.trim());
                        const num = parseFloat(parts.join(''));
                        if (num > 0) return num;
              }
              // Fallback: first .price-info text
              const piText = document.querySelector('.price-info')?.textContent?.replace(/[^\d.]/g, '');
              if (piText) { const n = parseFloat(piText); if (n > 0) return n; }
      }
    
      // Taobao 2025: highlightPrice > span.text--*  (e.g. "78.6")
      const taobaoSels = [
              '[class*="highlightPrice"] [class*="text--"]',
              '[class*="priceWrap"] [class*="text--"]',
              '[class*="normalPrice"] [class*="text--"]',
              '.tb-rmb-num',
              '.J_StrPrice .tb-rmb-num',
            ];
      for (const sel of taobaoSels) {
              const el = document.querySelector(sel);
              if (!el) continue;
              const num = parseFloat(el.textContent.replace(/[^\d.]/g, ''));
              if (num > 0) return num;
      }
    
      // Universal last resort
      for (const el of document.querySelectorAll('[class*="price"], [class*="Price"]')) {
              if (el.children.length > 3) continue;
              const num = parseFloat(el.textContent.replace(/[^\d.]/g, ''));
              if (num > 0 && num < 100000) return num;
      }
      return null;
}

function formatPrice(cny) {
      if (!cny) return null;
      const vnd = Math.round(cny * CNY_TO_VND);
      return {
              cny,
              vnd,
              cnyStr: '\xA5' + cny.toFixed(2),
              vndStr: vnd.toLocaleString('vi-VN') + '\u20AB',
      };
}

// ── Taobao extractor ──────────────────────────────────────────────────────────
function extractTaobao() {
      const title =
              document.querySelector('.tb-main-title')?.textContent?.trim() ||
              document.querySelector('[class*="mainTitle"]')?.textContent?.trim() ||
              document.querySelector('[class*="ItemTitle"]')?.textContent?.trim() ||
              document.querySelector('h1')?.textContent?.trim() ||
              document.title.replace(/[-|].*$/, '').trim();
    
      const price = formatPrice(extractPrice());
    
      // Gallery: main display image + thumbnails
      const mainPicSrcs = collectImages([
              '#mainPicVideoPicEl',
              '.videoPic--MLs5g29k',
              '[class*="videoPic"]',
            ]);
      const thumbSrcs = collectImages([
              '.thumbnailPic--QasTmWDm',
              '[class*="thumbnailPic"]',
              '.thumbnail--TxeB1sWz img',
              '[class*="thumbnail"] img',
              '.tb-thumb li img',
              '[class*="Gallery"] [class*="thumb"] img',
              '[class*="picList"] img',
            ]);
      const seenGal = new Set(mainPicSrcs);
      const images = [...mainPicSrcs];
      for (const u of thumbSrcs) {
              if (!seenGal.has(u)) { seenGal.add(u); images.push(u); }
      }
    
      // Specs
      const specs = [];
      const paramPairs = [];
      document.querySelectorAll('[class*="emphasisParamsInfoItem--"]').forEach(item => {
              const t = item.querySelector('[class*="emphasisParamsInfoItemTitle"]')?.textContent?.trim();
              const s = item.querySelector('[class*="emphasisParamsInfoItemSubTitle"]')?.textContent?.trim();
              if (t && s) paramPairs.push(`${s}: ${t}`);
      });
      document.querySelectorAll('[class*="generalParamsInfoItem--"]').forEach(item => {
              const k = item.querySelector('[class*="generalParamsInfoItemTitle"]')?.textContent?.trim();
              const v = item.querySelector('[class*="generalParamsInfoItemSubTitle"]')?.textContent?.trim();
              if (k && v) paramPairs.push(`${k}: ${v}`);
      });
      if (paramPairs.length > 0) {
              specs.push(...paramPairs);
      } else {
              for (const sel of ['.attributes-list li', '[class*="Attribute"] [class*="item"]', '.J_AttrList li', '[class*="propGroup"] [class*="item"]']) {
                        const els = document.querySelectorAll(sel);
                        if (!els.length) continue;
                        els.forEach(el => { const t = el.textContent.replace(/\s+/g, ' ').trim(); if (t && t.length < 200) specs.push(t); });
                        if (specs.length) break;
              }
      }
    
      // Variants
      const variants = [];
      document.querySelectorAll('[class*="SkuItem"], [class*="skuItem"], [class*="SkuProp"] [class*="item"], .J_SKU li, [class*="Sku"] [class*="Item"]').forEach(el => {
              const text = (el.getAttribute('title') || el.textContent).replace(/\s+/g, ' ').trim();
              if (text && text.length < 60 && !variants.includes(text)) variants.push(text);
      });
    
      // Description images
      const descImages = collectImages([
              '.descV8-singleImage img',
              '.descV8-singleImage-image',
              '[class*="descV8"] img',
              '#imageTextInfo-content img',
              '#imageTextInfo img',
              '#J_DivItemDesc img',
              '[class*="desc-root"] img',
            ]);
    
      // Description text
      const descEl =
              document.querySelector('#imageTextInfo-content') ||
              document.querySelector('#imageTextInfo') ||
              document.querySelector('#J_DivItemDesc') ||
              document.querySelector('[class*="desc-root"]');
      const desc = descEl?.innerText?.replace(/\s+/g, ' ')?.trim()?.substring(0, 800) || '';
    
      return { platform: 'taobao', title, price, images: images.slice(0, 9), specs, variants, desc, descImages: descImages.slice(0, 30), url: location.href };
}

// ── 1688 extractor ────────────────────────────────────────────────────────────
function extract1688() {
      // Title: find the longest h1 (product title)
      const allH1 = [...document.querySelectorAll('h1')];
      const titleEl = allH1.reduce((best, el) =>
              el.textContent.trim().length > (best?.textContent?.trim().length || 0) ? el : best, null);
      const title =
              titleEl?.textContent?.trim() ||
              document.querySelector('.module-od-title h1')?.textContent?.trim() ||
              document.querySelector('.title-content h1')?.textContent?.trim() ||
              document.title.replace(/[-|].*$/, '').trim();
    
      // Price: first .price-comp (min / 1-unit price)
      const price = formatPrice(extractPrice());
    
      // Gallery: .od-gallery-preview -> ant-image-img.preview-img
      const seen = new Set();
      const images = [];
      [
              ...document.querySelectorAll('.od-gallery-preview .ant-image-img.preview-img'),
              ...document.querySelectorAll('[class*="od-gallery"] .ant-image-img'),
              ...document.querySelectorAll('[class*="gallery-preview"] img'),
              // fallback older 1688 layout
              ...document.querySelectorAll('.detail-gallery img, [class*="mainPic"] img'),
            ].forEach(img => {
                    const url = cleanImageUrl(img.src || img.getAttribute('data-src') || '');
                    if (url && !seen.has(url) && /\.(jpg|jpeg|png|webp)$/i.test(url)) {
                              seen.add(url); images.push(url);
                    }
            });
    
      // Specs: ant-table-row with 2+ td cells
      const specs = [];
      const seenSpec = new Set();
      document.querySelectorAll('.ant-table-row').forEach(row => {
              const cells = [...row.querySelectorAll('td')];
              if (cells.length >= 2) {
                        const key = cells[0].textContent.trim();
                        const val = cells[1].textContent.trim();
                        if (key && val) {
                                    const pair = `${key}: ${val}`;
                                    if (!seenSpec.has(key) && pair.length < 300) { seenSpec.add(key); specs.push(pair); }
                        }
              }
      });
      // Fallback: older 1688 attribute list
      if (specs.length === 0) {
              document.querySelectorAll('.offer-attr-list .attr-item, [class*="attr"] li').forEach(el => {
                        const text = el.textContent.replace(/\s+/g, ' ').trim();
                        if (text && text.length < 200) specs.push(text);
              });
      }
    
      // Variants: .item-label inside od-sku (leaf nodes with variant names)
      const variants = [];
      const seenVar = new Set();
      document.querySelectorAll('.item-label, [class*="od-sku"] [class*="item-label"]').forEach(el => {
              const text = el.textContent.trim();
              if (text && text.length < 60 && !seenVar.has(text)) { seenVar.add(text); variants.push(text); }
      });
      // Fallback: expand-view-item labels
      if (variants.length === 0) {
              document.querySelectorAll('[class*="expand-view-item"] [class*="label"]').forEach(el => {
                        const text = el.textContent.trim();
                        if (text && text.length < 60 && !seenVar.has(text)) { seenVar.add(text); variants.push(text); }
              });
      }
    
      // Description images: 1688 renders these inside Shadow DOM of <v-detail-3>
      const descImages = [];
      const seenDesc = new Set();
    
      // Primary: v-detail-3 custom element shadow root
      const vDetail = document.querySelector('v-detail-3');
      if (vDetail?.shadowRoot) {
              vDetail.shadowRoot.querySelectorAll('img').forEach(img => {
                        const url = cleanImageUrl(img.getAttribute('data-src') || img.src || '');
                        if (url && !seenDesc.has(url) && /\.(jpg|jpeg|png|webp)$/i.test(url)) {
                                    seenDesc.add(url); descImages.push(url);
                        }
              });
      }
    
      // Secondary: any shadow host with class "html-description"
      if (descImages.length === 0) {
              document.querySelectorAll('*').forEach(host => {
                        if (!host.shadowRoot) return;
                        const cls = (host.className || '').toString();
                        if (!cls.includes('html-description') && host.tagName.toLowerCase().indexOf('detail') === -1) return;
                        host.shadowRoot.querySelectorAll('img').forEach(img => {
                                    const url = cleanImageUrl(img.getAttribute('data-src') || img.src || '');
                                    if (url && !seenDesc.has(url) && /\.(jpg|jpeg|png|webp)$/i.test(url)) {
                                                  seenDesc.add(url); descImages.push(url);
                                    }
                        });
              });
      }
    
      // Fallback: normal DOM desc images
      if (descImages.length === 0) {
              collectImages([
                        '.module-od-product-description img',
                        '.mod-detail-desc img',
                        '[class*="detail-desc"] img',
                        '[class*="description"] img',
                      ]).forEach(url => { if (!seenDesc.has(url)) { seenDesc.add(url); descImages.push(url); } });
      }
    
      // Description text: shadow root text or visible module text
      let desc = '';
      if (vDetail?.shadowRoot) {
              const rawText = vDetail.shadowRoot.textContent || '';
              // Remove CSS block at start (shadow DOM inlines styles)
              desc = rawText.replace(/^[\s\S]*?}\s*/m, '').replace(/\s+/g, ' ').trim().substring(0, 800);
      }
      if (!desc) {
              const descEl = document.querySelector('.module-od-product-description') || document.querySelector('.mod-detail-desc');
              desc = descEl?.innerText?.replace(/\s+/g, ' ')?.trim()?.substring(0, 800) || '';
      }
    
      return {
              platform: '1688',
              title,
              price,
              images: images.slice(0, 9),
              specs,
              variants,
              desc,
              descImages: descImages.slice(0, 30),
              url: location.href,
      };
}

// ── Message listener ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === 'extract') {
              try {
                        const is1688 = location.hostname.includes('1688.com');
                        const data = is1688 ? extract1688() : extractTaobao();
                        sendResponse({ ok: true, data });
              } catch (e) {
                        sendResponse({ ok: false, error: e.message });
              
