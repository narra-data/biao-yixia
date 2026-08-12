// 裱一下 background service worker
// 点击图标 → 注入区域选择层;选区/整页/取消 由 selector.js 消息驱动

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['selector.js'],
    });
  } catch (e) {
    // 受保护页面(chrome:// / 商店等)无法注入:直接开编辑器,提示手动粘贴
    console.warn('inject failed:', e && e.message);
    chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') + '?nocap=1' });
  }
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !msg.type || !msg.type.startsWith('biao-')) return;
  if (msg.type === 'biao-cancel') return;
  handleCapture(msg, sender).catch((e) => {
    console.warn('capture failed:', e && e.message);
    chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') + '?nocap=1' });
  });
});

async function handleCapture(msg, sender) {
  const windowId = sender.tab ? sender.tab.windowId : undefined;
  let dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });

  if (msg.type === 'biao-region') {
    dataUrl = await cropDataUrl(dataUrl, msg.rect, msg.dpr || 1);
  }
  await chrome.storage.session.set({ pendingCapture: dataUrl });
  chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') });
}

async function cropDataUrl(dataUrl, rect, dpr) {
  const blob = await (await fetch(dataUrl)).blob();
  const bmp = await createImageBitmap(blob);
  // 选区坐标是 CSS 像素,截图是设备像素;并对边界做钳制
  const sx = Math.max(0, Math.round(rect.x * dpr));
  const sy = Math.max(0, Math.round(rect.y * dpr));
  const sw = Math.min(bmp.width - sx, Math.round(rect.w * dpr));
  const sh = Math.min(bmp.height - sy, Math.round(rect.h * dpr));
  if (sw < 4 || sh < 4) return dataUrl;
  const cv = new OffscreenCanvas(sw, sh);
  cv.getContext('2d').drawImage(bmp, sx, sy, sw, sh, 0, 0, sw, sh);
  const outBlob = await cv.convertToBlob({ type: 'image/png' });
  return blobToDataURL(outBlob);
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
