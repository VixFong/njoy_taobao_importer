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
function setStatus(msg, type) { if(type===undefined)type=''; statusEl.textContent = msg; statusEl.className = type; }
function setDlProgress(msg, type) { if(type===undefined)type=''; dlProgress.textContent = msg; dlProgress.className = type; }
function delay(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

// Kiểm tra ký tự CJK (tiếng Trung/Nhật/Hàn) dùng charCode thay vì regex Unicode
function hasChinese(str) {
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if ((c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf) ||
        (c >= 0xf900 && c <= 0xfaff) || (c >= 0x20000 && c <= 0x2a6df)) {
      return true;
    }
  }
  return false;
}

// Xóa ký tự CJK khỏi chuỗi
function removeChinese(str) {
  var result = '';
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (!((c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf) ||
          (c >= 0xf900 && c <= 0xfaff) || (c >= 0x20000 && c <= 0x2a6df))) {
      result += str[i];
    }
  }
  return result;
}

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

// ── Trích xuất giá trị theo key từ specs[] ────────────────────────────────────
function specVal(specs) {
  var keys = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < specs.length; i++) {
    var lower = specs[i].toLowerCase();
    for (var j = 0; j < keys.length; j++) {
      if (lower.indexOf(keys[j].toLowerCase()) !== -1) {
        var parts = specs[i].split(/[:]/);
        if (parts.length >= 2) return parts.slice(1).join(':').trim();
        return specs[i].trim();
      }
    }
  }
  return '';
}

// ── Sinh tên sản phẩm Shopee từ data ──────────────────────────────────────────
function buildShopeeName(d) {
  var raw = removeChinese(d.title || '').replace(/\s+/g, ' ').trim();
  if (raw.length >= 10) return raw.substring(0, 120);
  return (d.title || '').substring(0, 120);
}

// ── Sinh hashtag ───────────────────────────────────────────────────────────────
function buildHashtags(d) {
  var tags = [];
  var title = (d.title || '').toLowerCase();
  if (title.indexOf('sac') !== -1 || title.indexOf('charger') !== -1) tags.push('#sacnhanh');
  if (title.indexOf('khong day') !== -1 || title.indexOf('wireless') !== -1) tags.push('#sackhongday');
  if (title.indexOf('iphone') !== -1 || title.indexOf('ios') !== -1) tags.push('#phuKienIphone');
  if (title.indexOf('android') !== -1 || title.indexOf('samsung') !== -1) tags.push('#phuKienAndroid');
  if (title.indexOf('op lung') !== -1 || title.indexOf('case') !== -1) tags.push('#oplung');
  if (title.indexOf('kinh') !== -1 || title.indexOf('tempered') !== -1) tags.push('#kinhcuongluc');
  if (title.indexOf('day cap') !== -1 || title.indexOf('cable') !== -1) tags.push('#daycap');
  if (title.indexOf('tai nghe') !== -1 || title.indexOf('headphone') !== -1) tags.push('#tainghe');
  if (tags.length === 0) tags.push('#phuKienDienTu');
  tags.push('#njoyshop');
  return tags.slice(0, 5).join(' ');
}

