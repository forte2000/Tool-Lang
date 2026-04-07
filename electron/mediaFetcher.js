const axios = require('axios');
const { BrowserWindow } = require('electron');

const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

/**
 * Expands a short URL to its final destination.
 */
async function expandUrl(shortUrl) {
    try {
        const res = await axios.get(shortUrl, { 
            maxRedirects: 5, 
            validateStatus: null,
            timeout: 5000,
            headers: { 'User-Agent': desktopUA }
        });
        return res.request.res.responseUrl || shortUrl;
    } catch (e) {
        return shortUrl;
    }
}

/**
 * Attempts to fetch metadata via TikWM API.
 */
async function tryTikWM(targetUrl) {
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
}

/**
 * Attempts to fetch metadata via Browser extraction.
 */
async function fetchViaBrowser(targetUrl) {
    return new Promise((resolve) => {
        const tempWin = new BrowserWindow({
            show: false,
            webPreferences: { 
                nodeIntegration: false, 
                contextIsolation: true,
                sandbox: true
            }
        });

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

                if (!data || !data.data) throw new Error('No state found');

                const jsonData = JSON.parse(data.data);
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
}

/**
 * Main function to fetch media metadata.
 */
async function fetchMediaMetadata(input) {
    try {
        if (!input || typeof input !== 'string') return { success: false, error: 'Link không hợp lệ.' };
        
        const urlMatch = input.match(/(https?:\/\/[^\s]+)/);
        const url = urlMatch ? urlMatch[1] : input;

        if (!url.startsWith('http')) return { success: false, error: 'Link không hợp lệ.' };
        
        let finalUrl = url;
        if (url.includes('v.douyin.com') || url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
            finalUrl = await expandUrl(url);
        }

        // Try TikWM first
        const tikWmResult = await tryTikWM(finalUrl);
        if (tikWmResult) return tikWmResult;

        // Try SnaptikZ fallback
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
                if (html.length > 10) {
                    const titleMatch = html.match(/<h3>\s*(.*?)\s*<\/h3>/s);
                    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Video Media';

                    const coverMatch = html.match(/<img src="([^"]+)"/);
                    const cover = coverMatch ? coverMatch[1] : '';

                    const videoIdMatch = html.match(/id="TikTokId"\s*value="(\d+)"/);
                    const videoId = videoIdMatch?.[1] || (String(finalUrl).match(/\/(\d+)/)?.[1]) || 'video';

                    const mp4Hd = html.match(/href="([^"]+)"[^>]*>.*?Download MP4 HD/)?.[1];
                    const mp4Sd = html.match(/href="([^"]+)"[^>]*>.*?Download MP4/)?.[1];
                    const videoUrl = mp4Hd || mp4Sd;

                    if (videoUrl) {
                        return {
                            success: true,
                            data: {
                                id: videoId, platform: String(finalUrl).includes('douyin') ? 'douyin' : 'tiktok',
                                title, author: 'User', avatar: '', cover, videoUrl,
                                musicUrl: html.match(/href="([^"]+)"[^>]*>.*?Download MP3/)?.[1]
                            }
                        };
                    }
                }
            }
        } catch (e) {
            console.error("SnaptikZ API error:", e.message);
        }

        // Fallback to Browser
        const browserResult = await fetchViaBrowser(finalUrl);
        if (browserResult) return browserResult;

        return { success: false, error: 'Không tìm thấy dữ liệu video.' };
    } catch (err) {
        return { success: false, error: 'Lỗi server fetch: ' + err.message };
    }
}

module.exports = { fetchMediaMetadata };
