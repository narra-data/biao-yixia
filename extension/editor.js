
'use strict';
/* ================= state ================= */
const BGS = [
  { name: '星夜', type: 'g', stops: ['#1c2452', '#3b2f68'], angle: 135 },
  { name: '日冕', type: 'g', stops: ['#ffd9a0', '#ff8d5c'], angle: 135 },
  { name: '银河', type: 'g', stops: ['#667eea', '#764ba2'], angle: 135 },
  { name: '流星', type: 'g', stops: ['#11a37f', '#3b7dbf'], angle: 135 },
  { name: '绯霞', type: 'g', stops: ['#f7a8bc', '#8a3a68'], angle: 135 },
  { name: '晨雾', type: 'g', stops: ['#e8f0fc', '#cdd9ef'], angle: 135 },
  { name: '奶油', type: 'g', stops: ['#fdfcfb', '#e8d5c4'], angle: 135 },
  { name: '石墨', type: 'g', stops: ['#2b2e33', '#17191d'], angle: 135 },
  { name: '纯白', type: 's', stops: ['#ffffff'] },
  { name: '透明', type: 't' },
];
const st = {
  img: null, bg: 0, pad: 7, rad: 16, shadow: 55, zoom: 100,
  aspect: 'auto', wm: '', scale: 1,
};
const cv = document.getElementById('preview');
const ctx = cv.getContext('2d');

/* ================= render ================= */
function roundPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function render() {
  if (!st.img) return;
  const img = st.img;
  const S = st.scale;
  const padF = st.pad / 100;
  const zoomF = st.zoom / 100;
  // base canvas size from image + padding
  let iw = img.width * zoomF, ih = img.height * zoomF;
  let w = iw * (1 + padF * 2), h = ih * (1 + padF * 2);
  const minPad = Math.min(w, h) * padF;
  if (st.aspect !== 'auto') {
    const [aw, ah] = st.aspect.split(':').map(Number);
    const target = aw / ah;
    if (w / h < target) w = h * target; else h = w / target;
  }
  cv.width = Math.round(w * S); cv.height = Math.round(h * S);
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.clearRect(0, 0, w, h);
  // bg
  const bg = BGS[st.bg];
  if (bg.type === 'g') {
    const a = (bg.angle || 135) * Math.PI / 180;
    const r = Math.sqrt(w * w + h * h) / 2;
    const cx = w / 2, cy = h / 2;
    const g = ctx.createLinearGradient(cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    bg.stops.forEach((s, i) => g.addColorStop(i / (bg.stops.length - 1), s));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // subtle vignette for depth
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.10)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  } else if (bg.type === 's') {
    ctx.fillStyle = bg.stops[0];
    ctx.fillRect(0, 0, w, h);
  } // 't' = transparent: nothing
  // image with shadow, centered
  const ix = (w - iw) / 2, iy = (h - ih) / 2;
  ctx.save();
  if (st.shadow > 0) {
    ctx.shadowColor = 'rgba(8, 10, 22, ' + (0.18 + st.shadow / 100 * 0.5) + ')';
    ctx.shadowBlur = st.shadow * 1.2;
    ctx.shadowOffsetY = st.shadow * 0.45;
    roundPath(ctx, ix, iy, iw, ih, st.rad);
    ctx.fillStyle = '#000';
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  roundPath(ctx, ix, iy, iw, ih, st.rad);
  ctx.clip();
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, ix, iy, iw, ih);
  ctx.restore();
  // hairline border on the image
  ctx.save();
  roundPath(ctx, ix + 0.5, iy + 0.5, iw - 1, ih - 1, st.rad);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  // watermark
  if (st.wm.trim()) {
    const light = ['晨雾', '奶油', '纯白'].includes(bg.name);
    const fs = Math.max(13, Math.min(w, h) * 0.022);
    ctx.font = '500 ' + fs + 'px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = light ? 'rgba(40,45,70,0.5)' : 'rgba(255,255,255,0.5)';
    ctx.fillText(st.wm.trim(), w - Math.max(minPad * 0.5, fs), h - Math.max(minPad * 0.45, fs * 0.9));
  }
  document.getElementById('statline').textContent =
    cv.width + ' × ' + cv.height + ' px · ' + (st.scale > 1 ? '2× 高清导出' : '1× 原始导出');
  document.getElementById('empty-hint').classList.add('hidden');
}

/* ================= load image ================= */
function loadFromSrc(src) {
  const img = new Image();
  img.onload = () => { st.img = img; render(); toast('已载入 · 裱好了'); };
  img.src = src;
}
function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const rd = new FileReader();
  rd.onload = () => loadFromSrc(rd.result);
  rd.readAsDataURL(file);
}
const stage = document.getElementById('stage');
stage.addEventListener('dragover', e => { e.preventDefault(); stage.classList.add('drag'); });
stage.addEventListener('dragleave', () => stage.classList.remove('drag'));
stage.addEventListener('drop', e => {
  e.preventDefault(); stage.classList.remove('drag');
  loadFile(e.dataTransfer.files[0]);
});
document.addEventListener('paste', e => {
  for (const it of e.clipboardData.items) {
    if (it.type.startsWith('image/')) { loadFile(it.getAsFile()); return; }
  }
});
stage.addEventListener('click', async () => {
  if (st.img) return;
  // try native clipboard first (desktop)
  if (window.desktop) {
    const d = await window.desktop.readClipboardImage();
    if (d) { loadFromSrc(d); return; }
  }
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => loadFile(inp.files[0]);
  inp.click();
});

