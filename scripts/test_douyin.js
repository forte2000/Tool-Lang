const axios = require('axios');
const fs = require('fs');

async function test() {
  const url = 'https://v.douyin.com/HN1ym91VJVQ/';
  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
  
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': userAgent },
      maxRedirects: 10
    });
    
    console.log('Status:', response.status);
    console.log('Real URL:', response.request.res.responseUrl);
    console.log('HTML Snippet:', response.data.substring(0, 5000));
    fs.writeFileSync('douyin_test.html', response.data);
    console.log('Full HTML saved to douyin_test.html');
    
    let jsonData = null;
    const realUrl = response.request.res.responseUrl;
    const videoId = realUrl.match(/video\/(\d+)/)?.[1];

    // 1. Try RENDER_DATA
    const renderDataMatch = response.data.match(/<script id="RENDER_DATA" type="application\/json">(.+?)<\/script>/);
    if (renderDataMatch) {
      try {
        const rawData = decodeURIComponent(renderDataMatch[1]);
        jsonData = JSON.parse(rawData);
      } catch (e) {
        console.error('Error decoding RENDER_DATA:', e);
      }
    }

    // 2. Try _ROUTER_DATA
    if (!jsonData) {
      const routerDataMatch = response.data.match(/window\._ROUTER_DATA\s*=\s*(\{.+?\})(?:;|\s*<\/script>)/);
      if (routerDataMatch) {
        try {
          jsonData = JSON.parse(routerDataMatch[1]);
        } catch (e) {
          console.error('Error parsing _ROUTER_DATA:', e);
        }
      }
    }

    // 3. Try _SSR_DATA
    if (!jsonData) {
      const ssrDataMatch = response.data.match(/window\._SSR_DATA\s*=\s*(\{.+?\})(?:;|\s*<\/script>)/);
      if (ssrDataMatch) {
        try {
          jsonData = JSON.parse(ssrDataMatch[1]);
        } catch (e) {
          console.error('Error parsing _SSR_DATA:', e);
        }
      }
    }

    if (jsonData) {
      const findItem = (obj, depth = 0) => {
        if (!obj || typeof obj !== 'object' || depth > 20) return null;
        if (obj.aweme_id === videoId || (obj.aweme_id && !videoId)) return obj;
        for (let key in obj) {
          try {
            const result = findItem(obj[key], depth + 1);
            if (result) return result;
          } catch (e) {}
        }
        return null;
      };

      const item = findItem(jsonData);
      if (item) {
        console.log('Success! Found item:', item.aweme_id);
        console.log('Title:', item.desc);
        console.log('Author:', item.author?.nickname);
        let videoUrl = item.video?.play_addr?.url_list[0];
        if (videoUrl && videoUrl.includes('playwm')) videoUrl = videoUrl.replace('playwm', 'play');
        console.log('Video URL:', videoUrl);
      } else {
        console.log('Could not find item in jsonData');
      }
    } else {
      console.log('No SSR data found in HTML');
    }

  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
       console.error('Response Status:', err.response.status);
    }
  }
}

test();
