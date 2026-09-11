// 合并任脉穴位到acupoint-seed.ts
const fs = require('fs');

const newData = JSON.parse(fs.readFileSync('./renmai-bone-measured.json', 'utf8'));

let seedContent = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');
const jsonStart = seedContent.indexOf('{');
const jsonStr = seedContent.substring(jsonStart).trim().replace(/;$/, '');
const seedData = JSON.parse(jsonStr);

console.log('现有穴位数: ' + Object.keys(seedData.points).length);

let updated = 0;
for (const [code, point] of Object.entries(newData.points)) {
  if (seedData.points[code]) {
    seedData.points[code] = point;
    updated++;
  } else {
    seedData.points[code] = point;
  }
}

console.log('更新任脉穴位数: ' + updated);
console.log('合并后总穴位数: ' + Object.keys(seedData.points).length);

const newContent = '// 用户导出的模型标注草稿；未经专业复核。\nexport const PROJECT_ACUPOINT_SEED = ' + JSON.stringify(seedData, null, 2) + ';\n';
fs.writeFileSync('./app/acupoint-seed.ts', newContent, 'utf8');
console.log('acupoint-seed.ts 已更新');
