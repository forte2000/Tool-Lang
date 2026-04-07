const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');

// Configure autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function setupUpdater(mainWindow) {
    // Check for updates every 2 hours
    setInterval(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 2 * 60 * 60 * 1000);

    // Initial check on startup
    autoUpdater.checkForUpdatesAndNotify();

    // Event: Checking for updates
    autoUpdater.on('checking-for-update', () => {
        mainWindow.webContents.send('update-message', 'Đang kiểm tra bản cập nhật...');
    });

    // Event: Update available
    autoUpdater.on('update-available', (info) => {
        mainWindow.webContents.send('update-message', `Phát hiện phiên bản mới: ${info.version}`);
        mainWindow.webContents.send('update-available', info);
    });

    // Event: Download progress
    autoUpdater.on('download-progress', (progress) => {
        mainWindow.webContents.send('update-download-progress', progress.percent);
    });

    // Event: Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
        mainWindow.webContents.send('update-downloaded', info);
        mainWindow.webContents.send('update-message', 'Đã tải xong bản cập nhật. Sẽ cài đặt khi đóng ứng dụng.');
    });

    // Event: Error
    autoUpdater.on('error', (err) => {
        mainWindow.webContents.send('update-error', err.message);
    });

    // Handle Manual Restart & Install
    ipcMain.handle('quit-and-install', () => {
        autoUpdater.quitAndInstall();
    });
}

module.exports = { setupUpdater };
