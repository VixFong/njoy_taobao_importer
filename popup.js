const extractBtn = document.getElementById('extractBtn');
const copyBtn = document.getElementById('copyBtn');
const copyDescBtn = document.getElementById('copyDescBtn');
const copyShopeeBtn = document.getElementById('copyShopeeBtn');
const output = document.getElementById('output');
const statusEl = document.getElementById('status');
const dlSection = document.getElementById('dlSection');
const dlMainBtn = document.getElementById('dlMainBtn');
const dlDescBtn = document.getElementById('dlDescBtn');
const dlAllBtn = document.getElementById('dlAllBtn');
const dlProgress = document.getElementById('dlProgress');
const imgStrip = document.getElementById('imgStrip');
const priceBox = document.getElementById('priceBox');

let currentData = null;

var NL = String.fromCharCode(10);

function setStatus(msg, type) { if(type===undefined)type=''; statusEl.textContent = msg; statusEl.className = type; }
function setDlProgress(msg, type) { if(type===undefined)type=''; dlProgress.textContent = msg; dlProgress.className = type; }
function delay(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

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

function dichTenSpec(key) {
  var k = key.toLowerCase().trim();
  var map = [
    ['brand','Thuong hieu'],['hang','Thuong hieu'],['nhan hieu','Thuong hieu'],
    ['chat lieu','Chat lieu'],['material','Chat lieu'],['vat lieu','Chat lieu'],
    ['color','Mau sac'],['colour','Mau sac'],['mau','Mau sac'],
    ['size','Kich thuoc'],['kich thuoc','Kich thuoc'],['kich co','Kich thuoc'],['dimension','Kich thuoc'],
    ['weight','Trong luong'],['trong luong','Trong luong'],['can nang','Trong luong'],
    ['power','Cong suat'],['cong suat','Cong suat'],['watt','Cong suat'],
    ['voltage','Dien ap'],['dien ap','Dien ap'],['volt','Dien ap'],
    ['current','Dong dien'],['dong dien','Dong dien'],['amp','Dong dien'],
    ['capacity','Dung luong'],['dung luong','Dung luong'],
    ['warranty','Bao hanh'],['bao hanh','Bao hanh'],
    ['origin','Xuat xu'],['xuat xu','Xuat xu'],['made in','Xuat xu'],
    ['compatible','Tuong thich'],['tuong thich','Tuong thich'],
    ['connect','Ket noi'],['ket noi','Ket noi'],['interface','Cong giao tiep'],
    ['charging','Sac'],['charge','Sac'],
    ['input','Dau vao'],['output','Dau ra'],
    ['length','Chieu dai'],['chieu dai','Chieu dai'],
    ['width','Chieu rong'],['chieu rong','Chieu rong'],
    ['height','Chieu cao'],['chieu cao','Chieu cao'],
    ['type','Loai'],['loai','Loai'],
    ['model','Model'],['ma sp','Ma san pham'],['sku','Ma san pham'],
    ['package','Dong goi'],['dong goi','Dong goi'],
    ['quantity','So luong'],['so luong','So luong'],
    ['temp','Nhiet do'],['nhiet do','Nhiet do'],
    ['function','Tinh nang'],['tinh nang','Tinh nang'],['chuc nang','Tinh nang'],
    ['application','Ung dung'],['ung dung','Ung dung'],
    ['style','Phong cach'],['phong cach','Phong cach'],
    ['feature','Dac diem'],['dac diem','Dac diem']
  ];
  for (var i = 0; i < map.length; i++) {
    if (k.indexOf(map[i][0]) !== -1) return map[i][1];
  }
  var clean = removeChinese(key).replace(/s+/g,' ').trim();
  return clean.length > 1 ? clean : key.trim();
}

function formatSpecLine(specStr) {
  var colonIdx = specStr.indexOf(':');
  var key, val;
  if (colonIdx > 0) {
    key = specStr.substring(0, colonIdx).trim();
    val = specStr.substring(colonIdx + 1).trim();
  } else {
    var clean = removeChinese(specStr).replace(/s+/g,' ').trim();
    return clean.length > 2 ? ('- ' + clean) : '';
  }
  var keyViet = dichTenSpec(key);
  var valClean = removeChinese(val).replace(/s+/g,' ').trim();
  if (valClean.length < 1) valClean = val.trim();
  if (valClean.length < 1) return '';
  return '- ' + keyViet + ': ' + valClean;
}
function showPrice(price) {
  if (!price || !priceBox) return;
  priceBox.style.display = 'flex';
  document.getElementById('priceCNY').textContent = price.cnyStr;
  document.getElementById('priceVND').textContent = price.vndStr;
}
function hidePrice() { if (priceBox) priceBox.style.display = 'none'; }

function setCopyButtons(disabled) {
  copyBtn.disabled = disabled;
  copyDescBtn.disabled = disabled;
  copyShopeeBtn.disabled = disabled;
}

function buildShopeeName(d) {
  var raw = removeChinese(d.title || '').replace(/s+/g, ' ').trim();
  if (raw.length >= 10) return raw.substring(0, 120);
  return (d.title || '').substring(0, 120);
}

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

function buildShopeeDesc(d) {
  var lines = [];
  var sp = d.specs || [];
  var vr = d.variants || [];

  lines.push('THONG SO KY THUAT');
  lines.push('------------------');
  var cleanTitle = removeChinese(d.title || '').replace(/s+/g, ' ').trim();
  if (cleanTitle.length >= 5) {
    lines.push('- Ten san pham: ' + cleanTitle.substring(0, 100));
  }
  if (sp.length > 0) {
    for (var i = 0; i < sp.length; i++) {
      var line = formatSpecLine(sp[i]);
      if (line.length > 3) lines.push(line);
    }
  }
  if (vr.length > 0) {
    var vrClean = [];
    for (var v = 0; v < vr.length && v < 8; v++) {
      var vClean = removeChinese(vr[v]).replace(/s+/g,' ').trim();
      if (vClean.length > 0) vrClean.push(vClean);
    }
    if (vrClean.length > 0) lines.push('- Phien ban / Mau sac: ' + vrClean.join(', '));
  }
  if (d.price) {
    lines.push('- Gia tham khao: ' + d.price.cnyStr + ' (tuong duong ~' + d.price.vndStr + ')');
  }
  lines.push('');

  lines.push('TINH NANG & CONG DUNG');
  lines.push('---------------------');
  var featureAdded = 0;
  for (var s = 0; s < sp.length; s++) {
    var lowerSp = sp[s].toLowerCase();
    if (lowerSp.indexOf('tinh nang') !== -1 || lowerSp.indexOf('function') !== -1 ||
        lowerSp.indexOf('application') !== -1 || lowerSp.indexOf('ung dung') !== -1 ||
        lowerSp.indexOf('feature') !== -1 || lowerSp.indexOf('chuc nang') !== -1) {
      var fLine = formatSpecLine(sp[s]);
      if (fLine.length > 3) { lines.push(fLine); featureAdded++; }
    }
  }
  var titleClean = removeChinese(d.title || '').replace(/s+/g,' ').trim().toLowerCase();
  if (titleClean.indexOf('wireless') !== -1 || titleClean.indexOf('khong day') !== -1) {
    lines.push('- Sac khong day tien loi, khong can day cap ruong rac');
    featureAdded++;
  }
  if (titleClean.indexOf('fast') !== -1 || titleClean.indexOf('nhanh') !== -1 || titleClean.indexOf('quick') !== -1) {
    lines.push('- Ho tro sac nhanh, tiet kiem thoi gian cho thiet bi');
    featureAdded++;
  }
  if (titleClean.indexOf('fold') !== -1 || titleClean.indexOf('gap') !== -1) {
    lines.push('- Thiet ke gap gon, de mang theo khi di chuyen');
    featureAdded++;
  }
  if (titleClean.indexOf('stand') !== -1 || titleClean.indexOf('gia do') !== -1) {
    lines.push('- Gia do tien loi, de man hinh theo goc nhin thoai mai');
    featureAdded++;
  }
  if (featureAdded === 0) {
    lines.push('- San pham chat luong cao, duoc kiem tra ky truoc khi giao');
    lines.push('- Thiet ke hien dai, phu hop nhieu nhu cau su dung');
    lines.push('- De su dung, khong can huong dan phuc tap');
  }
  lines.push('');

  lines.push('BAO HANH & CAM KET');
  lines.push('------------------');
  var bhFound = false;
  for (var b = 0; b < sp.length; b++) {
    var bLower = sp[b].toLowerCase();
    if (bLower.indexOf('bao hanh') !== -1 || bLower.indexOf('warranty') !== -1) {
      var bhLine = formatSpecLine(sp[b]);
      if (bhLine.length > 3) { lines.push(bhLine); bhFound = true; break; }
    }
  }
  if (!bhFound) lines.push('- Bao hanh: 3 thang loi do nha san xuat');
  lines.push('- Doi tra: Trong 7 ngay neu loi do nha san xuat');
  lines.push('- Kiem tra ky san pham truoc khi gui di');
  lines.push('- Ho tro khach hang 24/7, giai quyet nhanh moi van de');

  return lines.join(NL);
}

function formatShopeeSection(d) {
  var lines = [];
  lines.push('========================================');
  lines.push('MO TA CHUAN SHOPEE');
  lines.push('(Du lieu tu ' + (d.platform === '1688' ? '1688' : 'Taobao') + ' - Da viet lai bang tieng Viet)');
  lines.push('========================================');
  lines.push('');
  lines.push('TEN SAN PHAM (toi da 120 ky tu):');
  lines.push(buildShopeeName(d));
  lines.push('');
  lines.push(buildShopeeDesc(d));
  lines.push('');
  lines.push('HASHTAG:');
  lines.push(buildHashtags(d));
  lines.push('');
  lines.push('Luu y: Kiem tra lai thong so truoc khi dang ban.');
  return lines.join(NL);
}
function formatOutput(d) {
  var L = [];
  var is1688 = d.platform === '1688';
  L.push('=== NJOY PRODUCT IMPORT ===');
  L.push('Platform : ' + d.platform.toUpperCase());
  L.push('URL      : ' + d.url);
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
  L.push('================================================');
  L.push(formatShopeeSection(d));
  return L.join(NL);
}

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
  return L.join(NL);
}

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

