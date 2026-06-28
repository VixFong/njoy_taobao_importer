const extractBtn    = document.getElementById('extractBtn');
const copyBtn       = document.getElementById('copyBtn');
const copyDescBtn   = document.getElementById('copyDescBtn');
const copyShopeeBtn = document.getElementById('copyShopeeBtn');
const output        = document.getElementById('output');
const statusEl      = document.getElementById('status');
const dlSection     = document.getElementById('dlSection');
const dlMainBtn     = document.getElementById('dlMainBtn');
const dlDescBtn     = document.getElementById('dlDescBtn');
const dlAllBtn      = document.getElementById('dlAllBtn');
const dlProgress    = document.getElementById('dlProgress');
const imgStrip      = document.getElementById('imgStrip');
const priceBox      = document.getElementById('priceBox');

let currentData = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function setStatus(msg, type = '') { statusEl.textContent = msg; statusEl.className = type; }
function setDlProgress(msg, type = '') { dlProgress.textContent = msg; dlProgress.className = type; }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Price display ──────────────────────────────────────────────────────────────
function showPrice(price) {
  if (!price || !priceBox) return;
  priceBox.style.display = 'flex';
  document.getElementById('priceCNY').textContent = price.cnyStr;
  document.getElementById('priceVND').textContent = price.vndStr;
}
function hidePrice() { if (priceBox) priceBox.style.display = 'none'; }

// ── Enable/disable copy buttons ────────────────────────────────────────────────
function setCopyButtons(disabled) {
  copyBtn.disabled       = disabled;
  copyDescBtn.disabled   = disabled;
  copyShopeeBtn.disabled = disabled;
}

// ── Trích xuất thông số theo key từ specs[] ────────────────────────────────────
// specs[] dạng ["Chất liệu: ABS", "Trọng lượng: 200g", ...]
function specVal(specs, ...keys) {
  for (const s of specs) {
    const lower = s.toLowerCase();
    for (const k of keys) {
      if (lower.includes(k.toLowerCase())) {
        const parts = s.split(/[:：]/);
        if (parts.length >= 2) return parts.slice(1).join(':').trim();
        return s.trim();
      }
    }
  }
  return '';
}

// ── Sinh tên sản phẩm chuẩn Shopee từ data ────────────────────────────────────
function buildShopeeName(d) {
  // Lấy title gốc, loại bỏ tiếng Trung
  const raw = (d.title || '').replace(/[一-鿿㐀-䶿]+/g, '').replace(/s+/g, ' ').trim();
  if (raw.length >= 10) return raw.substring(0, 120);
  // Fallback: ghép từ specs
  const mat   = specVal(d.specs, 'chất liệu', 'material', '材质', '材料');
  const model = specVal(d.specs, 'model', '型号', 'sku');
  return [mat, model, raw].filter(Boolean).join(' ').substring(0, 120) || d.title || '';
}

// ── Sinh hashtag từ title và specs ────────────────────────────────────────────
function buildHashtags(d) {
  const tags = new Set();
  const title = (d.title || '').toLowerCase();

  // Detect category từ title/specs
  if (/sạc|charger|充电/.test(title)) tags.add('#sacnhanh');
  if (/không dây|wireless|无线/.test(title)) tags.add('#sackhongday');
  if (/iphone|ios/.test(title)) tags.add('#phuKienIphone');
  if (/android|samsung|xiaomi|oppo|vivo/.test(title)) tags.add('#phuKienAndroid');
  if (/ốp|case|op lung/.test(title)) tags.add('#oplung');
  if (/kính|kinh|tempered|glass/.test(title)) tags.add('#kinhcuongluc');
  if (/dây|cáp|cable|day cap/.test(title)) tags.add('#daycap');
  if (/tai nghe|headphone|earphone|earbuds/.test(title)) tags.add('#tainghe');
  if (/bàn phím|keyboard/.test(title)) tags.add('#banphim');
  if (/chuột|mouse/.test(title)) tags.add('#chuotkhongday');
  if (/túi|balo|bag|pouch/.test(title)) tags.add('#tuidung');
  if (/đèn|led|lamp|light/.test(title)) tags.add('#denled');

  // Generic fallback
  if (tags.size === 0) tags.add('#phuKienDienTu');
  tags.add('#njoyshop');
  return [...tags].slice(0, 5).join(' ');
}

