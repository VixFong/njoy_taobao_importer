function cleanImageUrl(url) {
    if (!url) return '';
    url = url.replace(/^\/\//, 'https://');
    if (!url.startsWith('http') || url.startsWith('data:')) return '';
    url = url.split('?')[0];
    url = url.replace(/\.(jpg|jpeg|png|webp)_.*$/i, '.$1');
    return url;
}

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

// ── Price extraction ──────────────────────────────────────────────────────────
const CNY_TO_VND = 4100;

function extractPrice() {
    // Taobao 2025: highlightPrice > span.text--*  (e.g. "78.6")
  // Try highlighted/promo price first, then normal price
  const selectors = [
        '[class*="highlightPrice"] [class*="text--"]',
        '[class*="priceWrap"] [class*="text--"]',
        '[class*="normalPrice"] [class*="text--"]',
        // Fallback older Taobao
        '.tb-rmb-num',
        '.J_StrPrice .tb-rmb-num',
        // 1688
        '[class*="price-common"] [class*="price-text"]',
        '[class*="price"] [class*="int"]',
      ];

  for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const text = el.textContent.replace(/[^\d.]/g, '').trim();
        const num = parseFloat(text);
        if (num > 0) return num;
  }

  // Last resort: grab any element whose text looks like a standalone price (¥NN.NN)
  const allEls = document.querySelectorAll(
        '[class*="price"], [class*="Price"]'
      );
    for (const el of allEls) {
          if (el.children.length > 2) continue; // skip containers
      const text = el.textContent.replace(/[^\d.]/g, '').trim();
          const num = parseFloat(text);
          if (num > 0 && num < 100000) return num;
    }
    return null;
}

function formatPrice(cny) {
    if (!cny) return null;
    const vnd = Math.round(cny * CNY_TO_VND);
    return {
          cny: cny,
          vnd: vnd,
          cnyStr: '\xA5' + cny.toFixed(1),
          vndStr: vnd.toLocaleString('vi-VN') + '\u20AB',
    };
}

function extractTaobao() {
    // Title
  const title =
        document.querySelector('.tb-main-title')?.textContent?.trim() ||
        document.querySelector('[class*="mainTitle"]')?.textContent?.trim() ||
        document.querySelector('[class*="ItemTitle"]')?.textContent?.trim() ||
        document.querySelector('h1')?.textContent?.trim() ||
        document.title.replace(/[-|].*$/, '').trim();

  // Price
  const priceCNY = extractPrice();
    const price = formatPrice(priceCNY);

  // Gallery
  const mainPicSrcs = collectImages([
        '#mainPicVideoPicEl',
        '.videoPic--MLs5g29k',
        '[class*="videoPic"]'
      ]);
    const thumbSrcs = collectImages([
          '.thumbnailPic--QasTmWDm',
          '[class*="thumbnailPic"]',
          '.thumbnail--TxeB1sWz img',
          '[class*="thumbnail"] img',
          '.tb-thumb li img',
          '[class*="Gallery"] [class*="thumb"] img',
          '[class*="picList"] img'
        ]);
    const seenGallery = new Set(mainPicSrcs);
    const images = [...mainPicSrcs];
    for (const u of thumbSrcs) {
          if (!seenGallery.has(u)) { seenGallery.add(u); images.push(u); }
    }

  // Specs / attributes
  const specs = [];
    const paramPairs = [];
    const emphasisItems = document.querySelectorAll('[class*="emphasisParamsInfoItem--"]');
    emphasisItems.forEach(item => {
          const title2 = item.querySelector('[class*="emphasisParamsInfoItemTitle"]')?.textContent?.trim();
          const sub = item.querySelector('[class*="emphasisParamsInfoItemSubTitle"]')?.textContent?.trim();
          if (title2 && sub) paramPairs.push(`${sub}: ${title2}`);
    });
    const generalItems = document.querySelectorAll('[class*="generalParamsInfoItem--"]');
    generalItems.forEach(item => {
          const key = item.querySelector('[class*="generalParamsInfoItemTitle"]')?.textContent?.trim();
          const val = item.querySelector('[class*="generalParamsInfoItemSubTitle"]')?.textContent?.trim();
          if (key && val) paramPairs.push(`${key}: ${val}`);
    });
    if (paramPairs.length > 0) {
          specs.push(...paramPairs);
    } else {
          const specSelectors = [
                  '.attributes-list li',
                  '[class*="Attribute"] [class*="item"]',
                  '.J_AttrList li',
                  '[class*="propGroup"] [class*="item"]'
                ];
          for (const sel of specSelectors) {
                  const els = document.querySelectorAll(sel);
                  if (els.length === 0) continue;
                  els.forEach(el => {
                            const text = el.textContent.replace(/\s+/g, ' ').trim();
                            if (text && text.length < 200) specs.push(text);
                  });
                  if (specs.length > 0) break;
          }
    }

  // Variants
  const variants = [];
    document.querySelectorAll(
          '[class*="SkuItem"], [class*="skuItem"], [class*="SkuProp"] [class*="item"], .J_SKU li, [class*="Sku"] [class*="Item"]'
        ).forEach(el => {
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
        '[class*="desc-root"] img'
      ]);

  // Description text
  const descEl =
        document.querySelector('#imageTextInfo-content') ||
        document.querySelector('#imageTextInfo') ||
        document.querySelector('#J_DivItemDesc') ||
        document.querySelector('[class*="desc-root"]');
    const desc = descEl?.innerText?.replace(/\s+/g, ' ')?.trim()?.substring(0, 800) || '';

  return {
        platform: 'taobao',
        title,
        price,
        images: images.slice(0, 9),
        specs,
        variants,
        desc,
        descImages: descImages.slice(0, 30),
        url: location.href
  };
}

