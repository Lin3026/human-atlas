// 合并所有新标注的穴位到acupoint-seed.ts（简单JSON方式）
const fs = require('fs');

// 读取所有draft文件
const drafts = [
  './face-head-draft.json',
  './hand-draft.json',
  './foot-draft.json',
  './hip-leg-draft.json'
];

const allPoints = {};
for (const draft of drafts) {
  if (fs.existsSync(draft)) {
    const data = JSON.parse(fs.readFileSync(draft, 'utf8'));
    for (const [code, point] of Object.entries(data.points)) {
      allPoints[code] = point;
    }
    console.log('已加载 ' + draft + ': ' + Object.keys(data.points).length + '个穴位');
  }
}

console.log('\n总共新标注穴位: ' + Object.keys(allPoints).length + '个');

// 读取现有的acupoint-seed.ts
let seedContent = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');

// 去掉开头的export const，解析JSON
const jsonStart = seedContent.indexOf('{');
const jsonStr = seedContent.substring(jsonStart).trim().replace(/;$/, '');
const seedData = JSON.parse(jsonStr);

console.log('现有穴位: ' + Object.keys(seedData.points).length + '个');

// 合并新穴位（不覆盖已有的）
let added = 0;
for (const [code, point] of Object.entries(allPoints)) {
  if (!seedData.points[code]) {
    seedData.points[code] = point;
    added++;
  }
}

console.log('新增穴位: ' + added + '个');
console.log('合并后总穴位: ' + Object.keys(seedData.points).length + '个');

// 重新生成文件内容
const newContent = '// 用户导出的模型标注草稿；未经专业复核。\nexport const PROJECT_ACUPOINT_SEED = ' + JSON.stringify(seedData, null, 2) + ';\n';

fs.writeFileSync('./app/acupoint-seed.ts', newContent, 'utf8');
console.log('\nacupoint-seed.ts 已更新');
