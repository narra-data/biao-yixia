// 裱一下 background service worker
chrome.action.onClicked.addListener(async (tab) => {
  let ok = false;
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });
    await chrome.storage.session.set({ pendingCapture: dataUrl });
    ok = true;
  } catch (e) {
    // chrome:// 等受保护页面无法截图,或图像超出配额
    console.warn('capture failed:', e && e.message);
    try { await chrome.storage.session.remove('pendingCapture'); } catch (e2) {}
  }
  chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') + (ok ? '' : '?nocap=1') });
});
