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

// ── Price display ─────────────────────────────────────────────────────────────

function showPrice(price) {
    if (!price || !priceBox) return;
    priceBox.style.display = 'flex';
    document.getElementById('priceCNY').textContent = price.cnyStr;
    document.getElementById('priceVND').textContent = price.vndStr;
}

function hidePrice() {
    if (priceBox) priceBox.style.display = 'none';
}

// ── Output formatter ──────────────────────────────────────────────────────────

function formatOutput(d) {
    const lines = [];
    lines.push('=== NJOY PRODUCT IMPORT ===');
    lines.push(`Platform : ${d.platform.toUpperCase()}`);
    lines.push(`URL      : ${d.url}`);
    lines.push('');

  // Price block
  if (d.price) {
        lines.push('\u2500\u2500 GI\xC1 S\u1EA2N PH\u1EA8M \u2500\u2500');
        lines.push(`Gi\xE1 T\u1EC7  : ${d.price.cnyStr}`);
        lines.push(`Gi\xE1 VND : ${d.price.vndStr}  (t\u1EC7 x 4.100)`);
        lines.push('');
  }

  lines.push('\u2500\u2500 TI\xCAU \u0110\u1EC0 G\u1ED0C \u2500\u2500');
    lines.push(d.title || '(kh\xF4ng l\u1EA5y \u0111\u01B0\u1EE3c)');
    lines.push('');

  if (d.specs.length > 0) {
        lines.push('\u2500\u2500 TH\xD4NG S\u1ED0 K\u1EF8 THU\u1EAET \u2500\u2500');
        d.specs.forEach(s => lines.push('\u2022 ' + s));
        lines.push('');
  }

  if (d.variants.length > 0) {
        lines.push('\u2500\u2500 VARIANTS (m\xE0u / model) \u2500\u2500');
        d.variants.forEach(v => lines.push('\u2022 ' + v));
        lines.push('');
  }

  if (d.images.length > 0) {
        lines.push(`\u2500\u2500 \u1EA2NH CH\xCDNH (${d.images.length} \u1EA3nh) \u2500\u2500`);
        d.images.forEach((url, i) => lines.push(`${String(i+1).padStart(2,'0')}. ${url}`));
        lines.push('');
  }

  if (d.descImages.length > 0) {
        lines.push(`\u2500\u2500 \u1EA2NH M\xD4 T\u1EA2 (${d.descImages.length} \u1EA3nh) \u2500\u2500`);
        d.descImages.forEach((url, i) => lines.push(`${String(i+1).padStart(2,'0')}. ${url}`));
        lines.push('');
  }

  if (d.desc) {
        lines.push('\u2500\u2500 M\xD4 T\u1EA2 (text) \u2500\u2500');
        lines.push(d.desc);
        lines.push('');
  }

  lines.push('=== Paste to\xE0n b\u1ED9 v\xE0o Claude \u0111\u1EC3 t\u1EA1o listing NJoy ===');
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
    setDlProgress('Dang tai anh chinh...');
    const ok = await downloadBatch(
          currentData.images,
          'main',
          (i, n) => setDlProgress(`Anh chinh ${i}/${n}...`)
        );
    setDlProgress(`Da tai ${ok} anh chinh -> Downloads/njoy-import/`, 'ok');
    setDownloadButtons(false);
});

dlDescBtn.addEventListener('click', async () => {
    if (!currentData?.descImages?.length) return;
    setDownloadButtons(true);
    setDlProgress('Dang tai anh mo ta...');
    const ok = await downloadBatch(
          currentData.descImages,
          'desc',
          (i, n) => setDlProgress(`Anh mo ta ${i}/${n}...`)
        );
    setDlProgress(`Da tai ${ok} anh mo ta -> Downloads/njoy-import/`, 'ok');
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
          setDlProgress(`Dang tai ${++done}/${all.length} (${prefix}_${String(idx).padStart(2,'0')})...`);
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
    setDlProgress(`Xong! ${done} anh -> Downloads/njoy-import/`, 'ok');
    setDownloadButtons(false);
});

// ── Extraction ────────────────────────────────────────────────────────────────

extractBtn.addEventListener('click', async () => {
    setStatus('Dang trich xuat...');
    copyBtn.disabled = true;
    output.value = '';
    dlSection.style.display = 'none';
    imgStrip.style.display  = 'none';
    hidePrice();

                              let tab;
    try {
          [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    } catch {
          setStatus('Khong lay duoc tab hien tai.', 'err'); return;
    }

                              const url = tab.url || '';
    if (!url.includes('taobao.com') && !url.includes('1688.com') && !url.includes('tmall.com')) {
          setStatus('Chi hoat dong tren taobao.com / 1688.com / tmall.com', 'err'); return;
    }

                              try {
                                    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
                              } catch { /* already injected */ }

                              try {
                                    const resp = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
                                    if (!resp?.ok) throw new Error(resp?.error || 'Khong nhan duoc du lieu');

      currentData = resp.data;
                                    output.value = formatOutput(currentData);
                                    copyBtn.disabled = false;

      // Show price box
      if (currentData.price) showPrice(currentData.price);

      // Show image preview strip
      showImageStrip(currentData.images);

      // Show download section
      const mainCount = currentData.images.length;
                                    const descCount = currentData.descImages.length;
                                    dlMainBtn.textContent = `Anh chinh (${mainCount})`;
                                    dlDescBtn.textContent = `Anh mo ta (${descCount})`;
                                    dlAllBtn.textContent  = `Tai tat ca (${mainCount + descCount})`;
                                    dlMainBtn.disabled = mainCount === 0;
                                    dlDescBtn.disabled = descCount === 0;
                                    dlAllBtn.disabled  = mainCount + descCount === 0;
                                    dlSection.style.display = 'block';
                                    setDlProgress('');

      const priceInfo = currentData.price
                                      ? ` · ${currentData.price.cnyStr} = ${currentData.price.vndStr}`
              : '';
                                    setStatus(
                                            `OK: ${currentData.specs.length} thong so · ${mainCount} anh chinh · ${descCount} anh mo ta${priceInfo}`,
                                            'ok'
                                          );
                              } catch (e) {
                                    setStatus('Loi: ' + e.message + ' - Thu reload trang roi bam lai.', 'err');
                              }
});

copyBtn.addEventListener('click', async () => {
    try {
          await navigator.clipboard.writeText(output.value);
    } catch {
          output.select();
          document.execCommand('copy');
    }
    setStatus('Da copy! Mo Claude va paste vao.', 'ok');
});
