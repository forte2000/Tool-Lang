const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
    const url = "https://v.douyin.com/hzsunLRVkXw/";
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const win = new BrowserWindow({
        show: true,
        width: 800,
        height: 600,
        webPreferences: {
          webSecurity: false,
          nodeIntegration: false,
          contextIsolation: true
        }
    });

    win.webContents.setUserAgent(desktopUA);

    let resolved = false;

    const finish = (result) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        if (!win.isDestroyed()) win.destroy();
        console.log("Result:", JSON.stringify(result, null, 2));
        app.quit();
    };

    const timeout = setTimeout(() => {
        finish({ success: false, error: 'Timeout' });
    }, 15000);

    console.log("Loading URL...");
    win.loadURL(url);

    win.webContents.on('did-finish-load', async () => {
        if (resolved) return;
        const title = win.webContents.getTitle();
        console.log("did-finish-load Event triggered. Title:", title);
        
        try {
            const html = await win.webContents.executeJavaScript('document.documentElement.outerHTML');
            require('fs').writeFileSync('window_douyin.html', html);
            console.log('Saved window_douyin.html!');
            finish({ success: true, info: 'HTML Saved' });
        } catch (e) {
            console.log("JS Error:", e.message);
        }
    });
});
