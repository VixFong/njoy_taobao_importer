const extractBtn = document.getElementById('extractBtn');
const copyBtn    = document.getElementById('copyBtn');
const output     = document.getElementById('output');
const statusEl   = document.getElementById('status');
const dlSection  = document.getElementById('dlSection');
const dlMainBtn  = document.getElementById('dlMainBtn');
const dlDescBtn  = document.getElementById('dlDescBtn');
const dlAllBtn   = document.getElementById('dlAllBtn');
const dlProgress = document.getElementById('dlProgress');
const imgStrip   = document.getElementById('imgStrip');
const priceBox   = document.getElementById('priceBox');

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

// ── Output formatter ───────────────────────────────────────────────────────────
function formatOutput(d) {
  const L = [];
  const is1688 = d.platform === '1688';
  const src = is1688
    ? '1688 (thong so ky thuat thuong chinh xac va day du hon Taobao — uu tien dung)'
    : 'Taobao (kiem tra lai thong so neu co the tu trang 1688 tuong ung)';

  // ─ HEADER ─
  L.push('=== NJOY PRODUCT IMPORT ===');
  L.push('Platform : ' + d.platform.toUpperCase());
  L.push('URL      : ' + d.url);
  L.push('');

  // ─ GIA ─
  if (d.price) {
    L.push('[ GIA ] ' + d.price.cnyStr + '  =>  ' + d.price.vndStr + '  (ty gia x4.100)');
    L.push('');
  }

  // ─ TIEU DE GOC ─
  L.push('[ TIEU DE GOC - ' + d.platform.toUpperCase() + ' ]');
  L.push(d.title || '(khong lay duoc)');
  L.push('');

  // ─ THONG SO ─
  if (d.specs.length > 0) {
    L.push('[ THONG SO KY THUAT - ' + (is1688 ? '1688 / DO CHINH XAC CAO' : 'TAOBAO') + ' ]');
    d.specs.forEach(s => L.push('  ' + s));
    L.push('');
  }

  // ─ VARIANTS ─
  if (d.variants.length > 0) {
    L.push('[ VARIANTS ]');
    d.variants.forEach(v => L.push('  ' + v));
    L.push('');
  }

  // ─ ANH ─
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

  // ─ MO TA GOC ─
  if (d.desc) {
    L.push('[ MO TA GOC ]');
    L.push(d.desc);
    L.push('');
  }

  // ════════════════════════════════════════════════════════
  // PROMPT CHO CLAUDE
  // ════════════════════════════════════════════════════════
  L.push('================================================================');
  L.push('YEU CAU: Tao TEN SAN PHAM + MO TA CHUAN SHOPEE tu du lieu tren');
  L.push('Nguon: ' + src);
  L.push('================================================================');
  L.push('');

  // ─ PHAN 1: TEN ─
  L.push('━━━ PHAN 1: TEN SAN PHAM CHUAN SEO ━━━');
  L.push('');
  L.push('NGUYEN TAC BAT BUOC (Shopee co the an/phat listing neu vi pham):');
  L.push('  [x] Toi da 120 ky tu');
  L.push('  [x] Khong dung: VIET HOA TOAN BO, spam !!!!!, tu khoa lap lai');
  L.push('  [x] Khong chen: so dien thoai, link, ten shop, cam ket "gia re nhat"');
  L.push('  [x] Ten PHAI khop voi anh san pham va thong so thuc te');
  L.push('');
  L.push('CONG THUC TOI UU cho phu kien dien tu:');
  L.push('  [Tinh nang/UU diem chinh] + [Chat lieu/Chuan] + [Ten SP] + [Dong may tuong thich]');
  L.push('');
  L.push('MEO VIET TEN CAO TUONG TU SHOPEE MALL:');
  L.push('  * Dat tu khoa nguoi mua hay search TRUOC (VD: "Chong Soc", "Tu Dan", "Sieu Mong")');
  L.push('  * Liet ke DU DONG MAY cu the: "iPhone 17 16 15 14 13 Pro Max Plus" — moi dong = 1 tu khoa');
  L.push('  * Neu co thuong hieu: "Anank", "Kuzoom", "WK KK" — giu nguyen, day la tu khoa rieng');
  L.push('  * Viet Title Case (Viet Hoa Dau Moi Tu), tu nhien, de doc');
  L.push('  * Co the them 1 tag cuoi: "- Trong Suot 9H", "- Chinh Hang", "- Mong 0.26mm"');
  L.push('');
  L.push('VI DU TEN DUNG CHUAN (phu kien Apple):');
  L.push('  -> Kinh Cuong Luc Tu Dan Chong Bui Thong Minh iPhone 17 16 15 14 13 12 11 Pro Max Plus');
  L.push('  -> Op Silicon Chong Ban Lot Nhung Co Sac Tu Tinh Bao Ve Camera iPhone 17 16 15 14 Pro Max');
  L.push('  -> Cuong Luc Camera Kuzoom AR Chong Tray Sieu Net iPhone 17 16 15 14 13 Pro Max Plus');
  L.push('  -> Day Sac USB-C to USB-C 45W Sac Nhanh PD Cho iPhone 15 16 17 iPad MacBook');
  L.push('');

  // ─ PHAN 2: MO TA ─
  L.push('━━━ PHAN 2: MO TA SAN PHAM CHUAN SHOPEE ━━━');
  L.push('');
  L.push('Shopee Uni (banhang.shopee.vn) quy dinh mo ta can du 3 phan chinh:');
  L.push('  (1) Thong so ky thuat san pham - chat lieu, trong luong, kich thuoc, cac dac tinh');
  L.push('  (2) Cong dung va loi ich - giai thich tinh nang, loi ich, huong dan su dung');
  L.push('  (3) Bao hanh (neu co) - thoi gian bao hanh, dieu kien, chinh sach doi tra');
  L.push('');
  L.push('Viet theo cau truc sau, KHONG dich may, KHONG sao chep tieng Trung:');
  L.push('');
  L.push('┌─ BAT DAU MO TA ─────────────────────────────────────────────────┐');
  L.push('[THONG SO KY THUAT]');
  L.push('• Ten san pham: [ten day du, chinh xac khop voi ten listing]');
  L.push('• Thuong hieu: [neu co]');
  L.push('• Chat lieu: [VD: "Kinh cuong luc cao cap, do cung 9H, day 0.26mm, trong suot 99%"]');
  L.push('• [Cac thong so quan trong khac lay tu phan THONG SO KY THUAT ben tren]');
  L.push('• Tuong thich: [VD: "iPhone 11 / 12 / 13 / 14 / 15 / 16 / 17 — tat ca phien ban"]');
  L.push('• Xuat xu: [neu biet]');
  L.push('• Bo san pham bao gom: [liet ke thu gi kem theo]');
  L.push('');
  L.push('[UU DIEM NOI BAT]');
  L.push('• [Loi ich 1 — viet theo ket qua nguoi dung nhan duoc]');
  L.push('  SAI: "Chat lieu silicon cao cap"');
  L.push('  DUNG: "Chat lieu silicon cao cap, cam em tay, han che tron truot hieu qua"');
  L.push('• [Loi ich 2]');
  L.push('  SAI: "Kinh cuong luc 9H"');
  L.push('  DUNG: "Do cung 9H chong tray xuoc manh, giu man hinh dep nhu moi sau thoi gian dai"');
  L.push('• [Loi ich 3]');
  L.push('• [Loi ich 4]');
  L.push('• [Loi ich 5 — toi da 7 diem, moi diem ngan 1 dong, manh lac, thiet thuc]');
  L.push('');
  L.push('[BAO HANH & CAM KET]');
  L.push('• San pham bao hanh: [thoi gian] — [dieu kien cu the]');
  L.push('• [Chinh sach doi tra, VD: "Doi tra trong 7 ngay neu loi san xuat"]');
  L.push('• [Neu khong co bao hanh: bo qua muc nay hoan toan]');
  L.push('└─────────────────────────────────────────────────────────────────┘');
  L.push('');
  L.push('QUY TAC VIET MO TA THU HUT — THEO CHUAN SHOPEE UNI:');
  L.push('  [+] Thong so lay tu 1688 chinh xac hon Taobao — uu tien dung neu co');
  L.push('  [+] "Uu diem noi bat": viet theo goc nhin NGUOI MUA, nhan vao KET QUA, TRAI NGHIEM');
  L.push('  [+] Moi diem dung "•", toi da 1-2 dong, don gian, de hieu');
  L.push('  [+] Neu co bao hanh: viet ro rang thoi gian va dieu kien');
  L.push('  [-] KHONG ghi: so dien thoai, link ngoai Shopee, dia chi cua hang');
  L.push('  [-] KHONG hua hen qua muc, KHONG tu them tinh nang khong co trong thong so goc');
  L.push('  [-] KHONG dung !!! hay "gia soc / re nhat / hang dau Viet Nam"');
  L.push('  [-] KHONG viet hoa ca doan, KHONG spam tu khoa');
  L.push('');
  L.push('━━━ PHAN 3: HASHTAG ━━━');
  L.push('Tao 3-5 hashtag thich hop nhat cho san pham nay.');
  L.push('Format: #tukhoakhongdau  (VD: #kinhcuongluc #oplung #phuKienIphone)');
  L.push('Chi lay hashtag that su lien quan — KHONG spam hashtag nganh hang khac.');
  L.push('');
  L.push('================================================================');
  L.push('SAU KHI CLAUDE TRA VE:');
  L.push('  1. Copy ten san pham → dan vao o "Ten san pham" tren Shopee Seller Center');
  L.push('  2. Copy mo ta → dan vao o "Mo ta san pham"');
  L.push('  3. Copy hashtag → dan vao o "Hashtag"');
  L.push('  4. Tai anh bang nut ben duoi truoc khi len listing');
  L.push('================================================================');

  return L.join('\n');
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
  setStatus('Dang trich xuat...'); copyBtn.disabled = true;
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
    copyBtn.disabled = false;
    if (currentData.price) showPrice(currentData.price);
    showImageStrip(currentData.images);
    const mc = currentData.images.length, dc = currentData.descImages.length;
    dlMainBtn.textContent = 'Anh chinh (' + mc + ')';
    dlDescBtn.textContent = 'Anh mo ta (' + dc + ')';
    dlAllBtn.textContent  = 'Tai tat ca (' + (mc+dc) + ')';
    dlMainBtn.disabled = !mc; dlDescBtn.disabled = !dc; dlAllBtn.disabled = !(mc+dc);
    dlSection.style.display = 'block'; setDlProgress('');
    const pi = currentData.price ? ' | ' + currentData.price.cnyStr + ' = ' + currentData.price.vndStr : '';
    setStatus('[' + currentData.platform.toUpperCase() + '] ' + currentData.specs.length + ' thong so | ' + mc + ' anh chinh | ' + dc + ' anh mo ta' + pi, 'ok');
  } catch(e) {
    setStatus('Loi: ' + e.message + ' — Thu reload trang roi bam lai.', 'err');
  }
});

copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(output.value); }
  catch { output.select(); document.execCommand('copy'); }
  setStatus('Da copy! Mo Claude va paste vao.', 'ok');
});