// ── Auto-generate mô tả chuẩn Shopee từ data thực tế ──────────────────────────
function buildShopeeDesc(d) {
  const L   = [];
  const sp  = d.specs  || [];
  const vr  = d.variants || [];
  const is1688 = d.platform === '1688';

  // ── PHẦN 1: THÔNG SỐ KỸ THUẬT ────────────────────────────────────────────
  L.push('--- THÔNG SỐ KỸ THUẬT ---');

  // Tên sản phẩm
  const cleanTitle = (d.title || '').replace(/[一-鿿㐀-䶿]+/g, '').replace(/s+/g, ' ').trim();
  L.push('• Tên sản phẩm: ' + (cleanTitle || d.title || 'Xem ảnh'));

  // Dump toàn bộ specs đã có (loại tiếng Trung nếu có thể)
  if (sp.length > 0) {
    sp.forEach(s => {
      // Bỏ qua dòng toàn tiếng Trung
      const latinPart = s.replace(/[一-鿿㐀-䶿]/g, '').trim();
      if (latinPart.length > 3) {
        L.push('• ' + s.replace(/[一-鿿㐀-䶿]+/g, '').replace(/s+/g, ' ').trim());
      } else {
        L.push('• ' + s); // Giữ nguyên cả tiếng Trung nếu cần
      }
    });
  }

  // Phiên bản / màu sắc
  if (vr.length > 0) {
    L.push('• Phiên bản / màu sắc: ' + vr.slice(0, 8).join(', '));
  }

  // Giá tham khảo
  if (d.price) {
    L.push('• Giá gốc: ' + d.price.cnyStr + ' ≈ ' + d.price.vndStr);
  }

  L.push('');

  // ── PHẦN 2: CÔNG DỤNG VÀ LỢI ÍCH ────────────────────────────────────────
  L.push('--- CÔNG DỤNG VÀ LỢI ÍCH ---');

  // Trích từ desc gốc nếu có (lấy các câu có nghĩa, bỏ tiếng Trung)
  if (d.desc) {
    // Tách câu / dòng từ desc
    const sentences = d.desc
      .replace(/[一-鿿㐀-䶿]+[^
]*/g, '') // bỏ đoạn toàn Hán
      .split(/[.。!！
|]+/)
      .map(s => s.replace(/s+/g, ' ').trim())
      .filter(s => s.length > 10 && s.length < 200 && !/^[\d\.\-]+$/.test(s));

    const used = new Set();
    let count = 0;
    for (const s of sentences) {
      if (count >= 5) break;
      if (!used.has(s)) {
        used.add(s);
        L.push('• ' + s);
        count++;
      }
    }
    // Nếu không lấy được gì từ desc, để placeholder nhỏ
    if (count === 0) L.push('• Sản phẩm chất lượng cao, thiết kế tinh tế, sử dụng bền bỉ');
  } else {
    // Sinh lợi ích generic từ specs nếu không có desc
    const mat = specVal(sp, 'chất liệu', 'material', '材质');
    if (mat) L.push('• Chất liệu ' + mat + ', bền bỉ và an toàn khi sử dụng');
    const size = specVal(sp, 'kích thước', 'size', '尺寸', 'dimension');
    if (size) L.push('• Kích thước gọn nhẹ ' + size + ', dễ dàng mang theo');
    const weight = specVal(sp, 'trọng lượng', 'weight', '重量');
    if (weight) L.push('• Trọng lượng ' + weight + ', không gây cảm giác nặng nề');
    L.push('• Thiết kế hiện đại, phù hợp với nhiều phong cách sử dụng');
    L.push('• Dễ sử dụng, không cần hướng dẫn phức tạp');
  }

  L.push('');

  // ── PHẦN 3: BẢO HÀNH & CAM KẾT ──────────────────────────────────────────
  L.push('--- BẢO HÀNH & CAM KẾT ---');
  // Tìm thông tin bảo hành trong specs
  const bh = specVal(sp, 'bảo hành', 'warranty', '保修', '质保');
  if (bh) {
    L.push('• Bảo hành: ' + bh);
  } else {
    L.push('• Bảo hành: 3 tháng lỗi do nhà sản xuất');
  }
  L.push('• Đổi trả: Trong 7 ngày nếu lỗi do nhà sản xuất');
  L.push('• Sản phẩm được kiểm tra kỹ trước khi giao');

  return L.join('\n');
}

