// 合并自动校对的膀胱经背部穴位到acupoint-seed.ts
const fs = require('fs');

// 读取新标注的穴位
const newData = JSON.parse(fs.readFileSync('./bladder-back-auto-verified.json', 'utf8'));

// 读取现有的acupoint-seed.ts
let seedContent = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');
const jsonStart = seedContent.indexOf('{');
const jsonStr = seedContent.substring(jsonStart).trim().replace(/;$/, '');
const seedData = JSON.parse(jsonStr);

console.log('现有穴位数: ' + Object.keys(seedData.points).length);

// 覆盖旧坐标
let updated = 0;
let added = 0;
for (const [code, point] of Object.entries(newData.points)) {
  if (seedData.points[code]) {
    seedData.points[code] = point;
    updated++;
  } else {
    seedData.points[code] = point;
    added++;
  }
}

console.log('更新穴位数: ' + updated);
console.log('新增穴位数: ' + added);
console.log('合并后总穴位数: ' + Object.keys(seedData.points).length);

// 重新生成文件内容
const newContent = '// 用户导出的模型标注草稿；未经专业复核。\nexport const PROJECT_ACUPOINT_SEED = ' + JSON.stringify(seedData, null, 2) + ';\n';

fs.writeFileSync('./app/acupoint-seed.ts', newContent, 'utf8');
console.log('\nacupoint-seed.ts 已更新');
