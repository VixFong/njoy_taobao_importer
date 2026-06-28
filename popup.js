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
        (c >= 0xf900 && c <= 0xfaff)) return true;
  }
  return false;
}

function removeChinese(str) {
  var result = '';
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (!((c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf) ||
          (c >= 0xf900 && c <= 0xfaff))) {
      result += str[i];
    }
  }
  return result;
}

// Tach chuoi theo NL(10) CR(13) PIPE(124) khong dung regex literal
function splitLines(str) {
  var result = [];
  var current = '';
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    if (code === 10 || code === 13 || code === 124) {
      if (current.trim().length > 0) result.push(current.trim());
      current = '';
    } else {
      current += str[i];
    }
  }
  if (current.trim().length > 0) result.push(current.trim());
  return result;
}

// Bang dich chu Trung -> ten tieng Viet (cac spec pho bien tren 1688/Taobao)
var CJK_MAP = [
  ['最大输出功率','Cong suat toi da'],['输出功率','Cong suat dau ra'],['总功率','Tong cong suat'],
  ['输入功率','Cong suat dau vao'],['额定功率','Cong suat dinh muc'],
  ['输出电流','Dong dien dau ra'],['输入电流','Dong dien dau vao'],
  ['输出电压','Dien ap dau ra'],['输入电压','Dien ap dau vao'],
  ['充电协议','Giao thuc sac'],['充电方式','Phuong thuc sac'],
  ['产品尺寸','Kich thuoc san pham'],['包装尺寸','Kich thuoc dong goi'],
  ['彩合尺寸','Kich thuoc hop mau'],['外箱尺寸','Kich thuoc thung'],
  ['折叠尺寸','Kich thuoc khi gap'],['展开尺寸','Kich thuoc khi mo'],
  ['产品净重','Trong luong tinh'],['产品毛重','Trong luong co bao bi'],
  ['外箱毛重','Trong luong thung'],['装箱数量','So luong/thung'],
  ['净重','Trong luong tinh'],['毛重','Trong luong co bao bi'],
  ['重量','Trong luong'],['尺寸','Kich thuoc'],['大小','Kich thuoc'],
  ['材质','Chat lieu'],['材料','Chat lieu'],['颜色','Mau sac'],
  ['色彩','Mau sac'],['款式','Phong cach'],['风格','Phong cach'],
  ['品牌','Thuong hieu'],['货号','Ma hang'],['型号','Model'],
  ['产品认证','Chung chi'],['认证','Chung chi'],
  ['工作频率','Tan so lam viec'],['频率','Tan so'],
  ['主要销售地区','Khu vuc ban hang'],['销售地区','Khu vuc ban hang'],
  ['适用设备','Thiet bi tuong thich'],['适配设备','Thiet bi tuong thich'],
  ['兼容性','Tuong thich'],['适用范围','Pham vi su dung'],
  ['接口类型','Loai cong ket noi'],['接口','Cong ket noi'],
  ['连接方式','Phuong thuc ket noi'],['充电头','Dau sac'],
  ['电源输入','Nguon dien dau vao'],['包装内容','Noi dung dong goi'],
  ['配件','Phu kien kem theo'],['功能','Tinh nang'],
  ['特点','Dac diem'],['特性','Dac tinh'],
  ['有可授权的自有品牌','Co thuong hieu rieng'],['是否专利货源','Co bang sang che'],
  ['支持订制','Ho tro dat hang rieng'],['起订量','So luong toi thieu'],
  ['保修期','Bao hanh'],['保质期','Han su dung'],['质保','Bao hanh'],
  ['产地','Xuat xu'],['原产地','Xuat xu'],['生产地','Noi san xuat']
];

function dichCJK(key) {
  var k = key.trim();
  // 1. Tim trong bang CJK
  for (var i = 0; i < CJK_MAP.length; i++) {
    if (k.indexOf(CJK_MAP[i][0]) !== -1) return CJK_MAP[i][1];
  }
  // 2. Bo chu Trung, lay phan Latin con lai
  var latin = removeChinese(k).replace(/s+/g,' ').trim();
  if (latin.length > 1) return latin;
  // 3. Fallback: tra ve key goc cat ngan
  return k.substring(0, 20);
}

// Dich gia tri: xoa chu Trung nhung giu lai so va ky tu dac biet
function dichVal(val) {
  var v = val.trim();
  var cleaned = removeChinese(v).replace(/s+/g,' ').trim();
  // Neu sau khi xoa chu Trung van con du lieu co ich (so, don vi, ky hieu)
  if (cleaned.length >= 1) return cleaned;
  // Neu hoan toan la chu Trung (vd: 是/否/通用) -> dich mot so truong hop pho bien
  if (v === '是') return 'Co';
  if (v === '否') return 'Khong';
  if (v === '通用') return 'Pho thong';
  if (v === '支持') return 'Ho tro';
  if (v === '不支持') return 'Khong ho tro';
  if (v === '有') return 'Co';
  if (v === '无') return 'Khong';
  // Giu nguyen neu khong dich duoc
  return v;
}