// ── Sinh mô tả chuẩn Shopee từ data thực tế ───────────────────────────────────
function buildShopeeDesc(d) {
  var L = [];
  var sp = d.specs || [];
  var vr = d.variants || [];

  // PHẦN 1: THÔNG SỐ KỸ THUẬT
  L.push('--- THONG SO KY THUAT ---');
  var cleanTitle = removeChinese(d.title || '').replace(/\s+/g, ' ').trim();
  L.push('* Ten san pham: ' + (cleanTitle || d.title || 'Xem anh'));

  if (sp.length > 0) {
    for (var i = 0; i < sp.length; i++) {
      var latinPart = removeChinese(sp[i]).replace(/\s+/g, ' ').trim();
      if (latinPart.length > 3) {
        L.push('* ' + latinPart);
      } else {
        L.push('* ' + sp[i]);
      }
    }
  }

  if (vr.length > 0) {
    L.push('* Phien ban / mau sac: ' + vr.slice(0, 8).join(', '));
  }

  if (d.price) {
    L.push('* Gia goc: ' + d.price.cnyStr + ' ~ ' + d.price.vndStr);
  }

  L.push('');

  // PHẦN 2: CÔNG DỤNG VÀ LỢI ÍCH
  L.push('--- CONG DUNG VA LOI ICH ---');

  if (d.desc) {
    var sentences = d.desc.split(/[.!\n|]+/);
    var count = 0;
    var used = {};
    for (var k = 0; k < sentences.length && count < 5; k++) {
      var s = sentences[k].replace(/\s+/g, ' ').trim();
      // Bỏ câu toàn tiếng Trung hoặc quá ngắn/dài
      if (s.length < 10 || s.length > 200) continue;
      var latinOnly = removeChinese(s).trim();
      if (latinOnly.length < 5) continue; // bỏ nếu hầu hết là tiếng Trung
      if (used[s]) continue;
      used[s] = true;
      L.push('* ' + latinOnly);
      count++;
    }
    if (count === 0) {
      L.push('* San pham chat luong cao, thiet ke tinh te, su dung ben bi');
    }
  } else {
    var mat = specVal(sp, 'chat lieu', 'material');
    if (mat) L.push('* Chat lieu ' + removeChinese(mat).trim() + ', ben bi va an toan khi su dung');
    var size = specVal(sp, 'kich thuoc', 'size', 'dimension');
    if (size) L.push('* Kich thuoc gon nhe ' + removeChinese(size).trim() + ', de mang theo');
    L.push('* Thiet ke hien dai, phu hop voi nhieu phong cach su dung');
    L.push('* De su dung, khong can huong dan phuc tap');
  }

  L.push('');

  // PHẦN 3: BẢO HÀNH
  L.push('--- BAO HANH & CAM KET ---');
  var bh = specVal(sp, 'bao hanh', 'warranty');
  if (bh) {
    L.push('* Bao hanh: ' + removeChinese(bh).trim());
  } else {
    L.push('* Bao hanh: 3 thang loi do nha san xuat');
  }
  L.push('* Doi tra: Trong 7 ngay neu loi do nha san xuat');
  L.push('* San pham duoc kiem tra ky truoc khi giao');

  return L.join('\n');
}

// ── Sinh section chuẩn Shopee đầy đủ ─────────────────────────────────────────
function formatShopeeSection(d) {
  var L = [];

  L.push('=== MO TA CHUAN SHOPEE (DA DIEN SAN TU DU LIEU ' + d.platform.toUpperCase() + ') ===');
  L.push('');
  L.push('--- TEN SAN PHAM (de xuat, toi da 120 ky tu) ---');
  L.push(buildShopeeName(d));
  L.push('');
  L.push(buildShopeeDesc(d));
  L.push('');
  L.push('--- HASHTAG ---');
  L.push(buildHashtags(d));
  L.push('');
  L.push('Luu y: Kiem tra lai thong so truoc khi dang ban.');
  L.push('Thong so tu ' + (d.platform === '1688' ? '1688 (chinh xac cao)' : 'Taobao (can kiem tra lai)') + '.');

  return L.join('\n');
}

// ── Output formatter (full) ────────────────────────────────────────────────────
function formatOutput(d) {
  var L = [];
  var is1688 = d.platform === '1688';

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

  if (d.specs && d.specs.length > 0) {
    L.push('[ THONG SO KY THUAT' + (is1688 ? ' - 1688 / DO CHINH XAC CAO' : ' - TAOBAO') + ' ]');
    for (var i = 0; i < d.specs.length; i++) L.push('  ' + d.specs[i]);
    L.push('');
  }

  if (d.variants && d.variants.length > 0) {
    L.push('[ VARIANTS ]');
    for (var j = 0; j < d.variants.length; j++) L.push('  ' + d.variants[j]);
    L.push('');
  }

  if (d.images && d.images.length > 0) {
    L.push('[ ANH CHINH - ' + d.images.length + ' anh ]');
    for (var a = 0; a < d.images.length; a++) L.push(String(a+1).padStart(2,'0') + '. ' + d.images[a]);
    L.push('');
  }
  if (d.descImages && d.descImages.length > 0) {
    L.push('[ ANH MO TA - ' + d.descImages.length + ' anh ]');
    for (var b = 0; b < d.descImages.length; b++) L.push(String(b+1).padStart(2,'0') + '. ' + d.descImages[b]);
    L.push('');
  }

  if (d.desc) {
    L.push('[ MO TA GOC ]');
    L.push(d.desc);
    L.push('');
  }

  L.push('');
  L.push('════════════════════════════════════════════════════════');
  L.push(formatShopeeSection(d));

  return L.join('\n');
}

