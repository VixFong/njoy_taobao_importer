function cleanImageUrl(url) {
  if (!url) return '';
  url = url.replace(/^\/\//, 'https://');
  if (!url.startsWith('http') || url.startsWith('data:')) return '';
  url = url.split('?')[0];
  // Strip Taobao CDN resize/format suffixes to restore original quality
  // e.g. file.jpg_q50.jpg_.webp → file.jpg
  // e.g. file.jpg_960x960.jpg_.webp → file.jpg
  // e.g. file.jpg_.webp → file.jpg
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

function extractTaobao() {
  // Title
  const title =
    document.querySelector('.tb-main-title')?.textContent?.trim() ||
    document.querySelector('[class*="mainTitle"]')?.textContent?.trim() ||
    document.querySelector('[class*="ItemTitle"]')?.textContent?.trim() ||
    document.querySelector('h1')?.textContent?.trim() ||
    document.title.replace(/[-|].*$/, '').trim();

  // Gallery: try main displayed image first, then thumbnails
  // Main pic element shows whichever thumbnail is selected — good source for first image
  const mainPicSrcs = collectImages([
    '#mainPicVideoPicEl',               // current main display image
    '.videoPic--MLs5g29k',
    '[class*="videoPic"]'
  ]);

  // All thumbnails (these ARE the product image list — strip _q50 via cleanImageUrl)
  const thumbSrcs = collectImages([
    '.thumbnailPic--QasTmWDm',
    '[class*="thumbnailPic"]',
    '.thumbnail--TxeB1sWz img',
    '[class*="thumbnail"] img',
    '.tb-thumb li img',
    '[class*="Gallery"] [class*="thumb"] img',
    '[class*="picList"] img'
  ]);

  // Merge: main pic first, then remaining thumbnails (deduplicated by cleanImageUrl)
  const seenGallery = new Set(mainPicSrcs);
  const images = [...mainPicSrcs];
  for (const u of thumbSrcs) {
    if (!seenGallery.has(u)) { seenGallery.add(u); images.push(u); }
  }

  // Specs / attributes
  const specs = [];
  const specSelectors = [
    // New 2025 Taobao layout (emphasisParams + generalParams)
    '[class*="emphasisParamsInfoItemTitle"]',
    '[class*="emphasisParamsInfoItemSubTitle"]',
    '[class*="generalParamsInfoItemTitle"]',
    '[class*="generalParamsInfoItemSubTitle"]',
    // Fallback older layouts
    '.attributes-list li',
    '[class*="Attribute"] [class*="item"]',
    '.J_AttrList li',
    '[class*="propGroup"] [class*="item"]'
  ];

  // Build key:value pairs from emphasis + general params
  const paramPairs = [];
  const emphasisItems = document.querySelectorAll('[class*="emphasisParamsInfoItem--"]');
  emphasisItems.forEach(item => {
    const title  = item.querySelector('[class*="emphasisParamsInfoItemTitle"]')?.textContent?.trim();
    const sub    = item.querySelector('[class*="emphasisParamsInfoItemSubTitle"]')?.textContent?.trim();
    if (title && sub) paramPairs.push(`${sub}: ${title}`);
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
    // Fallback: raw list items
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

  // Variants (colors, models)
  const variants = [];
  document.querySelectorAll(
    '[class*="SkuItem"], [class*="skuItem"], [class*="SkuProp"] [class*="item"], .J_SKU li, [class*="Sku"] [class*="Item"]'
  ).forEach(el => {
    const text = (el.getAttribute('title') || el.textContent).replace(/\s+/g, ' ').trim();
    if (text && text.length < 60 && !variants.includes(text)) variants.push(text);
  });

  // Description images — new Taobao descV8 layout
  const descImages = collectImages([
    '.descV8-singleImage img',
    '.descV8-singleImage-image',
    '[class*="descV8"] img',
    '#imageTextInfo-content img',
    '#imageTextInfo img',
    '#J_DivItemDesc img',
    '[class*="desc-root"] img'
  ]);

  // Description text (best effort — may be empty if in cross-origin iframe)
  const descEl =
    document.querySelector('#imageTextInfo-content') ||
    document.querySelector('#imageTextInfo') ||
    document.querySelector('#J_DivItemDesc') ||
    document.querySelector('[class*="desc-root"]');
  const desc = descEl?.innerText?.replace(/\s+/g, ' ')?.trim()?.substring(0, 800) || '';

  return {
    platform: 'taobao',
    title,
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

  return { platform: '1688', title, images, specs, variants, desc, descImages, url: location.href };
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
