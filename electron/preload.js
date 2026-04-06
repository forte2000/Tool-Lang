const { contextBridge, ipcRenderer, webUtils } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  // Navigation & Paths
  getFilePath: (file) => webUtils.getPathForFile(file),
  getPathDetails: (filePath) => {
    if (!filePath) return null;
    return {
      dir: path.dirname(filePath),
      base: path.basename(filePath),
      ext: path.extname(filePath),
      name: path.basename(filePath, path.extname(filePath)),
    };
  },
  
  // File System (Native)
  saveFileDialog: (defaultName, filters) => ipcRenderer.invoke('save-file-dialog', defaultName, filters),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  
  // Media Processing
  fetchMediaMetadata: (url) => ipcRenderer.invoke('fetch-media-metadata', url),
  downloadMedia: (mediaUrl, defaultName) => ipcRenderer.invoke('download-media', mediaUrl, defaultName),
  downloadTtsAudio: (text, lang) => ipcRenderer.invoke('download-tts-audio', text, lang),
  processVideo: (options) => ipcRenderer.invoke('process-video', options),
  exportToCapcut: (projectData) => ipcRenderer.invoke('export-to-capcut', projectData),
  onProcessProgress: (callback) => {
    ipcRenderer.on('process-progress', (_event, value) => callback(value));
    return () => ipcRenderer.removeAllListeners('process-progress');
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_event, value) => callback(value));
    return () => ipcRenderer.removeAllListeners('download-progress');
  },

  // Auto-Updater Events
  onUpdateMessage: (callback) => {
    const listener = (_event, msg) => callback(msg);
    ipcRenderer.on('update-message', listener);
    return () => ipcRenderer.removeListener('update-message', listener);
  },
  onUpdateAvailable: (callback) => {
    const listener = (_event, info) => callback(info);
    ipcRenderer.on('update-available', listener);
    return () => ipcRenderer.removeListener('update-available', listener);
  },
  onUpdateDownloadProgress: (callback) => {
    const listener = (_event, percent) => callback(percent);
    ipcRenderer.on('update-download-progress', listener);
    return () => ipcRenderer.removeListener('update-download-progress', listener);
  },
  onUpdateDownloaded: (callback) => {
    const listener = (_event, info) => callback(info);
    ipcRenderer.on('update-downloaded', listener);
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  },
  onUpdateError: (callback) => {
    const listener = (_event, error) => callback(error);
    ipcRenderer.on('update-error', listener);
    return () => ipcRenderer.removeListener('update-error', listener);
  },
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  
  // Licensing
  getHwid: () => ipcRenderer.invoke('get-hwid'),
  verifyLicense: (key, hwid) => ipcRenderer.invoke('verify-license', key, hwid),
  generateSecretKey: (hwid, days) => ipcRenderer.invoke('generate-secret-key', hwid, days),

  openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
});