/* ================= controls ================= */
const sw = document.getElementById('swatches');
BGS.forEach((b, i) => {
  const d = document.createElement('div');
  d.className = 'swatch' + (i === st.bg ? ' on' : '') + (b.type === 't' ? ' transparent' : '');
  if (b.type === 'g') d.style.background = 'linear-gradient(135deg,' + b.stops.join(',') + ')';
  if (b.type === 's') d.style.background = b.stops[0];
  d.title = b.name;
  d.addEventListener('click', () => {
    st.bg = i;
    document.querySelectorAll('.swatch').forEach((x, j) => x.classList.toggle('on', j === i));
    render();
  });
  sw.appendChild(d);
});
function bindSlider(id, key, suffix, vId) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    st[key] = +el.value;
    document.getElementById(vId).textContent = el.value + (suffix || '');
    render();
  });
}
bindSlider('s-pad', 'pad', '%', 'v-pad');
bindSlider('s-rad', 'rad', '', 'v-rad');
bindSlider('s-shadow', 'shadow', '', 'v-shadow');
bindSlider('s-zoom', 'zoom', '', 'v-zoom');
document.getElementById('aspect-seg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  st.aspect = b.dataset.a;
  document.querySelectorAll('#aspect-seg button').forEach(x => x.classList.toggle('on', x === b));
  render();
});
document.getElementById('wm-text').addEventListener('input', e => { st.wm = e.target.value; render(); });
document.getElementById('btn-2x').addEventListener('click', e => {
  st.scale = st.scale === 1 ? 2 : 1;
  e.target.textContent = '导出 ' + st.scale + '×';
  render();
});

/* ================= export ================= */
let toastTimer = null;
function toast(m) {
  const el = document.getElementById('toast');
  el.textContent = m; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
async function doCopy() {
  if (!st.img) { toast('先丢一张图进来'); return; }
  const d = cv.toDataURL('image/png');
  if (window.desktop) { await window.desktop.copyPNG(d); }
  else {
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  }
  toast('已复制,去微信/小红书直接粘贴 ✓');
}
async function doSave() {
  if (!st.img) { toast('先丢一张图进来'); return; }
  const d = cv.toDataURL('image/png');
  if (window.desktop) {
    const ok = await window.desktop.savePNG(d, '裱一下_' + new Date().toISOString().slice(0, 10) + '.png');
    if (ok) toast('已保存 ✓');
  } else {
    const a = document.createElement('a');
    a.download = '裱一下.png'; a.href = d; a.click();
  }
}
document.getElementById('btn-copy').addEventListener('click', doCopy);
document.getElementById('btn-save').addEventListener('click', doSave);
addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !getSelection().toString()) { doCopy(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); doSave(); }
});

/* ================= demo image on first launch ================= */
function makeDemo() {
  const d = document.createElement('canvas');
  d.width = 900; d.height = 560;
  const c = d.getContext('2d');
  c.fillStyle = '#101828'; c.fillRect(0, 0, 900, 560);
  // fake window chrome
  c.fillStyle = '#1a2440'; c.fillRect(0, 0, 900, 46);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
    c.fillStyle = col; c.beginPath(); c.arc(26 + i * 26, 23, 7, 0, 7); c.fill();
  });
  c.fillStyle = '#8b93b5'; c.font = '600 15px Consolas, monospace';
  c.fillText('demo — 把你的截图丢进来试试', 110, 29);
  // fake chart
  c.strokeStyle = '#232c45';
  for (let y = 120; y < 520; y += 66) { c.beginPath(); c.moveTo(50, y); c.lineTo(850, y); c.stroke(); }
  const pts = [430, 380, 400, 300, 320, 240, 180, 200, 140];
  c.beginPath();
  pts.forEach((p, i) => i ? c.lineTo(70 + i * 96, p) : c.moveTo(70, p));
  c.strokeStyle = '#ffd9a0'; c.lineWidth = 3; c.stroke();
  pts.forEach((p, i) => {
    c.fillStyle = '#ffd9a0'; c.beginPath(); c.arc(70 + i * 96, p, 5, 0, 7); c.fill();
  });
  c.fillStyle = '#edf1fb'; c.font = '700 26px "Microsoft YaHei", sans-serif';
  c.fillText('本周增长', 50, 96);
  c.fillStyle = '#28c840'; c.font = '700 26px Consolas, monospace';
  c.fillText('+327%', 170, 96);
  return d.toDataURL();
}


/* ============ startup: extension capture > demo ============ */
(async function () {
  let loaded = false;
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
      const { pendingCapture } = await chrome.storage.session.get('pendingCapture');
      if (pendingCapture) {
        loadFromSrc(pendingCapture);
        chrome.storage.session.remove('pendingCapture');
        toast('已截取当前页面 · 裱好了');
        loaded = true;
      }
    }
  } catch (e) { console.warn('capture load failed', e); }
  if (!loaded) {
    loadFromSrc(makeDemo());
    if (location.search.includes('nocap=1')) {
      setTimeout(() => toast('该页面无法截图(浏览器保护页),可直接 Ctrl+V 粘贴图片'), 400);
    }
  }
})();