function getExt(url) {
  var m = url.match(/.(jpg|jpeg|png|webp)$/i);
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
  dlAllBtn.disabled = disabled;
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
    dlDescBtn.textContent = 'Anh mo ta (' + dc + ')';
    dlAllBtn.textContent = 'Tai tat ca (' + (mc+dc) + ')';
    dlMainBtn.disabled = !mc; dlDescBtn.disabled = !dc; dlAllBtn.disabled = !(mc+dc);
    dlSection.style.display = 'block'; setDlProgress('');
    var pi = currentData.price ? ' | ' + currentData.price.cnyStr + ' = ' + currentData.price.vndStr : '';
    setStatus('[' + currentData.platform.toUpperCase() + '] ' + (currentData.specs||[]).length + ' thong so | ' + mc + ' anh chinh | ' + dc + ' anh mo ta' + pi, 'ok');
  } catch(e) {
    setStatus('Loi: ' + e.message + ' - Thu reload trang roi bam lai.', 'err');
  }
});

copyBtn.addEventListener('click', async function() {
  try { await navigator.clipboard.writeText(output.value); }
  catch(e) { output.select(); document.execCommand('copy'); }
  setStatus('Da copy toan bo!', 'ok');
});

copyDescBtn.addEventListener('click', async function() {
  if (!currentData) return;
  var text = formatDescOnly(currentData);
  try { await navigator.clipboard.writeText(text); }
  catch(e) { output.value = text; output.select(); document.execCommand('copy'); output.value = formatOutput(currentData); }
  setStatus('Da copy mo ta goc! (' + currentData.platform.toUpperCase() + ')', 'ok');
});

copyShopeeBtn.addEventListener('click', async function() {
  if (!currentData) return;
  var text = formatShopeeSection(currentData);
  try { await navigator.clipboard.writeText(text); }
  catch(e) { output.value = text; output.select(); document.execCommand('copy'); output.value = formatOutput(currentData); }
  setStatus('Da copy mo ta chuan Shopee (tieng Viet)!', 'ok');
});