function extract1688() {
    const title =
          document.querySelector('h1[class*="title"]')?.textContent?.trim() ||
          document.querySelector('.mod-detail-title h1')?.textContent?.trim() ||
          document.querySelector('[class*="title-text"]')?.textContent?.trim() ||
          document.querySelector('h1')?.textContent?.trim() ||
          document.title.replace(/[-|].*$/, '').trim();

  // Price on 1688
  const priceCNY = extractPrice();
    const price = formatPrice(priceCNY);

  const images = collectImages([
        '.detail-gallery img',
        '[class*="gallery"] img',
        '[class*="Gallery"] img',
        '[class*="mainPic"] img',
        '[class*="main-pic"] img'
      ]).slice(0, 9);

  const specs = [];
    document.querySelectorAll(
          '.offer-attr-list .attr-item, [class*="attr"] li, [class*="Attr"] [class*="item"]'
        ).forEach(el => {
          const text = el.textContent.replace(/\s+/g, ' ').trim();
          if (text && text.length < 200) specs.push(text);
    });

  const variants = [];
    document.querySelectorAll(
          '[class*="sku"] [class*="item"], [class*="Sku"] li, [class*="prop"] [class*="item"]'
        ).forEach(el => {
          const text = (el.getAttribute('title') || el.textContent).replace(/\s+/g, ' ').trim();
          if (text && text.length < 60 && !variants.includes(text)) variants.push(text);
    });

  const descEl =
        document.querySelector('.mod-detail-desc') ||
        document.querySelector('[class*="detail-desc"]') ||
        document.querySelector('[class*="description"]');
    const desc = descEl?.innerText?.trim()?.substring(0, 800) || '';
    const descImages = collectImages([
          '.mod-detail-desc img', '[class*="desc"] img'
        ]).slice(0, 30);

  return { platform: '1688', title, price, images, specs, variants, desc, descImages, url: location.href };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'extract') {
          try {
                  const is1688 = location.hostname.includes('1688.com');
                  const data = is1688 ? extract1688() : extractTaobao();
                  sendResponse({ ok: true, data });
          } catch (e) {
                  sendResponse({ ok: false, error: e.message });
          }
    }
    return true;
});