// ── Mô tả gốc ─────────────────────────────────────────────────────────────────
function formatDescOnly(d) {
  var L = [];
  L.push('=== MO TA GOC - ' + d.platform.toUpperCase() + ' ===');
  L.push('URL: ' + d.url);
  L.push('Ten: ' + (d.title || '(khong lay duoc)'));
  L.push('');
  if (d.specs && d.specs.length > 0) {
    L.push('[ THONG SO KY THUAT ]');
    for (var i = 0; i < d.specs.length; i++) L.push('  ' + d.specs[i]);
    L.push('');
  }
  if (d.variants && d.variants.length > 0) {
    L.push('[ PHIEN BAN / VARIANT ]');
    for (var j = 0; j < d.variants.length; j++) L.push('  ' + d.variants[j]);
    L.push('');
  }
  if (d.desc) {
    L.push('[ MO TA ]');
    L.push(d.desc);
    L.push('');
  }
  if (d.descImages && d.descImages.length > 0) {
    L.push('[ ANH MO TA (' + d.descImages.length + ' anh) ]');
    for (var k = 0; k < d.descImages.length; k++) L.push(String(k+1).padStart(2,'0') + '. ' + d.descImages[k]);
    L.push('');
  }
  return L.join('\n');
}

// ── Image preview strip ────────────────────────────────────────────────────────
function showImageStrip(images) {
  imgStrip.innerHTML = '';
  if (!images || !images.length) { imgStrip.style.display = 'none'; return; }
  imgStrip.style.display = 'flex';
  var show = images.slice(0, 9);
  for (var i = 0; i < show.length; i++) {
    var img = document.createElement('img');
    img.src = show[i]; img.title = show[i];
    imgStrip.appendChild(img);
  }
}

