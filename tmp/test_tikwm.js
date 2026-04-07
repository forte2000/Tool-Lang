const axios = require('axios');

async function testTikwm(input) {
  const urlMatch = input.match(/(https?:\/\/[^\s]+)/);
  const url = urlMatch ? urlMatch[1] : input;

  console.log('Testing TikWM with URL:', url);
  const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
  console.log(JSON.stringify(response.data, null, 2));
}

testTikwm('6.10 X@Z.MW kpd:/ 10/04 （真.助眠版）启初人们都以为这只是一场普通的降雨，但没想到这场雨却一直下个不停# 原创动画 # 一口气看完系列 # 末日 # 末世 # 暴雨  https://v.douyin.com/hzsunLRVkXw/ 复制此链接，打开Dou音搜索，直接观看视频！');
