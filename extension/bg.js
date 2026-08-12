// 裱一下 background service worker
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });
    await chrome.storage.session.set({ pendingCapture: dataUrl });
  } catch (e) {
    // 受保护页面(chrome:// 等)无法截图,打开空编辑器
    await chrome.storage.session.remove('pendingCapture');
  }
  chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') });
});