// ── Output formatter (full — for copyBtn) ─────────────────────────────────────
function formatOutput(d) {
  const L = [];
  const is1688 = d.platform === '1688';

  L.push('=== NJOY PRODUCT IMPORT ===');
  L.push('Platform : ' + d.platform.toUpperCase());
  L.push('URL : ' + d.url);
  L.push('');

  if (d.price) {
    L.push('[ GIA ] ' + d.price.cnyStr + ' => ' + d.price.vndStr + ' (ty gia x4.100)');
    L.push('');
  }

  L.push('[ TIEU DE GOC - ' + d.platform.toUpperCase() + ' ]');
  L.push(d.title || '(khong lay duoc)');
  L.push('');

  if (d.specs.length > 0) {
    L.push('[ THONG SO KY THUAT' + (is1688 ? ' - 1688 / DO CHINH XAC CAO' : ' - TAOBAO') + ' ]');
    d.specs.forEach(s => L.push('  ' + s));
    L.push('');
  }

  if (d.variants.length > 0) {
    L.push('[ VARIANTS ]');
    d.variants.forEach(v => L.push('  ' + v));
    L.push('');
  }

  if (d.images.length > 0) {
    L.push('[ ANH CHINH - ' + d.images.length + ' anh ]');
    d.images.forEach((u, i) => L.push(String(i+1).padStart(2,'0') + '. ' + u));
    L.push('');
  }
  if (d.descImages.length > 0) {
    L.push('[ ANH MO TA - ' + d.descImages.length + ' anh ]');
    d.descImages.forEach((u, i) => L.push(String(i+1).padStart(2,'0') + '. ' + u));
    L.push('');
  }

  if (d.desc) {
    L.push('[ MO TA GOC ]');
    L.push(d.desc);
    L.push('');
  }

  L.push('');
  L.push('════════════════════════════════════════════════════════');
  L.push('MO TA CHUAN SHOPEE (DA DUOC TU DONG TAO TU DU LIEU TREN)');
  L.push('════════════════════════════════════════════════════════');
  L.push('');
  L.push(formatShopeeSection(d));

  return L.join('\n');
}

// ── Mô tả gốc (chỉ text từ Taobao/1688) ─────────────────────────────────────
function formatDescOnly(d) {
  const L = [];

  L.push('=== MO TA GOC - ' + d.platform.toUpperCase() + ' ===');
  L.push('URL: ' + d.url);
  L.push('Ten: ' + (d.title || '(khong lay duoc)'));
  L.push('');

  if (d.specs.length > 0) {
    L.push('[ THONG SO KY THUAT ]');
    d.specs.forEach(s => L.push('  ' + s));
    L.push('');
  }

  if (d.variants.length > 0) {
    L.push('[ PHIEN BAN / VARIANT ]');
    d.variants.forEach(v => L.push('  ' + v));
    L.push('');
  }

  if (d.desc) {
    L.push('[ MO TA ]');
    L.push(d.desc);
    L.push('');
  }

  if (d.descImages.length > 0) {
    L.push('[ ANH MO TA (' + d.descImages.length + ' anh) ]');
    d.descImages.forEach((u, i) => L.push(String(i+1).padStart(2,'0') + '. ' + u));
    L.push('');
  }

  return L.join('\n');
}

