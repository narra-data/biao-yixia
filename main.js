const { app, BrowserWindow, ipcMain, clipboard, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;

if (process.argv.includes('--selftest')) {
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 860,
    minHeight: 600,
    backgroundColor: '#0b0e17',
    autoHideMenuBar: true,
    title: '裱一下',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // self-test mode: capture window and quit (used in CI / by the author)
  if (process.argv.includes('--selftest')) {
    const log = (m) => { try { fs.appendFileSync(path.join(__dirname, 'selftest.log'), m + '\n'); } catch (e) {} };
    log('selftest armed ' + new Date().toISOString() + ' electron=' + process.versions.electron + ' chrome=' + process.versions.chrome);
    win.webContents.on('did-fail-load', (e, code, desc) => { log('did-fail-load ' + code + ' ' + desc); app.exit(1); });
    win.webContents.once('did-finish-load', () => {
      log('did-finish-load');
      setTimeout(async () => {
        try {
          const img = await win.webContents.capturePage();
          fs.writeFileSync(path.join(__dirname, 'selftest.png'), img.toPNG());
          log('captured ' + img.getSize().width + 'x' + img.getSize().height);
        } catch (e) { log('capture error: ' + e.message); }
        app.exit(0);
      }, 1800);
    });
    setTimeout(() => { log('watchdog fired, forcing exit'); app.exit(2); }, 15000);
  }
}

ipcMain.handle('copy-png', (ev, dataURL) => {
  clipboard.writeImage(nativeImage.createFromDataURL(dataURL));
  return true;
});

ipcMain.handle('save-png', async (ev, dataURL, suggested) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: suggested || '裱一下.png',
    filters: [{ name: 'PNG 图片', extensions: ['png'] }],
  });
  if (canceled || !filePath) return false;
  const b64 = dataURL.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
  return true;
});

ipcMain.handle('read-clipboard-image', () => {
  const img = clipboard.readImage();
  if (img.isEmpty()) return null;
  return img.toDataURL();
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
