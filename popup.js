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

  // ── HEADER ──
  lines.push('=== NJOY PRODUCT IMPORT ===');
      lines.push(`Platform : ${d.platform.toUpperCase()}`);
      lines.push(`URL      : ${d.url}`);
      lines.push('');

  // ── GIA ──
  if (d.price) {
          lines.push('\u2500\u2500 GI\xC1 S\u1EA2N PH\u1EA8M \u2500\u2500');
          lines.push(`Gi\xE1 T\u1EC7 : ${d.price.cnyStr}`);
          lines.push(`Gi\xE1 VND : ${d.price.vndStr} (t\u1EC7 x 4.100)`);
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
          lines.push('\u2500\u2500 M\xD4 T\u1EA2 (text g\u1ED1c) \u2500\u2500');
          lines.push(d.desc);
          lines.push('');
  }

  // ── PROMPT CHO CLAUDE ──
  lines.push('════════════════════════════════════════════════════════');
      lines.push('PROMPT CHO CLAUDE \u2014 Copy to\xE0n b\u1ED9 v\xE0 paste v\xE0o Claude');
      lines.push('════════════════════════════════════════════════════════');
      lines.push('');
      lines.push('B\u1EA1n l\xE0 chuy\xEAn gia vi\u1EBFt n\u1ED9i dung b\xE1n h\xE0ng Shopee cho shop ph\u1EE5 ki\u1EC7n Apple cao c\u1EA5p NJoy.');
      lines.push('D\u1EF1a v\xE0o d\u1EEF li\u1EC7u s\u1EA3n ph\u1EA9m b\xEAn tr\xEAn, h\xE3y t\u1EA1o:');
      lines.push('');
      lines.push('━━━ 1. T\xCAU \u0110\u1EC0 S\u1EA2N PH\u1EA8M CHU\u1EA8N SEO (t\u1ED1i \u0111a 120 k\xFD t\u1EF1) ━━━');
      lines.push('');
      lines.push('C\xF4ng th\u1EE9c: [T\xEDnh n\u0103ng n\u1ED5i b\u1EADt] + [Th\u01B0\u01A1ng hi\u1EC7u / ch\u1EA5t li\u1EC7u] + [D\xF2ng m\xE1y \u0111\u1EA7y \u0111\u1EE7] + [Lo\u1EA1i s\u1EA3n ph\u1EA9m]');
      lines.push('');
      lines.push('Quy t\u1EAFc vi\u1EBFt t\xEAn \u0111\xFAng chu\u1EA9n NJoy:');
      lines.push('  \u2022 B\u1EAFt \u0111\u1EA7u b\u1EB1ng t\xEDnh n\u0103ng m\u1EA1nh nh\u1EA5t (VD: "Ch\u1ED1ng Trộm", "T\u1EF1 D\xE1n", "Trong Su\u1ED1t", "L\xF3t Nhung")');
      lines.push('  \u2022 Li\u1EC7t k\xEA \u0111\u1EE7 d\xF2ng m\xE1y t\u01B0\u01A1ng th\xEDch \u0111\u1EC3 SEO t\u1ED1t (VD: "iPhone 17 16 15 14 13 Pro Max Plus")');
      lines.push('  \u2022 C\xF3 th\u1EC3 d\xF9ng th\xEAm tags ph\u1EE5 \u1EDF cu\u1ED1i (VD: "- Trong Su\u1ED1t 9H", "- Chính H\xE3ng NJoy")');
      lines.push('  \u2022 KH\xD4NG vi\u1EBFt hoa to\xE0n b\u1ED9, KH\xD4NG spam t\u1EEB kh\xF3a l\u1EB7p l\u1EA1i');
      lines.push('  \u2022 T\u1ED1i \u0111a 120 k\xFD t\u1EF1, vi\u1EBFt t\u1EF1 nhi\xEAn nh\u01B0 n\xF3i chuy\u1EC7n');
      lines.push('');
      lines.push('V\xED d\u1EE5 \u0111\u1EE7ng style NJoy:');
      lines.push('  \u2714 K\xEDnh C\u01B0\u1EDDng L\u1EF1c Khung T\u1EF1 D\xE1n Ch\u1ED1ng B\u1EE5i Th\xF4ng Minh Cho \u0110i\u1EC7n Tho\u1EA1i iPhone 17 16 Pro Max 15 14 13 12 11');
      lines.push('  \u2714 \u1EE4p Silicon Ch\u1ED1ng B\u1EA9n L\xF3t Nhung C\xF3 S\u1EA1c T\u1EEB T\xEDnh B\u1EA3o V\u1EC7 Camera iPhone 17 16 15 14 Pro Max Plus');
      lines.push('  \u2714 C\u01B0\u1EDDng L\u1EF1c Anank Ch\u1ED1ng Nh\xECn Tr\u1ED9m Trong Su\u1ED1t 2.5D Si\xEAu M\u1ECFng iPhone 17 16 15 Pro Max');
      lines.push('');
      lines.push('━━━ 2. M\xD4 T\u1EA2 S\u1EA2N PH\u1EA8M CHU\u1EA8N SHOPEE (theo style NJoy) ━━━');
      lines.push('');
      lines.push('Vi\u1EBFt theo \u0111\xFAng c\u1EA5u tr\xFAc n\xE0y, gi\u1EEFng v\u0103n t\u1EF1 nhi\xEAn, thu h\xFAt, KH\xD4NG d\u1ECBch m\xE1y:');
      lines.push('');
      lines.push('TH\xD4NG TIN');
      lines.push('- T\xEAn s\u1EA3n ph\u1EA9m: [t\xEAn \u0111\u1EA7y \u0111\u1EE7]');
      lines.push('- Ch\u1EA5t li\u1EC7u: [ch\u1EA5t li\u1EC7u c\u1EE5 th\u1EC3, VD: "K\xEDnh c\u01B0\u1EDDng l\u1EF1c cao c\u1EA5p, \u0111\u1ED9 c\u1EE9ng 9H"]');
      lines.push('- \u0110\u1ED9 d\xE0y: [n\u1EBFu c\xF3]');
      lines.push('- T\xEDnh n\u0103ng n\u1ED5i b\u1EADt: [2-3 t\xEDnh n\u0103ng ch\xEDnh, ng\u1EAFn g\u1ECDn]');
      lines.push('- Thi\u1EBFt b\u1ECB t\u01B0\u01A1ng th\xEDch: [li\u1EC7t k\xEA \u0111\u1EE7 d\xF2ng m\xE1y]');
      lines.push('');
      lines.push('L\u1EE2I \xCDCH');
      lines.push('[Vi\u1EBFt 5-7 \u0111i\u1EC3m, m\u1ED7i \u0111i\u1EC3m b\u1EAFt \u0111\u1EA7u b\u1EB1ng d\u1EA5u g\u1EA1ch "-", ng\u1EAFn g\u1ECDn 1 d\xF2ng]');
      lines.push('[T\u1EADp trung v\xE0o L\u1EE2I \xCDCH th\u1EF1c t\u1EBF v\u1EDBi ng\u01B0\u1EDDi d\xF9ng, kh\xF4ng ch\u1EC9 li\u1EC7t k\xEA t\xEDnh n\u0103ng]');
      lines.push('[VD: "Ch\u1ED1ng b\u1EA9n, d\u1EC5 lau ch\xF9i, gi\u1EEF m\xE1y lu\xF4n s\u1EA1ch \u0111\u1EB9p" thay v\xEC "Ch\u1EA5t li\u1EC7u silicon cao c\u1EA5p"]');
      lines.push('');
      lines.push('L\u01B0U \xDD (ch\u1EC9 th\xEAm n\u1EBFu c\u1EA7n thi\u1EBFt)');
      lines.push('[1-2 \u0111i\u1EC3m l\u01B0u \xFD th\u1EF1c t\u1EBF, tr\u1EF1c ti\u1EBFp, KHAI QU\xC1T ho\u1EB7c b\u1ECF qua n\u1EBFu kh\xF4ng c\xF3 g\xEC \u0111\u1EB7c bi\u1EC7t]');
      lines.push('');
      lines.push('QUY T\u1EAEC VI\u1EBFT M\xD4 T\u1EA2 STYLE NJOY:');
      lines.push('  \u2022 Gi\u1EEDng v\u0103n g\u1EEDn g\xE0ng, m\u1EA1nh l\u1EA1c, kh\xF4ng d\xF9ng t\u1EEB hoa m\u1EF9');
      lines.push('  \u2022 T\u1EEDng \u0111i\u1EC3m L\u1EE2I \xCDCH t\u1ED1i \u0111a 1 d\xF2ng, d\xF9ng g\u1EA1ch \u0111\u1EA7u d\xF2ng "-"');
      lines.push('  \u2022 Ph\u1EA7n THÔNG TIN \u0111\u1EE7 th\xF4ng s\u1ED1 k\u1EF9 thu\u1EADt (ch\u1EA5t li\u1EC7u, \u0111\u1ED9 d\xE0y, \u0111\u1ED9 c\u1EE9ng)');
      lines.push('  \u2022 Ph\u1EA7n LỢI \xCDCH vi\u1EBFt theo g\xF3c nh\xECn ng\u01B0\u1EDDi mua: "gi\xFAp b\u1EA1n...", "b\u1EA3o v\u1EC7...", "d\u1EC5 d\xE0ng..."');
      lines.push('  \u2022 T\xEAn m\xE1y ph\u1EA3i \u0111\u1EA7y \u0111\u1EE7 (iPhone 11/12/13/14/15/16/17 t\u1EEB\ng d\xF2ng)');
      lines.push('  \u2022 KHAI QU\xC1T ph\u1EA7n LU\u1ECAu \xDD n\u1EBFu s\u1EA3n ph\u1EA9m kh\xF4ng c\u1EA7n th\xEAm h\u01B0\u1EDBng d\u1EABn \u0111\u1EB7c bi\u1EC7t');
      lines.push('  \u2022 KHAI QU\xC1T c\u1EA5u tr\xFAc m\u1EECc \u0111\xEDch kh\xF4ng ph\xF9 h\u1EE3p');
      lines.push('');
      lines.push('M\u1EABU THAM KH\u1EA2O \u2014 K\xEDnh c\u01B0\u1EDDng l\u1EF1c (d\u1EF1a theo listing th\u1EF1c t\u1EBF NJoy):');
      lines.push('---');
      lines.push('THÔNG TIN');
      lines.push('- T\xEAn s\u1EA3n ph\u1EA9m: K\xEDnh C\u01B0\u1EDDng L\u1EF1c Khung T\u1EF1 D\xE1n Ch\u1ED1ng B\u1EE5i Th\xF4ng Minh');
      lines.push('- Ch\u1EA5t li\u1EC7u: K\xEDnh c\u01B0\u1EDDng l\u1EF1c cao c\u1EA5p');
      lines.push('- T\xEDnh n\u0103ng: T\u1EF1 d\xE1n, h\u1EA1n ch\u1EBF b\u1EE5i l\u1ECDt v\xE0o');
      lines.push('- Thi\u1EBFt k\u1EBF: Chu\u1EA9n form, \xF4m s\xE1t m\xE0n h\xECnh');
      lines.push('- Thi\u1EBFt b\u1ECB t\u01B0\u01A1ng th\xEDch: iPhone 11 / 12 / 13 / 14 / 15 / 16 Pro Max');
      lines.push('');
      lines.push('LỢI ÍCH');
      lines.push('- C\u01A1 ch\u1EBF t\u1EF1 d\xE1n th\xF4ng minh, d\u1EC5 thao t\xE1c ngay t\u1EA1i nh\xE0');
      lines.push('- H\u1EA1n ch\u1EBF b\u1EE5i l\u1ECDt v\xE0o trong, gi\xFAp k\xEDnh d\xE1n ph\u1EB3ng \u0111\u1EB9p, gi\u1EA3m b\u1ECDt kh\xED');
      lines.push('- B\u1EA3o v\u1EC7 m\xE0n h\xECnh kh\u1ECFi tr\u1EA7y x\u01B0\u1EDBc khi s\u1EED d\u1EE5ng h\xE0ng ng\xE0y');
      lines.push('- \u0110\u1ED9 trong su\u1ED1t cao, kh\xF4ng \u1EA3nh h\u01B0\u1EDFng hi\u1EC3n th\u1ECB');
      lines.push('- C\u1EA3m \u1EE9ng m\u01B0\u1EE3t, kh\xF4ng c\u1EA7n tay');
      lines.push('- Ph\xF9 h\u1EE3p cho ng\u01B0\u1EDDi m\u1EDBi d\xE1n k\xEDnh ho\u1EB7c mu\u1ED1n d\xE1n nhanh g\u1ECDn');
      lines.push('---');
      lines.push('');
      lines.push('M\u1EABU THAM KH\u1EA2O \u2014 \u1EE4p silicon (d\u1EF1a theo listing th\u1EF1c t\u1EBF NJoy):');
      lines.push('---');
      lines.push('THÔNG TIN');
      lines.push('- T\xEAn s\u1EA3n ph\u1EA9m: [Lo\u1EA1i T\u1ED1t] \u1EE4p Silicon Ch\u1ED1ng B\u1EA9n L\xF3t Nhung C\xF3 S\u1EA1c T\u1EEB T\xEDnh B\u1EA3o V\u1EC7 Camera');
      lines.push('- Ch\u1EA5t li\u1EC7u: Silicon cao c\u1EA5p + l\xF3t nhung m\u1EC1m b\xEAn trong');
      lines.push('- T\xEDnh n\u0103ng n\u1ED5i b\u1EADt: H\u1ED7 tr\u1EE3 s\u1EA1c t\u1EEB t\xEDnh, b\u1EA3o v\u1EC7 camera');
      lines.push('- B\u1EC1 m\u1EB7t: Ch\u1ED1ng b\u1EA1m b\u1EA9n, ch\u1ED1ng b\u1EA1m v\xE2n tay');
      lines.push('- Thi\u1EBFt b\u1ECB t\u01B0\u01A1ng th\xEDch: iPhone 14 / 15 / 16 Pro Max / 17 Pro Max');
      lines.push('');
      lines.push('LỢI ÍCH');
      lines.push('- Ch\u1EA5t li\u1EC7u silicon cao c\u1EA5p, c\u1EA7m \u1EBFm tay, h\u1EA1n ch\u1EBF tr\u01A1n tr\u01B0\u1EE3t');
      lines.push('- L\xF3t nhung b\xEAn trong gi\xFAp b\u1EA3o v\u1EC7 m\u1EB7t l\u01B0ng, tr\xE1nh tr\u1EA7y x\u01B0\u1EDBc');
      lines.push('- B\u1EC1 m\u1EB7t ch\u1ED1ng b\u1EA9n, d\u1EC5 lau ch\xF9i, gi\u1EEF m\xE1y lu\xF4n s\u1EA1ch \u0111\u1EB9p');
      lines.push('- T\xEDch h\u1EE3p h\u1ED7 tr\u1EE3 t\u1EEB t\xEDnh, h\u1ED7 tr\u1EE3 s\u1EA1c kh\xF4ng d\xE2y ti\u1EC7n l\u1EE3i');
      lines.push('- Vi\u1EC1n camera n\xE2ng cao, h\u1EA1n ch\u1EBF tr\u1EA7y x\u01B0\u1EDBc khi \u0111\u1EB7t m\xE1y xu\u1ED1ng b\xE0n');
      lines.push('- Thi\u1EBFt k\u1EBF \xF4m s\xE1t th\xE2n m\xE1y, kh\xF4ng c\u1ED3n c\xEFu, c\u1EADp \u0111\u1EEB\u0300i th\u1EDDi gian');
      lines.push('---');
      lines.push('');
      lines.push('════════════════════════════════════════════════════════');
      lines.push('SAU KHI CLAUDE TR\u1EA2 V\u1EC0: Copy t\xEAn s\u1EA3n ph\u1EA9m + m\xF4 t\u1EA3 v\xE0o Shopee Seller Center');
      lines.push('T\u1EA3i \u1EA3nh xu\u1ED1ng b\u1EB1ng c\xE1c n\xFAt b\xEAn d\u01B0\u1EDBi tr\u01B0\u1EDBc khi l\xEAn listing');
      lines.push('════════════════════════════════════════════════════════');

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
      imgStrip.style.display = 'none';
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

        if (currentData.price) showPrice(currentData.price);
                                      showImageStrip(currentData.images);

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
                                        ? ` \xB7 ${currentData.price.cnyStr} = ${currentData.price.vndStr}`
                  : '';
                                      setStatus(
                                                `OK: ${currentData.specs.length} thong so \xB7 ${mainCount} anh chinh \xB7 ${descCount} anh mo ta${priceInfo}`,
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
