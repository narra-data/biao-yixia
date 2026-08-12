// 裱一下 · 区域选择覆盖层(由 activeTab + scripting 注入)
(() => {
  if (window.__biaoSelActive) return;
  window.__biaoSelActive = true;

  const Z = 2147483646;
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;inset:0;z-index:${Z};cursor:crosshair;user-select:none;`;

  const sel = document.createElement('div');
  sel.style.cssText = `position:fixed;display:none;border:1.5px solid #ffd9a0;` +
    `box-shadow:0 0 0 100000px rgba(10,12,20,0.42);z-index:${Z};pointer-events:none;`;

  const size = document.createElement('div');
  size.style.cssText = `position:fixed;display:none;z-index:${Z + 1};pointer-events:none;` +
    `background:#131828;color:#ffd9a0;font:12px/1.6 Consolas,monospace;padding:2px 8px;border-radius:4px;`;

  const hint = document.createElement('div');
  hint.textContent = '拖动框选区域 · Enter 截整页 · Esc 取消';
  hint.style.cssText = `position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:${Z + 1};` +
    `background:rgba(19,24,40,0.92);color:#edf1fb;font:13px/1 system-ui,'Microsoft YaHei',sans-serif;` +
    `padding:9px 18px;border-radius:999px;pointer-events:none;`;

  document.documentElement.append(wrap, sel, size, hint);

  let sx = 0, sy = 0, dragging = false, rect = null;

  function updateSel(x, y) {
    const l = Math.min(sx, x), t = Math.min(sy, y);
    const w = Math.abs(x - sx), h = Math.abs(y - sy);
    rect = { x: l, y: t, w, h };
    sel.style.display = 'block';
    sel.style.left = l + 'px'; sel.style.top = t + 'px';
    sel.style.width = w + 'px'; sel.style.height = h + 'px';
    size.style.display = 'block';
    size.textContent = Math.round(w) + ' × ' + Math.round(h);
    size.style.left = l + 'px';
    size.style.top = (t > 26 ? t - 24 : t + h + 4) + 'px';
  }

  function cleanup() {
    wrap.remove(); sel.remove(); size.remove(); hint.remove();
    removeEventListener('keydown', onKey, true);
    window.__biaoSelActive = false;
  }

  function finish(msg) {
    cleanup();
    // 等两帧,确保遮罩从画面上消失后再截图
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(() => chrome.runtime.sendMessage(msg), 60);
    }));
  }

  wrap.addEventListener('mousedown', (e) => {
    e.preventDefault();
    dragging = true; sx = e.clientX; sy = e.clientY;
    updateSel(e.clientX, e.clientY);
  });
  wrap.addEventListener('mousemove', (e) => { if (dragging) updateSel(e.clientX, e.clientY); });
  wrap.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    updateSel(e.clientX, e.clientY);
    if (rect && rect.w > 8 && rect.h > 8) {
      finish({ type: 'biao-region', rect, dpr: window.devicePixelRatio || 1 });
    } else {
      sel.style.display = 'none'; size.style.display = 'none'; rect = null;
    }
  });

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); cleanup(); chrome.runtime.sendMessage({ type: 'biao-cancel' }); }
    if (e.key === 'Enter') { e.preventDefault(); finish({ type: 'biao-full' }); }
  }
  addEventListener('keydown', onKey, true);
})();