// ── Mô tả chuẩn Shopee đã được điền sẵn nội dung ────────────────────────────
function formatShopeeSection(d) {
  const L = [];

  // TÊN SẢN PHẨM
  L.push('━━━ TÊN SẢN PHẨM (đề xuất - tối đa 120 ký tự) ━━━');
  L.push(buildShopeeName(d));
  L.push('');

  // MÔ TẢ
  L.push('━━━ MÔ TẢ SẢN PHẨM ━━━');
  L.push('');
  L.push(buildShopeeDesc(d));
  L.push('');

  // HASHTAG
  L.push('━━━ HASHTAG ━━━');
  L.push(buildHashtags(d));
  L.push('');

  L.push('────────────────────────────────────────────────────────');
  L.push('Luu y: Kiem tra lai thong so truoc khi dang ban.');
  L.push('Thong so tu ' + (d.platform === '1688' ? '1688 (chinh xac cao)' : 'Taobao (can kiem tra lai)') + '.');
  L.push('────────────────────────────────────────────────────────');

  return L.join('\n');
}

// ── Copy chuẩn Shopee (alias cho button) ──────────────────────────────────────
function formatShopeePrompt(d) {
  return formatShopeeSection(d);
}

// ── Image preview strip ────────────────────────────────────────────────────────
function showImageStrip(images) {
  imgStrip.innerHTML = '';
  if (!images.length) { imgStrip.style.display = 'none'; return; }
  imgStrip.style.display = 'flex';
  images.slice(0, 9).forEach(url => {
    const img = document.createElement('img');
    img.src = url; img.title = url;
    imgStrip.appendChild(img);
  });
}

// ── Download ───────────────────────────────────────────────────────────────────
function getExt(url) { return (url.match(/\.(jpg|jpeg|png|webp)$/i) || ['','jpg'])[1].toLowerCase(); }

async function downloadBatch(images, prefix, progressCb) {
  let ok = 0;
  for (let i = 0; i < images.length; i++) {
    const url = images[i], ext = getExt(url), num = String(i+1).padStart(2,'0');
    progressCb(i+1, images.length);
    try {
      await new Promise((res, rej) => chrome.downloads.download(
        { url, filename: 'njoy-import/' + prefix + '_' + num + '.' + ext, conflictAction: 'overwrite' },
        id => chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res(id)
      ));
      ok++;
    } catch(e) { console.warn('DL failed:', url, e.message); }
    await delay(350);
  }
  return ok;
}

function setDL(disabled) { [dlMainBtn,dlDescBtn,dlAllBtn].forEach(b => b.disabled = disabled); }

dlMainBtn.addEventListener('click', async () => {
  if (!currentData?.images?.length) return;
  setDL(true); setDlProgress('Dang tai anh chinh...');
  const ok = await downloadBatch(currentData.images, 'main', (i,n) => setDlProgress('Anh chinh ' + i + '/' + n + '...'));
  setDlProgress('Da tai ' + ok + ' anh chinh -> Downloads/njoy-import/', 'ok');
  setDL(false);
});

dlDescBtn.addEventListener('click', async () => {
  if (!currentData?.descImages?.length) return;
  setDL(true); setDlProgress('Dang tai anh mo ta...');
  const ok = await downloadBatch(currentData.descImages, 'desc', (i,n) => setDlProgress('Anh mo ta ' + i + '/' + n + '...'));
  setDlProgress('Da tai ' + ok + ' anh mo ta -> Downloads/njoy-import/', 'ok');
  setDL(false);
});

