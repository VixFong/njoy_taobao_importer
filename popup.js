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

// ── Helpers ──────────────────────────────────────────────────────────────────
function setStatus(msg, type = '') { statusEl.textContent = msg; statusEl.className = type; }
function setDlProgress(msg, type = '') { dlProgress.textContent = msg; dlProgress.className = type; }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Price display ─────────────────────────────────────────────────────────────
function showPrice(price) {
  if (!price || !priceBox) return;
  priceBox.style.display = 'flex';
  document.getElementById('priceCNY').textContent = price.cnyStr;
  document.getElementById('priceVND').textContent = price.vndStr;
}
function hidePrice() { if (priceBox) priceBox.style.display = 'none'; }

// ── Output formatter ──────────────────────────────────────────────────────────
function formatOutput(d) {
  const lines = [];
  const is1688 = d.platform === '1688';

  lines.push('=== NJOY PRODUCT IMPORT ===');
  lines.push('Platform : ' + d.platform.toUpperCase() + (is1688 ? '  ★ Uu tien du lieu nay — thong so chinh xac hon' : ''));
  lines.push('URL      : ' + d.url);
  lines.push('');

  if (d.price) {
    lines.push('── GIA SAN PHAM ──');
    lines.push('Gia Te : ' + d.price.cnyStr + '  |  Gia VND : ' + d.price.vndStr + ' (te x 4.100)');
    lines.push('');
  }

  lines.push('── TIEU DE GOC ──');
  lines.push(d.title || '(khong lay duoc)');
  lines.push('');

  if (d.specs.length > 0) {
    lines.push('── THONG SO KY THUAT' + (is1688 ? ' [1688 — do chinh xac cao]' : ' [Taobao]') + ' ──');
    d.specs.forEach(s => lines.push('• ' + s));
    lines.push('');
  }

  if (d.variants.length > 0) {
    lines.push('── VARIANTS (mau / size / model) ──');
    d.variants.forEach(v => lines.push('• ' + v));
    lines.push('');
  }

  if (d.images.length > 0) {
    lines.push('── ANH CHINH (' + d.images.length + ' anh) ──');
    d.images.forEach((url, i) => lines.push(String(i+1).padStart(2,'0') + '. ' + url));
    lines.push('');
  }

  if (d.descImages.length > 0) {
    lines.push('── ANH MO TA (' + d.descImages.length + ' anh) ──');
    d.descImages.forEach((url, i) => lines.push(String(i+1).padStart(2,'0') + '. ' + url));
    lines.push('');
  }

  if (d.desc) {
    lines.push('── MO TA GOC (text) ──');
    lines.push(d.desc);
    lines.push('');
  }

  // ══ PROMPT CHO CLAUDE ══
  lines.push('════════════════════════════════════════════════════════════════');
  lines.push('NHIEM VU: Tao ten san pham + mo ta chuan Shopee, thu hut mua sam');
  lines.push('════════════════════════════════════════════════════════════════');
  lines.push('');

  lines.push('Nguon du lieu: ' + d.platform.toUpperCase() + (is1688 ? ' — thong so ky thuat tu 1688 thuong chinh xac va day du hon Taobao.' : ' — kiem tra lai thong so ky thuat neu co the.'));
  lines.push('');

  // ─ PHAN 1: TEN SAN PHAM ─
  lines.push('━━━━ PHAN 1: TEN SAN PHAM CHUAN SEO SHOPEE ━━━━');
  lines.push('');
  lines.push('Yeu cau bat buoc:');
  lines.push('  • Toi da 120 ky tu (Shopee cat bo neu qua dai)');
  lines.push('  • Khong dung: VIET HOA TOAN BO, !!!!!, spam tu khoa lap lai');
  lines.push('  • Khong chen: so dien thoai, link, ten shop, cam ket gia re');
  lines.push('  • Bat buoc phu hop voi anh + thong so (Shopee co the phat neu sai)');
  lines.push('');
  lines.push('Cong thuc toi uu cho phu kien dien tu (ap dung lien quan):');
  lines.push('  [Tinh nang noi bat] + [Chat lieu / Tieu chuan] + [Ten san pham] + [Dong may tuong thich]');
  lines.push('');
  lines.push('Quy tac viet ten SEO tot:');
  lines.push('  ✓ Dat tu khoa nguoi mua hay tim truoc (VD: "Chong Soc", "Khong Vang", "Sieu Mong")');
  lines.push('  ✓ Liet ke du dong may: "iPhone 17 16 15 14 13 Pro Max Plus" — moi dong = 1 cu phap tim kiem');
  lines.push('  ✓ Co the them 1 tag mo ta cuoi (VD: "- Chinh Hang", "- 9H", "- Mong 0.26mm")');
  lines.push('  ✓ Viet hoa dau chu moi tu (Title Case), tu nhien nhu ten san pham that');
  lines.push('  ✓ Neu co thuong hieu (VD: Anank, Kuzoom, WK) — giu nguyen trong ten');
  lines.push('  ✗ Khong dung "-", "/", "+" lien tuc; khong spam: "tot nhat gia re hang dau"');
  lines.push('');
  lines.push('Vi du ten dung chuan Shopee (phu kien Apple):');
  lines.push('  → "Kinh Cuong Luc Tu Dan Chong Bui Thong Minh iPhone 17 16 15 14 13 12 Pro Max Plus"');
  lines.push('  → "Op Silicon Chong Ban Lot Nhung Co Sac Tu Tinh Bao Ve Camera iPhone 17 16 15 14 Pro Max"');
  lines.push('  → "Cuong Luc Camera Kuzoom AR Chong Tray Sieu Net iPhone 17 16 15 14 13 Pro Max Plus"');
  lines.push('  → "Day Sac USB-C to USB-C 45W Sac Nhanh Ho Tro PD Cho iPhone iPad MacBook"');
  lines.push('');

  // ─ PHAN 2: MO TA SAN PHAM ─
  lines.push('━━━━ PHAN 2: MO TA SAN PHAM CHUAN SHOPEE ━━━━');
  lines.push('');
  lines.push('Shopee Uni quy dinh mo ta phai co du 3 yeu to:');
  lines.push('  (1) Thong so ky thuat cu the (chat lieu, trong luong, kich thuoc, do cung...)');
  lines.push('  (2) Cong dung va loi ich thuc te (giai thich tinh nang giup gi cho nguoi dung)');
  lines.push('  (3) Bao hanh neu co / cam ket chat luong');
  lines.push('');
  lines.push('Viet theo cau truc nay — KHONG copy nguyen xi tu tieng Trung, KHONG dich may:');
  lines.push('');
  lines.push('--- CUT HERE ---');
  lines.push('THONG TIN SAN PHAM');
  lines.push('• Ten: [ten day du, khop voi ten listing]');
  lines.push('• Chat lieu: [cu the, VD: "Kinh cuong luc cao cap, do cung 9H, day 0.26mm"]');
  lines.push('• [Them cac thong so quan trong khac tu phan THONG SO KY THUAT o tren]');
  lines.push('• Tuong thich: [liet ke day du dong may, VD: "iPhone 11 / 12 / 13 / 14 / 15 / 16 / 17 series"]');
  lines.push('');
  lines.push('LOI ICH NOI BAT');
  lines.push('• [Loi ich 1 — viet tu goc nhin nguoi dung: "Giup ban...", "Bao ve...", "De dang..."]');
  lines.push('• [Loi ich 2]');
  lines.push('• [Loi ich 3]');
  lines.push('• [Loi ich 4]');
  lines.push('• [Loi ich 5 — toi da 7 diem, moi diem 1 dong, ngan gon manh lac]');
  lines.push('');
  lines.push('BAO HANH & CAM KET');
  lines.push('• [Chinh sach bao hanh neu co, VD: "Bao hanh 1 nam loi san xuat"]');
  lines.push('• [Cam ket chat luong / doi tra neu hang loi]');
  lines.push('--- CUT HERE ---');
  lines.push('');
  lines.push('Quy tac viet mo ta thu hut:');
  lines.push('  ✓ Dung "•" hoac "-" dau dong, moi diem toi da 1 dong');
  lines.push('  ✓ LOI ICH: nhan manh ket qua nguoi dung nhan duoc, khong chi liet ke tinh nang');
  lines.push('     Sai: "Chat lieu silicon cao cap"  →  Dung: "Chat lieu silicon cao cap, cam em tay, han che tron truot"');
  lines.push('     Sai: "Kinh cuong luc 9H"          →  Dung: "Do cung 9H chong tray xuoc manh, giu man hinh dep nhu moi"');
  lines.push('  ✓ Thong so 1688 chinh xac hon → uu tien dung neu co');
  lines.push('  ✓ Giu nguyen thong so ky thuat (do day, do cung, kich thuoc) — KHONG tu them');
  lines.push('  ✓ Neu san pham co bao hanh: viet ro thoi gian va dieu kien');
  lines.push('  ✗ KHONG ghi: so dien thoai, link ngoai Shopee, dia chi cua hang');
  lines.push('  ✗ KHONG viet hoa ca doan, KHONG dung !!! hay "gia soc gia re nhat"');
  lines.push('  ✗ KHONG hua hon qua muc hoac tu them cong dung khong co trong thong so');
  lines.push('');

  lines.push('━━━━ HASHTAG GOI Y (paste vao o Hashtag tren Shopee) ━━━━');
  lines.push('Tao 3-5 hashtag lien quan nhat den san pham nay.');
  lines.push('Dung #, khong dau cach, viet khong dau, VD: #kinhcuongluc #phuKienIPhone #oplung');
  lines.push('');
  lines.push('════════════════════════════════════════════════════════════════');
  lines.push('SAU KHI CLAUDE TRA VE → copy ten + mo ta vao Shopee Seller Center');
  lines.push('Tai anh bang nut ben duoi truoc khi len listing');
  lines.push('════════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

// ── Image preview strip ───────────────────────────────────────────────────────
function showImageStrip(images) {
  imgStrip.innerHTML = '';
  if (images.length === 0) { imgStrip.style.display = 'none'; return; }
  imgStrip.style.display = 'flex';
  images.slice(0, 9).forEach(url => {
    const img = document.createElement('img');
    img.src = url; img.title = url;
    imgStrip.appendChild(img);
  });
}

// ── Download ──────────────────────────────────────────────────────────────────
function getExt(url) { return (url.match(/\.(jpg|jpeg|png|webp)$/i) || ['', 'jpg'])[1].toLowerCase(); }

async function downloadBatch(images, prefix, progressCb) {
  let ok = 0;
  for (let i = 0; i < images.length; i++) {
    const url = images[i], ext = getExt(url), num = String(i + 1).padStart(2, '0');
    progressCb(i + 1, images.length);
    try {
      await new Promise((resolve, reject) => {
        chrome.downloads.download({ url, filename: 'njoy-import/' + prefix + '_' + num + '.' + ext, conflictAction: 'overwrite' },
          id => { if (chrome.runtime.lastError) reject(chrome.runtime.lastError); else resolve(id); });
      });
      ok++;
    } catch (e) { console.warn('Download failed:', url, e.message); }
    await delay(350);
  }
  return ok;
}

function setDownloadButtons(disabled) { dlMainBtn.disabled = disabled; dlDescBtn.disabled = disabled; dlAllBtn.disabled = disabled; }

dlMainBtn.addEventListener('click', async () => {
  if (!currentData?.images?.length) return;
  setDownloadButtons(true); setDlProgress('Dang tai anh chinh...');
  const ok = await downloadBatch(currentData.images, 'main', (i, n) => setDlProgress('Anh chinh ' + i + '/' + n + '...'));
  setDlProgress('Da tai ' + ok + ' anh chinh -> Downloads/njoy-import/', 'ok');
  setDownloadButtons(false);
});

dlDescBtn.addEventListener('click', async () => {
  if (!currentData?.descImages?.length) return;
  setDownloadButtons(true); setDlProgress('Dang tai anh mo ta...');
  const ok = await downloadBatch(currentData.descImages, 'desc', (i, n) => setDlProgress('Anh mo ta ' + i + '/' + n + '...'));
  setDlProgress('Da tai ' + ok + ' anh mo ta -> Downloads/njoy-import/', 'ok');
  setDownloadButtons(false);
});

dlAllBtn.addEventListener('click', async () => {
  if (!currentData) return;
  setDownloadButtons(true);
  const all = [
    ...currentData.images.map((u, i) => ({ url: u, prefix: 'main', idx: i + 1 })),
    ...currentData.descImages.map((u, i) => ({ url: u, prefix: 'desc', idx: i + 1 }))
  ];
  let done = 0;
  for (const { url, prefix, idx } of all) {
    const ext = getExt(url), filename = 'njoy-import/' + prefix + '_' + String(idx).padStart(2,'0') + '.' + ext;
    setDlProgress('Dang tai ' + (++done) + '/' + all.length + '...');
    try {
      await new Promise((resolve, reject) => {
        chrome.downloads.download({ url, filename, conflictAction: 'overwrite' },
          id => { if (chrome.runtime.lastError) reject(chrome.runtime.lastError); else resolve(id); });
      });
    } catch (e) { console.warn('skip:', url); }
    await delay(350);
  }
  setDlProgress('Xong! ' + done + ' anh -> Downloads/njoy-import/', 'ok');
  setDownloadButtons(false);
});

// ── Extraction ────────────────────────────────────────────────────────────────
extractBtn.addEventListener('click', async () => {
  setStatus('Dang trich xuat...'); copyBtn.disabled = true; output.value = '';
  dlSection.style.display = 'none'; imgStrip.style.display = 'none'; hidePrice();
  let tab;
  try { [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); }
  catch { setStatus('Khong lay duoc tab hien tai.', 'err'); return; }
  const url = tab.url || '';
  if (!url.includes('taobao.com') && !url.includes('1688.com') && !url.includes('tmall.com')) {
    setStatus('Chi hoat dong tren taobao.com / 1688.com / tmall.com', 'err'); return;
  }
  try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }); } catch { /* injected */ }
  try {
    const resp = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
    if (!resp?.ok) throw new Error(resp?.error || 'Khong nhan duoc du lieu');
    currentData = resp.data;
    output.value = formatOutput(currentData);
    copyBtn.disabled = false;
    if (currentData.price) showPrice(currentData.price);
    showImageStrip(currentData.images);
    const mainCount = currentData.images.length, descCount = currentData.descImages.length;
    dlMainBtn.textContent = 'Anh chinh (' + mainCount + ')';
    dlDescBtn.textContent = 'Anh mo ta (' + descCount + ')';
    dlAllBtn.textContent  = 'Tai tat ca (' + (mainCount + descCount) + ')';
    dlMainBtn.disabled = mainCount === 0; dlDescBtn.disabled = descCount === 0; dlAllBtn.disabled = mainCount + descCount === 0;
    dlSection.style.display = 'block'; setDlProgress('');
    const priceInfo = currentData.price ? ' · ' + currentData.price.cnyStr + ' = ' + currentData.price.vndStr : '';
    setStatus('OK [' + currentData.platform.toUpperCase() + ']: ' + currentData.specs.length + ' thong so · ' + mainCount + ' anh chinh · ' + descCount + ' anh mo ta' + priceInfo, 'ok');
  } catch (e) {
    setStatus('Loi: ' + e.message + ' - Thu reload trang roi bam lai.', 'err');
  }
});

copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(output.value); }
  catch { output.select(); document.execCommand('copy'); }
  setStatus('Da copy! Mo Claude va paste vao.', 'ok');
});