// ── Download ───────────────────────────────────────────────────────────────────
function getExt(url) {
  var m = url.match(/\.(jpg|jpeg|png|webp)$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

async function downloadBatch(images, prefix, progressCb) {
  var ok = 0;
  for (var i = 0; i < images.length; i++) {
    var url = images[i], ext = getExt(url), num = String(i+1).padStart(2,'0');
    progressCb(i+1, images.length);
    try {
      await new Promise(function(res, rej) {
        chrome.downloads.download(
          { url: url, filename: 'njoy-import/' + prefix + '_' + num + '.' + ext, conflictAction: 'overwrite' },
          function(id) { if (chrome.runtime.lastError) rej(chrome.runtime.lastError); else res(id); }
        );
      });
      ok++;
    } catch(e) { console.warn('DL failed:', url, e.message); }
    await delay(350);
  }
  return ok;
}

function setDL(disabled) {
  dlMainBtn.disabled = disabled;
  dlDescBtn.disabled = disabled;
  dlAllBtn.disabled  = disabled;
}

dlMainBtn.addEventListener('click', async function() {
  if (!currentData || !currentData.images || !currentData.images.length) return;
  setDL(true); setDlProgress('Dang tai anh chinh...');
  var ok = await downloadBatch(currentData.images, 'main', function(i,n){ setDlProgress('Anh chinh ' + i + '/' + n + '...'); });
  setDlProgress('Da tai ' + ok + ' anh chinh -> Downloads/njoy-import/', 'ok');
  setDL(false);
});

dlDescBtn.addEventListener('click', async function() {
  if (!currentData || !currentData.descImages || !currentData.descImages.length) return;
  setDL(true); setDlProgress('Dang tai anh mo ta...');
  var ok = await downloadBatch(currentData.descImages, 'desc', function(i,n){ setDlProgress('Anh mo ta ' + i + '/' + n + '...'); });
  setDlProgress('Da tai ' + ok + ' anh mo ta -> Downloads/njoy-import/', 'ok');
  setDL(false);
});

dlAllBtn.addEventListener('click', async function() {
  if (!currentData) return;
  setDL(true);
  var all = [];
  var imgs = currentData.images || [];
  var desc = currentData.descImages || [];
  for (var i = 0; i < imgs.length; i++) all.push({url: imgs[i], prefix: 'main', idx: i+1});
  for (var j = 0; j < desc.length; j++) all.push({url: desc[j], prefix: 'desc', idx: j+1});
  var done = 0;
  for (var k = 0; k < all.length; k++) {
    var item = all[k];
    var fn = 'njoy-import/' + item.prefix + '_' + String(item.idx).padStart(2,'0') + '.' + getExt(item.url);
    setDlProgress('Dang tai ' + (++done) + '/' + all.length + '...');
    try {
      await new Promise(function(res,rej) {
        chrome.downloads.download(
          {url: item.url, filename: fn, conflictAction: 'overwrite'},
          function(id) { if (chrome.runtime.lastError) rej(chrome.runtime.lastError); else res(id); }
        );
      });
    } catch(e) { console.warn('skip:', item.url); }
    await delay(350);
  }
  setDlProgress('Xong! ' + done + ' anh -> Downloads/njoy-import/', 'ok');
  setDL(false);
});

// ── Extraction ─────────────────────────────────────────────────────────────────
extractBtn.addEventListener('click', async function() {
  setStatus('Dang trich xuat...'); setCopyButtons(true);
  output.value = ''; dlSection.style.display = 'none';
  imgStrip.style.display = 'none'; hidePrice();

  var tab;
  try {
    var tabs = await chrome.tabs.query({active: true, currentWindow: true});
    tab = tabs[0];
  } catch(e) { setStatus('Khong lay duoc tab.', 'err'); return; }

  var url = tab.url || '';
  if (url.indexOf('taobao.com') === -1 && url.indexOf('1688.com') === -1 && url.indexOf('tmall.com') === -1) {
    setStatus('Chi hoat dong tren taobao.com / 1688.com / tmall.com', 'err'); return;
  }

  try { await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['content.js']}); } catch(e) {}

  try {
    var resp = await chrome.tabs.sendMessage(tab.id, {action: 'extract'});
    if (!resp || !resp.ok) throw new Error((resp && resp.error) || 'Khong nhan duoc du lieu');
    currentData = resp.data;
    output.value = formatOutput(currentData);
    setCopyButtons(false);
    if (currentData.price) showPrice(currentData.price);
    showImageStrip(currentData.images);
    var mc = (currentData.images || []).length;
    var dc = (currentData.descImages || []).length;
    dlMainBtn.textContent = 'Anh chinh (' + mc + ')';
    dlDescBtn.textContent  = 'Anh mo ta (' + dc + ')';
    dlAllBtn.textContent   = 'Tai tat ca (' + (mc+dc) + ')';
    dlMainBtn.disabled = !mc; dlDescBtn.disabled = !dc; dlAllBtn.disabled = !(mc+dc);
    dlSection.style.display = 'block'; setDlProgress('');
    var pi = currentData.price ? ' | ' + currentData.price.cnyStr + ' = ' + currentData.price.vndStr : '';
    setStatus('[' + currentData.platform.toUpperCase() + '] ' + (currentData.specs||[]).length + ' thong so | ' + mc + ' anh chinh | ' + dc + ' anh mo ta' + pi, 'ok');
  } catch(e) {
    setStatus('Loi: ' + e.message + ' - Thu reload trang roi bam lai.', 'err');
  }
});

// ── Copy toàn bộ ───────────────────────────────────────────────────────────────
copyBtn.addEventListener('click', async function() {
  try { await navigator.clipboard.writeText(output.value); }
  catch(e) { output.select(); document.execCommand('copy'); }
  setStatus('Da copy toan bo!', 'ok');
});

// ── Copy mô tả gốc (Taobao/1688) ──────────────────────────────────────────────
copyDescBtn.addEventListener('click', async function() {
  if (!currentData) return;
  var text = formatDescOnly(currentData);
  try { await navigator.clipboard.writeText(text); }
  catch(e) { output.value = text; output.select(); document.execCommand('copy'); output.value = formatOutput(currentData); }
  setStatus('Da copy mo ta goc! (' + currentData.platform.toUpperCase() + ')', 'ok');
});

// ── Copy mô tả chuẩn Shopee (đã điền sẵn) ────────────────────────────────────
copyShopeeBtn.addEventListener('click', async function() {
  if (!currentData) return;
  var text = formatShopeeSection(currentData);
  try { await navigator.clipboard.writeText(text); }
  catch(e) { output.value = text; output.select(); document.execCommand('copy'); output.value = formatOutput(currentData); }
  setStatus('Da copy mo ta chuan Shopee (da dien san)!', 'ok');
});
