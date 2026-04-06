const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    title: 'ToolLang • Admin Key Generator',
    backgroundColor: '#0f0f13',
    autoHideMenuBar: true,
  });

  const url = isDev ? 'http://localhost:5173/admin.html' : `file://${path.join(__dirname, '../dist/admin.html')}`;
  win.loadURL(url);
}

ipcMain.handle('get-hwid', async () => {
  try {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('powershell -ExecutionPolicy Bypass -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', (error, stdout) => {
        if (error) {
          resolve("UNKNOWN-" + Math.random().toString(36).substring(7).toUpperCase());
        } else {
          resolve(stdout.trim());
        }
      });
    });
  } catch (err) {
    return "DEVICE-" + Math.random().toString(36).substring(7).toUpperCase();
  }
});

ipcMain.handle('verify-license', async (event, key, hwid) => {
  if (key === "TOLL-ANG-2026-ADM") return { success: true };
  
  try {
      const salt = "ToolLang_Secret_2026";
      const [sig, expireHex] = key.split('-');
      
      if (!sig || !expireHex) return { success: false, error: 'Định dạng Key không hợp lệ.' };

      const expectedSigInput = hwid + salt + expireHex;
      const expectedSig = crypto.createHash('sha256').update(expectedSigInput).digest('hex').substring(0, 12).toUpperCase();
      
      if (sig !== expectedSig) return { success: false, error: 'Key không hợp lệ cho thiết bị này.' };

      const expireTime = parseInt(expireHex, 16);
      if (Date.now() > expireTime) return { success: false, error: 'Bản quyền đã hết hạn.' };

      return { success: true };
  } catch (e) {
      return { success: false, error: 'Lỗi xác thực.' };
  }
});

ipcMain.handle('generate-secret-key', async (event, hwid, days) => {
  const salt = "ToolLang_Secret_2026";
  const expireTime = Date.now() + (parseInt(days) || 30) * 24 * 60 * 60 * 1000;
  const expireHex = expireTime.toString(16).toUpperCase();
  
  const sigInput = hwid + salt + expireHex;
  const sig = crypto.createHash('sha256').update(sigInput).digest('hex').substring(0, 12).toUpperCase();
  
  return `${sig}-${expireHex}`;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
