const fs = require('fs');

// 读取穴位目录
const catalogContent = fs.readFileSync('./app/acupoint-catalog.ts', 'utf8');
const seedContent = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');

// 提取所有经脉的穴位
const allCodes = [];
const meridianRegex = /id:\s*'([A-Z]+)',[\s\S]*?names:\s*'([^']+)'\.split\(' '\)/g;
let match;
while ((match = meridianRegex.exec(catalogContent)) !== null) {
  const meridian = match[1];
  const names = match[2].split(' ');
  for (let i = 0; i < names.length; i++) {
    allCodes.push(meridian + (i + 1));
  }
}

// 提取种子数据中已标注的穴位编码
const seedCodes = [];
const seedRegex = /"([A-Z]+[0-9]+(?:-R)?)":\s*\{/g;
while ((match = seedRegex.exec(seedContent)) !== null) {
  seedCodes.push(match[1]);
}

console.log('十四经总穴位数: ' + allCodes.length);
console.log('种子数据中已标注穴位数: ' + seedCodes.length);

// 找出缺失的穴位（左侧）
const missingLeft = [];
for (const code of allCodes) {
  if (!seedCodes.includes(code)) {
    missingLeft.push(code);
  }
}

console.log('\n缺失的左侧穴位数: ' + missingLeft.length);

// 按经脉分组
const byMeridian = {};
for (const code of missingLeft) {
  const meridian = code.replace(/[0-9]/g, '');
  if (!byMeridian[meridian]) byMeridian[meridian] = [];
  byMeridian[meridian].push(code);
}

for (const [meridian, codes] of Object.entries(byMeridian)) {
  console.log('  ' + meridian + ' (' + codes.length + '个): ' + codes.join(', '));
}
