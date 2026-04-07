const axios = require('axios');

async function testMobileUA(input) {
  const urlMatch = input.match(/(https?:\/\/[^\s]+)/);
  const url = urlMatch ? urlMatch[1] : input;

  console.log('Testing Mobile UA with URL:', url);
  try {
     const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
     const response = await axios.get(url, {
         headers: { 'User-Agent': mobileUA },
         maxRedirects: 10
     });
     
     require('fs').writeFileSync('mobile_douyin.html', response.data);
     console.log('Saved HTML to mobile_douyin.html (size:', response.data.length, ')');
     
     let jsonData = null;
     const ssrDataMatch = response.data.match(/window\._SSR_DATA\s*=\s*(\{.+?\})(?:;|\s*<\/script>)/);
     if (ssrDataMatch) {
         jsonData = JSON.parse(ssrDataMatch[1]);
         require('fs').writeFileSync('mobile_ssr.json', JSON.stringify(jsonData, null, 2));
         console.log('Saved SSR to mobile_ssr.json');
     }
  } catch (e) {
     console.log('Error:', e.message);
  }
}

testMobileUA('https://v.douyin.com/hzsunLRVkXw/');
