const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  copyPNG: (dataURL) => ipcRenderer.invoke('copy-png', dataURL),
  savePNG: (dataURL, name) => ipcRenderer.invoke('save-png', dataURL, name),
  readClipboardImage: () => ipcRenderer.invoke('read-clipboard-image'),
});