function formatSpecLine(specStr) {
  var colonIdx = specStr.indexOf(':');
  // Thu dau full-width colon neu khong co half-width
  if (colonIdx < 0) colonIdx = specStr.indexOf('：');
  var key, val;
  if (colonIdx > 0) {
    key = specStr.substring(0, colonIdx).trim();
    val = specStr.substring(colonIdx + 1).trim();
  } else {
    var clean = removeChinese(specStr).replace(/s+/g,' ').trim();
    return clean.length > 2 ? ('- ' + clean) : '';
  }
  var keyViet = hasChinese(key) ? dichCJK(key) : dichCJK(key);
  var valViet = dichVal(val);
  if (!valViet || valViet.length < 1) return '';
  return '- ' + keyViet + ': ' + valViet;
}
// Trich xuat thong so tu d.desc (text tu mo ta 1688/Taobao)
// d.desc vi du: "...| Q740# | Dau vao: DC9V | Cong suat: 5W/15W | Chat lieu: ABS ..."
function parseDescSpecs(desc) {
  if (!desc) return [];
  var results = [];
  var seen = {};
  var lines = splitLines(desc);
  for (var li = 0; li < lines.length; li++) {
    var seg = lines[li].trim();
    if (!seg || seg.length < 3) continue;
    // Xu ly tung cap key:val trong doan nay
    // Vi moi doan co the co nhieu cap lien tiep nhu "Chat lieu: ABS  Tan so: 100-250KHz"
    // Ta tach bang cach tim tat ca cac vi tri co dau ":" va phan phoi key/val
    var pairs = extractPairsFromSegment(seg);
    for (var pi = 0; pi < pairs.length; pi++) {
      var p = pairs[pi];
      var keyNorm = p.k.toLowerCase().replace(/s+/g,'');
      if (!keyNorm || keyNorm.length < 1) continue;
      if (seen[keyNorm]) continue;
      seen[keyNorm] = true;
      var keyViet = hasChinese(p.k) ? dichCJK(p.k) : dichCJK(p.k);
      var valViet = dichVal(p.v);
      if (!valViet || valViet.length < 1) continue;
      results.push('- ' + keyViet + ': ' + valViet);
    }
  }
  return results;
}

