const fs = require('fs');
const content = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');

// 检查BL11-BL23的Z坐标
for (let i = 11; i <= 23; i++) {
  const code = 'BL' + i;
  const regex = new RegExp('"' + code + '"[\\s\\S]*?"position":\\s*\\[([^\\]]+)\\]');
  const match = content.match(regex);
  if (match) {
    const coords = match[1].split(',').map(s => parseFloat(s.trim()));
    console.log(code + ': X=' + coords[0].toFixed(4) + ' Y=' + coords[1].toFixed(4) + ' Z=' + coords[2].toFixed(4) + (coords[2] < 0 ? ' ✓(后背)' : ' ✗(前面，错误)'));
  } else {
    console.log(code + ': 未找到');
  }
}
