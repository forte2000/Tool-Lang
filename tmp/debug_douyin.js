const axios = require('axios');

async function testApis(input) {
  const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  console.log('--- Debugging Douyin Link ---');
  console.log('Input:', input);

  // 1. Extract URL
  const urlMatch = input.match(/(https?:\/\/[^\s]+)/);
  const url = urlMatch ? urlMatch[1] : input;
  console.log('Extracted URL:', url);

  // 2. Expand URL
  let finalUrl = url;
  if (url.includes('v.douyin.com')) {
    try {
        const res = await axios.get(url, { 
            maxRedirects: 5, 
            headers: { 'User-Agent': desktopUA }
        });
        finalUrl = res.request.res.responseUrl || url;
        console.log('Expanded URL:', finalUrl);
    } catch (e) {
        console.log('Expansion failed:', e.message);
    }
  }

  // 3. Try TikWM
  console.log('\n--- Trying TikWM ---');
  try {
    const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}`);
    console.log('TikWM Status Code:', res.status);
    console.log('TikWM Code:', res.data.code);
    console.log('TikWM Msg:', res.data.msg);
    if (res.data.data) {
        console.log('TikWM Success! Found video:', res.data.data.id);
    }
  } catch (e) {
    console.log('TikWM Error:', e.message);
  }

  // 4. Try SnaptikZ
  console.log('\n--- Trying SnaptikZ ---');
  try {
    const searchParams = new URLSearchParams({ q: finalUrl, t: 'media', lang: 'en' });
    const res = await axios.post('https://snaptikz.app/api/ajaxSearch', 
        searchParams.toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': desktopUA,
                'Origin': 'https://snaptikz.app',
                'Referer': 'https://snaptikz.app/en'
            }
        }
    );
    console.log('SnaptikZ Status:', res.data.status);
    console.log('SnaptikZ Msg:', res.data.msg);
    console.log('SnaptikZ StatusCode:', res.data.statusCode);
    if (res.data.status === 'ok' && res.data.data) {
        console.log('SnaptikZ Success! Data length:', res.data.data.length);
    }
  } catch (e) {
    console.log('SnaptikZ Error:', e.message);
  }
}

const testLink = '6.10 X@Z.MW kpd:/ 10/04 （真.助眠版）启初人们都以为这只是一场普通的降雨，但没想到这场雨却一直下个不停# 原创动画 # 一口气看完系列 # 末日 # 末世 # 暴雨  https://v.douyin.com/hzsunLRVkXw/ 复制此链接，打开Dou音搜索，直接观看视频！';
testApis(testLink);