// Tach cac cap key:val tu 1 doan text (co the co nhieu cap tren cung 1 dong)
// Vi du: "Chat lieu: ABS  Tan so: 100-250KHz" -> [{k:'Chat lieu',v:'ABS'},{k:'Tan so',v:'100-250KHz'}]
function extractPairsFromSegment(seg) {
  var pairs = [];
  var pos = 0;
  var len = seg.length;
  while (pos < len) {
    // Tim dau ':' tiep theo
    var cPos = -1;
    for (var ci = pos; ci < len; ci++) {
      var ch = seg.charCodeAt(ci);
      // Dau ':' half-width (58) hoac full-width (65306)
      if (ch === 58 || ch === 65306) { cPos = ci; break; }
    }
    if (cPos < 0) break; // Khong con dau ':' nao
    var rawKey = seg.substring(pos, cPos).trim();
    if (!rawKey || rawKey.length < 1) { pos = cPos + 1; continue; }
    // Tim diem ket thuc value: tim dau ':' tiep theo, di nguoc de lay key tiep theo
    var nextCPos = -1;
    for (var nci = cPos + 1; nci < len; nci++) {
      var nch = seg.charCodeAt(nci);
      if (nch === 58 || nch === 65306) { nextCPos = nci; break; }
    }
    var rawVal;
    if (nextCPos > 0) {
      // Lay val den truoc key tiep theo
      // Key tiep theo bat dau tu dau? Di nguoc tu nextCPos den khi gap khoang trang
      var keyStart = nextCPos - 1;
      while (keyStart > cPos + 1 && seg.charCodeAt(keyStart - 1) > 32) keyStart--;
      rawVal = seg.substring(cPos + 1, keyStart).trim();
      pos = keyStart;
    } else {
      rawVal = seg.substring(cPos + 1).trim();
      pos = len;
    }
    if (rawKey.length > 0 && rawVal.length > 0) {
      pairs.push({k: rawKey, v: rawVal});
    }
  }
  return pairs;
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

// Sinh ten san pham Shopee: uu tien Latin, fallback dung keyword map
function buildShopeeName(d) {
  var title = d.title || '';
  var latin = removeChinese(title).replace(/s+/g,' ').trim();
  if (latin.length >= 5) return latin.substring(0, 120);
  // Fallback: tim cac tu khoa Latin/so trong title
  var keywords = [];
  var parts = title.split(' ');
  for (var i = 0; i < parts.length; i++) {
    var p = removeChinese(parts[i]).trim();
    if (p.length > 0) keywords.push(p);
  }
  if (keywords.length > 0) return keywords.join(' ').substring(0, 120);
  // Fallback cuoi: lay tu CJK_MAP keywords
  for (var j = 0; j < CJK_MAP.length; j++) {
    if (title.indexOf(CJK_MAP[j][0]) !== -1) keywords.push(CJK_MAP[j][1]);
  }
  return keywords.length > 0 ? keywords.join(', ').substring(0, 120) : title.substring(0, 120);
}

function buildHashtags(d) {
  var tags = [];
  var title = (d.title || '').toLowerCase();
  var desc = (d.desc || '').toLowerCase();
  var combined = title + ' ' + desc;
  if (combined.indexOf('sac') !== -1 || combined.indexOf('charger') !== -1 || combined.indexOf('充') !== -1) tags.push('#sacnhanh');
  if (combined.indexOf('wireless') !== -1 || combined.indexOf('无线') !== -1) tags.push('#sackhongday');
  if (combined.indexOf('iphone') !== -1 || combined.indexOf('ios') !== -1) tags.push('#phuKienIphone');
  if (combined.indexOf('android') !== -1 || combined.indexOf('samsung') !== -1) tags.push('#phuKienAndroid');
  if (combined.indexOf('case') !== -1 || combined.indexOf('op lung') !== -1) tags.push('#oplung');
  if (combined.indexOf('cable') !== -1 || combined.indexOf('day cap') !== -1) tags.push('#daycap');
  if (combined.indexOf('tai nghe') !== -1 || combined.indexOf('headphone') !== -1) tags.push('#tainghe');
  if (tags.length === 0) tags.push('#phuKienDienTu');
  tags.push('#njoyshop');
  return tags.slice(0, 5).join(' ');
}

function buildShopeeDesc(d) {
  var lines = [];
  var sp = d.specs || [];
  var vr = d.variants || [];
  var specLines = [];
  var seenKeys = {};

  // 1. Lay tu d.specs[] - dich ca key Trung Quoc
  for (var i = 0; i < sp.length; i++) {
    var line = formatSpecLine(sp[i]);
    if (line.length > 3) {
      var cpos = line.indexOf(':');
      var kpart = cpos > 0 ? line.substring(2, cpos).toLowerCase().replace(/s+/g,'') : '';
      if (kpart && !seenKeys[kpart]) {
        seenKeys[kpart] = true;
        specLines.push(line);
      }
    }
  }

  // 2. Bo sung tu d.desc (kich thuoc, trong luong, v.v.)
  var descEx = parseDescSpecs(d.desc);
  for (var e = 0; e < descEx.length; e++) {
    var dLine = descEx[e];
    var dcpos = dLine.indexOf(':');
    var dKey = dcpos > 0 ? dLine.substring(2, dcpos).toLowerCase().replace(/s+/g,'') : '';
    if (dKey && !seenKeys[dKey]) {
      seenKeys[dKey] = true;
      specLines.push(dLine);
    }
  }

  var cleanTitle = removeChinese(d.title || '').replace(/s+/g,' ').trim();

  lines.push('THONG SO KY THUAT');
  lines.push('------------------');
  if (cleanTitle.length >= 3) {
    lines.push('- Ten san pham: ' + cleanTitle.substring(0, 100));
  }
  for (var sl = 0; sl < specLines.length; sl++) lines.push(specLines[sl]);

  if (vr.length > 0) {
    var vrClean = [];
    for (var v = 0; v < vr.length && v < 8; v++) {
      var vClean = removeChinese(vr[v]).replace(/s+/g,' ').trim();
      if (vClean.length > 0) vrClean.push(vClean);
    }
    if (vrClean.length > 0) lines.push('- Phien ban / Mau sac: ' + vrClean.join(', '));
  }
  if (d.price) {
    lines.push('- Gia tham khao: ' + d.price.cnyStr + ' (~' + d.price.vndStr + ')');
  }
  lines.push('');

  lines.push('TINH NANG & CONG DUNG');
  lines.push('---------------------');
  var featureAdded = 0;
  var titleRaw = d.title || '';
  var descRaw = d.desc || '';
  if (titleRaw.indexOf('无线') !== -1 || descRaw.indexOf('wireless') !== -1) {
    lines.push('- Sac khong day tien loi, khong can day cap ruong rac'); featureAdded++;
  }
  if (descRaw.indexOf('15W') !== -1 || descRaw.indexOf('快充') !== -1) {
    lines.push('- Ho tro sac nhanh toc do cao, tiet kiem thoi gian sac'); featureAdded++;
  }
  if (titleRaw.indexOf('折叠') !== -1 || descRaw.indexOf('fold') !== -1) {
    lines.push('- Thiet ke gap gon, de mang theo khi di chuyen'); featureAdded++;
  }
  if (titleRaw.indexOf('支架') !== -1 || titleRaw.indexOf('stand') !== -1) {
    lines.push('- Gia do tien loi, de man hinh theo goc nhin thoai mai'); featureAdded++;
  }
  if (titleRaw.indexOf('双线圈') !== -1) {
    lines.push('- Cuon day kep (dual coil), tuong thich nhieu loai thiet bi'); featureAdded++;
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
    var bLow = sp[b].toLowerCase();
    if (bLow.indexOf('bao hanh') !== -1 || bLow.indexOf('warranty') !== -1 || bLow.indexOf('质保') !== -1 || bLow.indexOf('保修') !== -1) {
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
