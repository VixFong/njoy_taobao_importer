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

let currentData = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function setStatus(msg, type = '') {
  statusEl.textContent = msg;
  statusEl.className = type;
}

function setDlProgress(msg, type = '') {
  dlProgress.textContent = msg;
  dlProgress.className = type;
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function formatOutput(d) {
  const lines = [];
  lines.push('=== NJOY PRODUCT IMPORT ===');
  lines.push(`Platform : ${d.platform.toUpperCase()}`);
  lines.push(`URL      : ${d.url}`);
  lines.push('');

  lines.push('── TIÊU ĐỀ GỐC ──');
  lines.push(d.title || '(không lấy được)');
  lines.push('');

  if (d.specs.length > 0) {
    lines.push('── THÔNG SỐ KỸ THUẬT ──');
    d.specs.forEach(s => lines.push('• ' + s));
    lines.push('');
  }

  if (d.variants.length > 0) {
    lines.push('── VARIANTS (màu / model) ──');
    d.variants.forEach(v => lines.push('• ' + v));
    lines.push('');
  }

  if (d.images.length > 0) {
    lines.push(`── ẢNH CHÍNH (${d.images.length} ảnh) ──`);
    d.images.forEach((url, i) => lines.push(`${String(i+1).padStart(2,'0')}. ${url}`));
    lines.push('');
  }

  if (d.descImages.length > 0) {
    lines.push(`── ẢNH MÔ TẢ (${d.descImages.length} ảnh) ──`);
    d.descImages.forEach((url, i) => lines.push(`${String(i+1).padStart(2,'0')}. ${url}`));
    lines.push('');
  }

  if (d.desc) {
    lines.push('── MÔ TẢ (text) ──');
    lines.push(d.desc);
    lines.push('');
  }

  lines.push('=== Paste toàn bộ vào Claude để tạo listing NJoy ===');
  return lines.join('\n');
}

// ── Image preview strip ───────────────────────────────────────────────────────

function showImageStrip(images) {
  imgStrip.innerHTML = '';
  if (images.length === 0) { imgStrip.style.display = 'none'; return; }
  imgStrip.style.display = 'flex';
  images.slice(0, 9).forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.title = url;
    imgStrip.appendChild(img);
  });
}

// ── Download ──────────────────────────────────────────────────────────────────

function getExt(url) {
  return (url.match(/\.(jpg|jpeg|png|webp)$/i) || ['', 'jpg'])[1].toLowerCase();
}

async function downloadBatch(images, prefix, progressCb) {
  let ok = 0;
  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    const ext = getExt(url);
    const num = String(i + 1).padStart(2, '0');
    const filename = `njoy-import/${prefix}_${num}.${ext}`;

    progressCb(i + 1, images.length);

    try {
      await new Promise((resolve, reject) => {
        chrome.downloads.download(
          { url, filename, conflictAction: 'overwrite' },
          (id) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(id);
          }
        );
      });
      ok++;
    } catch (e) {
      console.warn('Download failed:', url, e.message);
    }

    // Stagger downloads so Chrome doesn't throttle/prompt per file
    await delay(350);
  }
  return ok;
}

function setDownloadButtons(disabled) {
  dlMainBtn.disabled = disabled;
  dlDescBtn.disabled = disabled;
  dlAllBtn.disabled  = disabled;
}

dlMainBtn.addEventListener('click', async () => {
  if (!currentData?.images?.length) return;
  setDownloadButtons(true);
  setDlProgress('Đang tải ảnh chính...');
  const ok = await downloadBatch(
    currentData.images,
    'main',
    (i, n) => setDlProgress(`Ảnh chính ${i}/${n}...`)
  );
  setDlProgress(`✅ Đã tải ${ok} ảnh chính → Downloads/njoy-import/`, 'ok');
  setDownloadButtons(false);
});

dlDescBtn.addEventListener('click', async () => {
  if (!currentData?.descImages?.length) return;
  setDownloadButtons(true);
  setDlProgress('Đang tải ảnh mô tả...');
  const ok = await downloadBatch(
    currentData.descImages,
    'desc',
    (i, n) => setDlProgress(`Ảnh mô tả ${i}/${n}...`)
  );
  setDlProgress(`✅ Đã tải ${ok} ảnh mô tả → Downloads/njoy-import/`, 'ok');
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
    const ext = getExt(url);
    const filename = `njoy-import/${prefix}_${String(idx).padStart(2,'0')}.${ext}`;
    setDlProgress(`Đang tải ${++done}/${all.length} (${prefix}_${String(idx).padStart(2,'0')})...`);
    try {
      await new Promise((resolve, reject) => {
        chrome.downloads.download(
          { url, filename, conflictAction: 'overwrite' },
          (id) => { if (chrome.runtime.lastError) reject(chrome.runtime.lastError); else resolve(id); }
        );
      });
    } catch (e) { console.warn('skip:', url); }
    await delay(350);
  }
  setDlProgress(`✅ Xong! ${done} ảnh → Downloads/njoy-import/`, 'ok');
  setDownloadButtons(false);
});

// ── Extraction ────────────────────────────────────────────────────────────────

extractBtn.addEventListener('click', async () => {
  setStatus('Đang trích xuất...');
  copyBtn.disabled = true;
  output.value = '';
  dlSection.style.display = 'none';
  imgStrip.style.display = 'none';

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    setStatus('Không lấy được tab hiện tại.', 'err'); return;
  }

  const url = tab.url || '';
  if (!url.includes('taobao.com') && !url.includes('1688.com') && !url.includes('tmall.com')) {
    setStatus('⚠ Chỉ hoạt động trên taobao.com / 1688.com / tmall.com', 'err'); return;
  }

  // Re-inject content script in case it's a freshly installed extension
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  } catch { /* already injected */ }

  try {
    const resp = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
    if (!resp?.ok) throw new Error(resp?.error || 'Không nhận được dữ liệu');

    currentData = resp.data;
    output.value = formatOutput(currentData);
    copyBtn.disabled = false;

    // Show image preview strip (main images)
    showImageStrip(currentData.images);

    // Show download section
    const mainCount = currentData.images.length;
    const descCount = currentData.descImages.length;
    dlMainBtn.textContent = `Ảnh chính (${mainCount})`;
    dlDescBtn.textContent = `Ảnh mô tả (${descCount})`;
    dlAllBtn.textContent  = `Tải tất cả (${mainCount + descCount})`;
    dlMainBtn.disabled = mainCount === 0;
    dlDescBtn.disabled = descCount === 0;
    dlAllBtn.disabled  = mainCount + descCount === 0;
    dlSection.style.display = 'block';
    setDlProgress('');

    setStatus(
      `✅ ${currentData.specs.length} thông số · ${mainCount} ảnh chính · ${descCount} ảnh mô tả`,
      'ok'
    );
  } catch (e) {
    setStatus('Lỗi: ' + e.message + ' — Thử reload trang rồi bấm lại.', 'err');
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(output.value);
  } catch {
    output.select();
    document.execCommand('copy');
  }
  setStatus('✅ Đã copy! Mở Claude và paste vào.', 'ok');
});
