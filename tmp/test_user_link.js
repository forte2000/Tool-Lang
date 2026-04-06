const axios = require('axios');

async function testApi(input) {
  try {
     const urlMatch = input.match(/(https?:\/\/[^\s]+)/);
     let url = urlMatch ? urlMatch[1] : input;

     console.log('Testing APIs with URL:', url);
    
     const req = await axios.get(url, { maxRedirects: 10 });
     const realUrl = req.request.res.responseUrl;
     const videoId = realUrl.match(/video\/(\d+)/)?.[1];
     console.log('Extracted Video ID:', videoId);

     if (!videoId) return;

     const standardizedUrl = `https://www.douyin.com/video/${videoId}`;
     console.log('Standardized URL for TikWM:', standardizedUrl);

     console.log('--- TikWM API ---');
     try {
         const r2 = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(standardizedUrl)}`);
         console.log(JSON.stringify(r2.data, null, 2));
     } catch(e) { console.log(e.message) }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

const userText = '6.10 X@Z.MW kpd:/ 10/04 （真.助眠版）启初人们都以为这只是一场普通的降雨，但没想到这场雨却一直下个不停# 原创动画 # 一口气看完系列 # 末日 # 末世 # 暴雨  https://v.douyin.com/hzsunLRVkXw/ 复制此链接，打开Dou音搜索，直接观看视频！';
testApi(userText);
