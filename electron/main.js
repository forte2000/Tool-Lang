const { app, BrowserWindow, ipcMain, dialog, webUtils, shell } = require('electron');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged;
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const crypto = require('crypto');
let setupUpdater;
try {
  setupUpdater = require('./updater.js').setupUpdater;
} catch (e) {
  console.error('Lỗi khi nạp module updater:', e);
}

ffmpeg.setFfmpegPath(ffmpegPath);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    titleBarStyle: 'hidden',
    frame: false,
    backgroundColor: '#0f0f13',
  });

  const url = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  win.loadURL(url);

  // Initialize Auto-Updater
  if (typeof setupUpdater === 'function') {
    setupUpdater(win);
  }

  // if (isDev) {
  //   win.webContents.openDevTools({ mode: 'detach' });
  // }

  // Handle Save Dialog
  ipcMain.handle('save-file-dialog', async (event, defaultName, filters = [{ name: 'Subtitle Files', extensions: ['srt'] }]) => {
    const { filePath } = await dialog.showSaveDialog(win, {
      title: 'Lưu file',
      defaultPath: defaultName || 'translated.srt',
      filters: filters,
    });
    return filePath;
  });

  // Handle File Write
  ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Fetch Media Metadata (Douyin/TikTok)
  ipcMain.handle('fetch-media-metadata', async (event, input) => {
    try {
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
      
      if (!input || typeof input !== 'string') {
        return { success: false, error: 'Link không hợp lệ hoặc dữ liệu trống.' };
      }
      
      // Extract URL from input string
      const urlMatch = input.match(/(https?:\/\/[^\s]+)/);
      const url = urlMatch ? urlMatch[1] : input;

      if (!url.startsWith('http')) {
        return { success: false, error: 'Link không hợp lệ. Vui lòng dán đúng link Douyin/TikTok.' };
      }
      
      // Step 0: Expand URL if it's a short link (Douyin/TikTok)
      const getExpandedUrl = async (shortUrl) => {
          try {
              const res = await axios.get(shortUrl, { 
                  maxRedirects: 5, 
                  validateStatus: null,
                  timeout: 5000,
                  headers: { 'User-Agent': desktopUA }
              });
              // Return the final URL from redirects
              return res.request.res.responseUrl || shortUrl;
          } catch (e) {
              return shortUrl;
          }
      };

      // Helper function for TikWM API
      const tryTikWM = async (targetUrl) => {
          try {
              const response = await axios.post('https://www.tikwm.com/api/', 
                  new URLSearchParams({ url: targetUrl, count: 12, cursor: 0, hd: 1 }).toString(),
                  { 
                      headers: { 
                          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                          'User-Agent': desktopUA
                      },
                      timeout: 10000
                  }
              );

              if (response.data && response.data.code === 0 && response.data.data) {
                  const item = response.data.data;
                  return {
                      success: true,
                      data: {
                          id: item.id,
                          platform: targetUrl.includes('douyin') ? 'douyin' : 'tiktok',
                          title: item.title || 'Video Media',
                          cover: item.cover,
                          videoUrl: item.hdplay || item.play,
                          musicUrl: item.music,
                          author: item.author?.nickname || 'User',
                          avatar: item.author?.avatar
                      }
                  };
              }
          } catch (e) {
              console.error("TikWM API error:", e.message);
          }
          return null;
      };

      let finalUrl = url;
      if (url.includes('v.douyin.com') || url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
          finalUrl = await getExpandedUrl(url);
      }

      // 3. Ultra Fallback: Real Browser Extraction (Native "Bypass")
      const fetchViaBrowser = async (targetUrl) => {
          return new Promise((resolve) => {
              const tempWin = new BrowserWindow({
                  show: false,
                  webPreferences: { 
                      nodeIntegration: false, 
                      contextIsolation: true,
                      sandbox: true
                  }
              });

              // Set Mobile User Agent to get SSR data easily
              tempWin.webContents.setUserAgent(mobileUA);

              let resolved = false;
              const timeout = setTimeout(() => {
                  if (!resolved) {
                      resolved = true;
                      tempWin.destroy();
                      resolve(null);
                  }
              }, 15000);

              tempWin.loadURL(targetUrl).catch(() => {
                  if (!resolved) {
                    resolved = true;
                    tempWin.destroy();
                    resolve(null);
                  }
              });

              tempWin.webContents.on('did-finish-load', async () => {
                  if (resolved) return;
                  try {
                      const data = await tempWin.webContents.executeJavaScript(`
                          (function() {
                              const renderData = document.getElementById('RENDER_DATA')?.textContent;
                              if (renderData) return { type: 'render', data: decodeURIComponent(renderData) };
                              
                              const routerData = window._ROUTER_DATA || window._SSR_DATA;
                              if (routerData) return { type: 'router', data: JSON.stringify(routerData) };
                              
                              const initProps = document.getElementById('__NEXT_DATA__')?.textContent;
                              if (initProps) return { type: 'next', data: initProps };

                              return null;
                          })()
                      `);

                      if (!data || !data.data) {
                          throw new Error('No state found');
                      }

                      const jsonData = JSON.parse(data.data);
                      
                      // Deep search for item (Douyin structure is complex)
                      const findItem = (obj, depth = 0) => {
                          if (!obj || typeof obj !== 'object' || depth > 20) return null;
                          if (obj.aweme_id || obj.id) {
                              if (obj.video || obj.video_output_path) return obj;
                          }
                          for (let key in obj) {
                              const res = findItem(obj[key], depth + 1);
                              if (res) return res;
                          }
                          return null;
                      };

                      const item = findItem(jsonData);
                      if (item) {
                          resolved = true;
                          clearTimeout(timeout);
                          
                          let videoUrl = item.video?.play_addr?.url_list?.[0] || item.video?.download_addr?.url_list?.[0];
                          if (videoUrl && videoUrl.includes('playwm')) videoUrl = videoUrl.replace('playwm', 'play');

                          tempWin.destroy();
                          resolve({
                             success: true,
                             data: {
                                id: item.aweme_id || item.id,
                                platform: targetUrl.includes('douyin') ? 'douyin' : 'tiktok',
                                title: item.desc || item.title || 'Video Media',
                                cover: item.video?.cover?.url_list?.[0] || item.video?.origin_cover?.url_list?.[0],
                                videoUrl: videoUrl,
                                musicUrl: item.music?.play_url?.url_list?.[0],
                                author: item.author?.nickname || 'User',
                                avatar: item.author?.avatar_thumb?.url_list?.[0]
                             }
                          });
                      }
                  } catch (e) {
                      console.error("Browser extraction error:", e.message);
                  }
              });
          });
      };

      // Try TikWM first for all platforms now as it is generally more stable
      const tikWmResult = await tryTikWM(finalUrl);
      if (tikWmResult) return tikWmResult;

      // 2. Fallback to snaptikz.app API
      try {
          const searchParams = new URLSearchParams({ q: finalUrl, t: 'media', lang: 'en' });
          const response = await axios.post('https://snaptikz.app/api/ajaxSearch', 
              searchParams.toString(),
              {
                  headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'User-Agent': desktopUA,
                      'Origin': 'https://snaptikz.app',
                      'Referer': 'https://snaptikz.app/en'
                  },
                  timeout: 10000
              }
          );

          if (response.data && response.data.status === 'ok') {
              const html = String(response.data.data || '');
              if (html && html.length > 10) {
                  const titleMatch = html.match(/<h3>\s*(.*?)\s*<\/h3>/s);
                  let title = titleMatch ? titleMatch[1] : 'Video Media';
                  title = title.replace(/<[^>]+>/g, '').trim();

                  const coverMatch = html.match(/<img src="([^"]+)"/);
                  const cover = coverMatch ? coverMatch[1] : '';

                  const videoIdMatch = html.match(/id="TikTokId"\s*value="(\d+)"/);
                  const urlIdMatch = String(finalUrl).match(/\/(\d+)/);
                  const videoId = videoIdMatch?.[1] || urlIdMatch?.[1] || 'video';

                  const mp4Hd = html.match(/href="([^"]+)"[^>]*>.*?Download MP4 HD/)?.[1];
                  const mp4Sd = html.match(/href="([^"]+)"[^>]*>.*?Download MP4/)?.[1];
                  const videoUrl = mp4Hd || mp4Sd;

                  if (videoUrl) {
                      return {
                          success: true,
                          data: {
                              id: videoId,
                              platform: String(finalUrl).includes('douyin') ? 'douyin' : 'tiktok',
                              title: title,
                              author: 'User',
                              avatar: '',
                              cover: cover,
                              videoUrl: videoUrl,
                              musicUrl: html.match(/href="([^"]+)"[^>]*>.*?Download MP3/)?.[1]
                          }
                      };
                  }
              }
          }
      } catch (e) {
          console.error("SnaptikZ API error:", e.message);
      }

      // 3. Last Resort: Native Browser Extraction
      const browserResult = await fetchViaBrowser(finalUrl);
      if (browserResult) return browserResult;

      return { success: false, error: 'Không tìm thấy dữ liệu video. Video có thể bị giới hạn vùng, riêng tư hoặc Douyin đã thay đổi cơ chế bảo mật.' };
    } catch (err) {
      return { success: false, error: 'Lỗi server fetch: ' + err.message };
    }
  });

  // Open Folder
  ipcMain.handle('open-folder', async (event, filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return { success: true };
    }
    return { success: false, error: 'File không tồn tại.' };
  });

  // Helper for applying filters
  const applyVideoFilters = (inputPath, outputPath, options, event) => {
    const { type, audioPath, bypassOptions = {}, logoPath } = options;
    return new Promise((resolve) => {
      let command = ffmpeg(inputPath);
      let filterComplex = [];
      let inputCount = 1;

      if (logoPath && fs.existsSync(logoPath)) {
        command.input(logoPath);
        inputCount++;
      }

      if (type === 'blur-bg') {
        filterComplex.push('[0:v]scale=1920:1080:force_original_aspect_ratio=increase,boxblur=20:10,setsar=1[bg]');
        filterComplex.push('[0:v]scale=-1:1080[fg]');
        filterComplex.push('[bg][fg]overlay=(W-w)/2:0[v_processed]');
      } else if (type === 'bypass' || (Object.keys(bypassOptions).length > 0)) {
        let filters = [];
        if (bypassOptions.hflip) filters.push('hflip');
        if (bypassOptions.color) filters.push('eq=brightness=0.02:contrast=1.05:saturation=1.1');
        if (bypassOptions.zoom) filters.push('scale=iw*1.1:-1,crop=iw/1.1:ih/1.1');
        if (bypassOptions.noise) filters.push('noise=alls=5:allf=t+u');
        
        let vFilter = filters.length > 0 ? filters.join(',') : 'copy';
        
        if (bypassOptions.speed) {
            command.outputOptions(['-filter:a', 'atempo=1.03']);
            vFilter += (vFilter !== 'copy' ? ',' : '') + 'setpts=0.97*PTS';
        }
        filterComplex.push(`[0:v]${vFilter}[v_processed]`);
      } else {
        filterComplex.push('[0:v]copy[v_processed]');
      }

      let finalLabel = 'v_processed';
      if (logoPath && fs.existsSync(logoPath)) {
        filterComplex.push(`[v_processed][1:v]overlay=W-w-20:20[outv]`);
        finalLabel = 'outv';
      } else {
        filterComplex[filterComplex.length - 1] = filterComplex[filterComplex.length - 1].replace('[v_processed]', '[outv]');
        finalLabel = 'outv';
      }

      command.complexFilter(filterComplex, finalLabel);

      if (type === 'merge-audio') {
        if (!audioPath) return resolve({ success: false, error: 'Thiếu file âm thanh.' });
        command.input(audioPath);
        command.outputOptions(['-c:v libx264', '-crf 18', '-c:a aac', '-map [outv]', '-map ' + (inputCount) + ':a:0', '-shortest']);
      } else {
        command.outputOptions(['-c:v libx264', '-crf 18', '-preset fast', '-map [outv]']);
        if (bypassOptions.speed) {
            command.outputOptions(['-map 0:a?']);
        } else {
            command.outputOptions(['-map 0:a?']);
        }
      }

      command
        .on('progress', (progress) => {
          if (event) event.sender.send('process-progress', progress.percent);
        })
        .on('error', (err) => resolve({ success: false, error: err.message }))
        .on('end', () => resolve({ success: true, path: outputPath }))
        .save(outputPath);
    });
  };

  // Handle Video Processing
  ipcMain.handle('process-video', async (event, options) => {
    return applyVideoFilters(options.inputPath, options.outputPath, options, event);
  });

  // Download Media
  ipcMain.handle('download-media', async (event, mediaUrl, defaultName, processingOptions = {}) => {
    try {
      const { filePath } = await dialog.showSaveDialog(win, {
        title: 'Tải media về máy',
        defaultPath: defaultName || 'video.mp4',
        filters: [{ name: 'Media Files', extensions: ['mp4', 'mp3'] }]
      });

      if (!filePath) return { success: false, cancelled: true };

      const isProcessingNeeded = processingOptions.bypass || processingOptions.logoPath || processingOptions.bypassOptions;

      if (isProcessingNeeded) {
        // Download to temp file first
        const tempPath = path.join(app.getPath('temp'), `temp_${Date.now()}.mp4`);
        const response = await axios({
            method: 'GET', url: mediaUrl, responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' }
        });

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        const writer = fs.createWriteStream(tempPath);
        
        response.data.on('data', (chunk) => {
            downloadedSize += chunk.length;
            if (totalSize) {
                const percent = Math.round((downloadedSize / totalSize) * 100);
                event.sender.send('download-progress', percent);
            }
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Apply processing
        const result = await applyVideoFilters(tempPath, filePath, {
            type: processingOptions.bypass ? 'bypass' : 'none',
            bypassOptions: processingOptions.bypassOptions || {},
            logoPath: processingOptions.logoPath
        }, event);

        // Cleanup
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        return result;
      } else {
        // Direct download
        const response = await axios({
            method: 'GET', url: mediaUrl, responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' }
        });

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        const writer = fs.createWriteStream(filePath);

        response.data.on('data', (chunk) => {
            downloadedSize += chunk.length;
            if (totalSize) {
                const percent = Math.round((downloadedSize / totalSize) * 100);
                event.sender.send('download-progress', percent);
            }
        });

        response.data.pipe(writer);

        return new Promise((resolve) => {
            writer.on('finish', () => resolve({ success: true, path: filePath }));
            writer.on('error', (err) => resolve({ success: false, error: err.message }));
        });
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Download TTS Audio
  ipcMain.handle('download-tts-audio', async (event, text, lang = 'vi') => {
    try {
      const { filePath } = await dialog.showSaveDialog(win, {
        title: 'Lưu file thuyết minh',
        defaultPath: 'thuyet_minh.mp3',
        filters: [{ name: 'Audio Files', extensions: ['mp3'] }]
      });

      if (!filePath) return { success: false, cancelled: true };

      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
      const response = await axios({
        method: 'GET', url: ttsUrl, responseType: 'stream',
        headers: {
          'Referer': 'http://translate.google.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve) => {
        writer.on('finish', () => resolve({ success: true, path: filePath }));
        writer.on('error', (err) => resolve({ success: false, error: err.message }));
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Export to CapCut Draft
  ipcMain.handle('export-to-capcut', async (event, projectData) => {
    const { name, videoPath, audioPath, subtitles = [] } = projectData;
    
    try {
      const projectsDir = path.join(process.env.LOCALAPPDATA, 'CapCut', 'User Data', 'Projects', 'com.lveditor.draft');
      if (!fs.existsSync(projectsDir)) {
        return { success: false, error: 'Không tìm thấy thư mục dự án CapCut trên máy.' };
      }

      const draftId = crypto.randomUUID().toUpperCase();
      const projectPath = path.join(projectsDir, draftId);
      fs.mkdirSync(projectPath, { recursive: true });

      const now = Date.now() * 1000;
      const metaInfo = {
        draft_id: draftId,
        draft_name: name || `ToolLang Export ${new Date().toLocaleDateString()}`,
        create_time: now,
        update_time: now,
        draft_root_path: projectsDir,
        draft_removable: true,
        draft_type: "",
        tm_draft_create_time: now,
        tm_draft_modified_time: now,
        draft_is_new_version: true,
        tm_duration: 0 
      };
      fs.writeFileSync(path.join(projectPath, 'draft_meta_info.json'), JSON.stringify(metaInfo, null, 2));

      const content = {
        id: draftId, version: 5, name: metaInfo.draft_name, fps: 30, duration: 0,
        materials: { videos: [], audios: [], texts: [], beats: [], speeds: [], canvases: [], material_animations: [] },
        tracks: [
            { id: crypto.randomUUID().toUpperCase(), type: 'video', segments: [] },
            { id: crypto.randomUUID().toUpperCase(), type: 'audio', segments: [] }
        ],
        canvas_config: { width: 1920, height: 1080, ratio: "original" },
        config: { draft_type: "" }
      };

      if (videoPath && fs.existsSync(videoPath)) {
        const videoId = crypto.randomUUID().toUpperCase();
        content.materials.videos.push({ id: videoId, type: "video", path: videoPath, duration: 0 });
        content.tracks[0].segments.push({
            id: crypto.randomUUID().toUpperCase(), material_id: videoId, render_index: 0,
            target_timerange: { start: 0, duration: 300000000 },
            source_timerange: { start: 0, duration: 300000000 }
        });
      }

      if (audioPath && fs.existsSync(audioPath)) {
        const audioId = crypto.randomUUID().toUpperCase();
        content.materials.audios.push({ id: audioId, type: "audio", path: audioPath, duration: 0 });
        content.tracks[1].segments.push({
            id: crypto.randomUUID().toUpperCase(), material_id: audioId, render_index: 0,
            target_timerange: { start: 0, duration: 300000000 },
            source_timerange: { start: 0, duration: 300000000 }
        });
      }

      fs.writeFileSync(path.join(projectPath, 'draft_content.json'), JSON.stringify(content, null, 2));
      return { success: true, path: projectPath, draftId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Activation & Licensing
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
    // Master Key for Admin bypass
    if (key === "TOLL-ANG-2026-ADM") {
        return { success: true };
    }

    try {
        const salt = "ToolLang_Secret_2026";
        const [sig, expireHex] = key.split('-');
        
        if (!sig || !expireHex) {
            // Legacy / Invalid format
            return { success: false, error: 'Định dạng Key không hợp lệ.' };
        }

        // 1. Re-verify Signature
        const expectedSigInput = hwid + salt + expireHex;
        const expectedSig = crypto.createHash('sha256').update(expectedSigInput).digest('hex').substring(0, 12).toUpperCase();
        
        if (sig !== expectedSig) {
            return { success: false, error: 'Key không hợp lệ cho thiết bị này.' };
        }

        // 2. Check expiration
        const expireTime = parseInt(expireHex, 16);
        if (Date.now() > expireTime) {
            return { success: false, error: 'Bản quyền đã hết hạn. Vui lòng liên hệ Admin để gia hạn.' };
        }

        return { success: true };
    } catch (e) {
        return { success: false, error: 'Lỗi xác thực bản quyền.' };
    }
  });

}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
