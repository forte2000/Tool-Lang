const axios = require('axios');

async function test() {
    const url = 'https://www.douyin.com/video/7622621057572277539';
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    try {
        console.log("Testing SnaptikZ API...");
        const response = await axios.post('https://snaptikz.app/api/ajaxSearch', 
            new URLSearchParams({ q: url, t: 'media', lang: 'en' }).toString(),
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

        console.log("Status:", response.data.status);
        if (response.data && response.data.status === 'ok') {
            const html = response.data.data;
            console.log("HTML type:", typeof html);
            if (!html) {
                console.log("HTML is empty");
                return;
            }
            
            // Replicate the main.js logic
            try {
                let title = html.match(/<h3>\s*(.*?)\s*<\/h3>/s)?.[1] || 'Video Douyin/TikTok';
                console.log("Title match success");
                title = title.replace(/<[^>]+>/g, '').trim();

                const cover = html.match(/<img src="([^"]+)"/)?.[1];
                console.log("Cover match success");
                
                // Potential culprit
                const videoIdMatch = html.match(/id="TikTokId"\s*value="(\d+)"/);
                const urlIdMatch = url.match(/\/(\d+)/);
                const videoId = videoIdMatch?.[1] || urlIdMatch?.[1] || 'video';
                console.log("VideoID match success:", videoId);

                const mp4Hd = html.match(/href="([^"]+)"[^>]*>.*?Download MP4 HD/)?.[1];
                const mp4Sd = html.match(/href="([^"]+)"[^>]*>.*?Download MP4/)?.[1];
                const mp3 = html.match(/href="([^"]+)"[^>]*>.*?Download MP3/)?.[1];
                console.log("Download links match success");

            } catch (innerErr) {
                console.error("Inner Error:", innerErr);
            }
        } else {
            console.log("API returned not ok:", response.data);
        }
    } catch (e) {
        console.error("Outer Error:", e.message);
    }
}

test();
