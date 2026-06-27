const extractBtn  = document.getElementById('extractBtn');
const copyBtn     = document.getElementById('copyBtn');
const output      = document.getElementById('output');
const statusEl    = document.getElementById('status');
const dlSection   = document.getElementById('dlSection');
const dlMainBtn   = document.getElementById('dlMainBtn');
const dlDescBtn   = document.getElementById('dlDescBtn');
const dlAllBtn    = document.getElementById('dlAllBtn');
const dlProgress  = document.getElementById('dlProgress');
const imgStrip    = document.getElementById('imgStrip');
const priceBox    = document.getElementById('priceBox');

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

  // ─ HEADER ─
  L.push('=== NJOY PRODUCT IMPORT ===');
  L.push('Platform : ' + d.platform.toUpperCase());
  L.push('URL      : ' + d.url);
  L.push('');

  // ─ GIA ─
  if (d.price) {
    L.push('[ GIA ] ' + d.price.cnyStr + ' => ' + d.price.vndStr + ' (ty gia x4.100)');
    L.push('');
  }

  // ─ TIEU DE GOC ─
  L.push('[ TIEU DE GOC - ' + d.platform.toUpperCase() + ' ]');
  L.push(d.title || '(khong lay duoc)');
  L.push('');

  // ─ THONG SO ─
  if (d.specs.length > 0) {
    L.push('[ THONG SO KY THUAT' + (is1688 ? ' - 1688 / DO CHINH XAC CAO' : ' - TAOBAO') + ' ]');
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
    L.push('[ MO TA GOC (tham khao, KHONG copy nguyen) ]');
    L.push(d.desc);
    L.push('');
  }

  // ════════════════════════════════════════════════════════
  // PROMPT CHO CLAUDE — CHUAN SHOPEE UNI
  // Dua tren: banhang.shopee.vn/edu/article/2911
  // ════════════════════════════════════════════════════════
  L.push('================================================================');
  L.push('YEU CAU: Viet TEN SAN PHAM + MO TA + HASHTAG chuan Shopee');
  L.push('Nguon du lieu: ' + (is1688 ? '1688 (thong so chinh xac cao)' : 'Taobao'));
  L.push('================================================================');
  L.push('');

  // ─ PHAN 1: TEN ─
  L.push('━━━ PHAN 1: TEN SAN PHAM (toi da 120 ky tu) ━━━');
  L.push('');
  L.push('Quy tac bat buoc:');
  L.push('  • Khong viet HOA toan bo, khong spam !!!!, khong lap tu khoa');
  L.push('  • Khong chen: so dien thoai, link, ten shop, cam ket "gia re nhat"');
  L.push('  • Ten phai khop voi anh va thong so thuc te');
  L.push('  • Viet Title Case, tu nhien, de doc');
  L.push('');
  L.push('Goi y cong thuc (phu kien dien tu):');
  L.push('  [Uu diem chinh] + [Chat lieu/Chuan] + [Ten SP] + [Dong may tuong thich]');
  L.push('');
  L.push('Vi du ten dung chuan:');
  L.push('  -> Kinh Cuong Luc Tu Dan Chong Bui Thong Minh iPhone 17 16 15 14 13 12 11 Pro Max Plus');
  L.push('  -> Op Silicon Chong Ban Lot Nhung Co Sac Tu Tinh Bao Ve Camera iPhone 17 16 15 14 Pro Max');
  L.push('  -> Day Sac USB-C to USB-C 45W Sac Nhanh PD Cho iPhone 15 16 17 iPad MacBook');
  L.push('');

  // ─ PHAN 2: MO TA CHUAN SHOPEE ─
  L.push('━━━ PHAN 2: MO TA SAN PHAM CHUAN SHOPEE ━━━');
  L.push('');
  L.push('Shopee quy dinh mo ta can co du 3 phan (banhang.shopee.vn/edu/article/2911):');
  L.push('  (1) Thong so ky thuat — chat lieu, trong luong, kich thuoc, cac dac tinh');
  L.push('  (2) Cong dung va loi ich — tinh nang, loi ich, huong dan su dung');
  L.push('  (3) Bao hanh — thoi gian, dieu kien, chinh sach doi tra (neu co)');
  L.push('');
  L.push('Viet bang tieng Viet, ro rang, khong dich may, khong sao chep tieng Trung.');
  L.push('Moi diem dung dau "•". Khong ghi so dien thoai, link ngoai Shopee, dia chi shop.');
  L.push('');
  L.push('===== BAT DAU MO TA =====');
  L.push('');
  L.push('--- THONG SO KY THUAT ---');
  L.push('• Ten san pham: [ten day du, chinh xac]');
  L.push('• Thuong hieu: [neu co, ghi ro]');
  L.push('• Chat lieu: [VD: kinh cuong luc 9H, day 0.26mm, trong suot 99.9%]');
  L.push('• Kich thuoc / Trong luong: [lay tu thong so goc neu co]');
  L.push('• Tuong thich: [liet ke cu the cac dong may, VD: iPhone 11/12/13/14/15/16/17 tat ca phien ban]');
  L.push('• Xuat xu: [neu biet]');
  L.push('• Bo san pham bao gom: [liet ke thu gi kem theo]');
  L.push('[Them cac thong so quan trong khac tu phan THONG SO KY THUAT o tren]');
  L.push('');
  L.push('--- CONG DUNG VA LOI ICH ---');
  L.push('• [Loi ich 1 — viet theo KET QUA nguoi dung nhan duoc, khong chi mo ta chat lieu]');
  L.push('  Vi du SAI: "Chat lieu silicon cao cap"');
  L.push('  Vi du DUNG: "Chat lieu silicon cao cap, cam tay em ai, chong tron truot, bao ve dien thoai toan dien"');
  L.push('• [Loi ich 2]');
  L.push('• [Loi ich 3]');
  L.push('• [Loi ich 4]');
  L.push('• [Loi ich 5 — toi da 7 diem, moi diem ngan gon, thiet thuc]');
  L.push('');
  L.push('--- BAO HANH VA CAM KET ---');
  L.push('• Bao hanh: [X thang/nam] — [dieu kien cu the, VD: loi san xuat, khong tinh hu hong do nguoi dung]');
  L.push('• Chinh sach doi tra: [VD: doi trong 7 ngay neu loi san xuat]');
  L.push('[Neu khong co bao hanh: bo qua phan nay]');
  L.push('');
  L.push('===== KET THUC MO TA =====');
  L.push('');
  L.push('Luu y quan trong:');
  L.push('  [+] Thong so 1688 chinh xac hon Taobao — uu tien neu co ca hai nguon');
  L.push('  [-] KHONG hua hen qua muc, KHONG them tinh nang khong co trong thong so goc');
  L.push('  [-] KHONG viet !!! hay "gia soc / re nhat / hang dau Viet Nam"');
  L.push('  [-] KHONG spam tu khoa, KHONG viet hoa ca doan');
  L.push('');

  // ─ PHAN 3: HASHTAG ─
  L.push('━━━ PHAN 3: HASHTAG (3-5 hashtag thich hop nhat) ━━━');
  L.push('');
  L.push('Format: #tukhoakhongdau (VD: #kinhcuongluc #oplung #phuKienIphone)');
  L.push('Chi lay hashtag that su lien quan — KHONG spam hashtag nganh hang khac.');
  L.push('');
  L.push('================================================================');
  L.push('SAU KHI CLAUDE TRA VE:');
  L.push('  1. Copy ten san pham -> dan vao o "Ten san pham" tren Shopee Seller Center');
  L.push('  2. Copy mo ta -> dan vao o "Mo ta san pham"');
  L.push('  3. Copy hashtag -> dan vao o "Hashtag"');
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
