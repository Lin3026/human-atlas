// 合并膀胱经面部穴位到acupoint-seed.ts（覆盖旧坐标）
const fs = require('fs');

// 读取新标注的穴位
const newData = JSON.parse(fs.readFileSync('./bladder-face-fixed.json', 'utf8'));

// 读取现有的acupoint-seed.ts
let seedContent = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');
const jsonStart = seedContent.indexOf('{');
const jsonStr = seedContent.substring(jsonStart).trim().replace(/;$/, '');
const seedData = JSON.parse(jsonStr);

console.log('现有穴位数: ' + Object.keys(seedData.points).length);

// 覆盖旧坐标
let updated = 0;
for (const [code, point] of Object.entries(newData.points)) {
  if (seedData.points[code]) {
    seedData.points[code] = point;
    updated++;
    console.log('已更新 ' + code + ': X=' + point.position[0].toFixed(4) + ' Y=' + point.position[1].toFixed(4) + ' Z=' + point.position[2].toFixed(4));
  } else {
    seedData.points[code] = point;
    updated++;
    console.log('已新增 ' + code);
  }
}

console.log('\n更新/新增穴位数: ' + updated);
console.log('合并后总穴位数: ' + Object.keys(seedData.points).length);

// 重新生成文件内容
const newContent = '// 用户导出的模型标注草稿；未经专业复核。\nexport const PROJECT_ACUPOINT_SEED = ' + JSON.stringify(seedData, null, 2) + ';\n';

fs.writeFileSync('./app/acupoint-seed.ts', newContent, 'utf8');
console.log('\nacupoint-seed.ts 已更新');