dlAllBtn.addEventListener('click', async () => {
  if (!currentData) return;
  setDL(true);
  const all = [
    ...currentData.images.map((u,i) => ({url:u, prefix:'main', idx:i+1})),
    ...currentData.descImages.map((u,i) => ({url:u, prefix:'desc', idx:i+1}))
  ];
  let done = 0;
  for (const {url, prefix, idx} of all) {
    const fn = 'njoy-import/' + prefix + '_' + String(idx).padStart(2,'0') + '.' + getExt(url);
    setDlProgress('Dang tai ' + (++done) + '/' + all.length + '...');
    try {
      await new Promise((res,rej) => chrome.downloads.download(
        {url, filename:fn, conflictAction:'overwrite'},
        id => chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res(id)
      ));
    } catch(e) { console.warn('skip:', url); }
    await delay(350);
  }
  setDlProgress('Xong! ' + done + ' anh -> Downloads/njoy-import/', 'ok');
  setDL(false);
});

// ── Extraction ─────────────────────────────────────────────────────────────────
extractBtn.addEventListener('click', async () => {
  setStatus('Dang trich xuat...'); setCopyButtons(true);
  output.value = ''; dlSection.style.display = 'none';
  imgStrip.style.display = 'none'; hidePrice();

  let tab;
  try { [tab] = await chrome.tabs.query({active:true, currentWindow:true}); }
  catch { setStatus('Khong lay duoc tab.', 'err'); return; }

  const url = tab.url || '';
  if (!url.includes('taobao.com') && !url.includes('1688.com') && !url.includes('tmall.com')) {
    setStatus('Chi hoat dong tren taobao.com / 1688.com / tmall.com', 'err'); return;
  }

  try { await chrome.scripting.executeScript({target:{tabId:tab.id}, files:['content.js']}); } catch {}

  try {
    const resp = await chrome.tabs.sendMessage(tab.id, {action:'extract'});
    if (!resp?.ok) throw new Error(resp?.error || 'Khong nhan duoc du lieu');
    currentData = resp.data;
    output.value = formatOutput(currentData);
    setCopyButtons(false);
    if (currentData.price) showPrice(currentData.price);
    showImageStrip(currentData.images);
    const mc = currentData.images.length, dc = currentData.descImages.length;
    dlMainBtn.textContent = 'Anh chinh (' + mc + ')';
    dlDescBtn.textContent  = 'Anh mo ta (' + dc + ')';
    dlAllBtn.textContent   = 'Tai tat ca (' + (mc+dc) + ')';
    dlMainBtn.disabled = !mc; dlDescBtn.disabled = !dc; dlAllBtn.disabled = !(mc+dc);
    dlSection.style.display = 'block'; setDlProgress('');
    const pi = currentData.price ? ' | ' + currentData.price.cnyStr + ' = ' + currentData.price.vndStr : '';
    setStatus('[' + currentData.platform.toUpperCase() + '] ' + currentData.specs.length + ' thong so | ' + mc + ' anh chinh | ' + dc + ' anh mo ta' + pi, 'ok');
  } catch(e) {
    setStatus('Loi: ' + e.message + ' — Thu reload trang roi bam lai.', 'err');
  }
});

// ── Copy toàn bộ ───────────────────────────────────────────────────────────────
copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(output.value); }
  catch { output.select(); document.execCommand('copy'); }
  setStatus('Da copy toan bo!', 'ok');
});

// ── Copy mô tả gốc (Taobao/1688) ──────────────────────────────────────────────
copyDescBtn.addEventListener('click', async () => {
  if (!currentData) return;
  const text = formatDescOnly(currentData);
  try { await navigator.clipboard.writeText(text); }
  catch { output.value = text; output.select(); document.execCommand('copy'); output.value = formatOutput(currentData); }
  setStatus('Da copy mo ta goc! (' + currentData.platform.toUpperCase() + ')', 'ok');
});

// ── Copy mô tả chuẩn Shopee (đã điền sẵn từ data) ────────────────────────────
copyShopeeBtn.addEventListener('click', async () => {
  if (!currentData) return;
  const text = formatShopeeSection(currentData);
  try { await navigator.clipboard.writeText(text); }
  catch { output.value = text; output.select(); document.execCommand('copy'); output.value = formatOutput(currentData); }
  setStatus('Da copy mo ta chuan Shopee (da dien san)!', 'ok');
});
