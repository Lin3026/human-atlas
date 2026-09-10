// 合并所有新标注的穴位到acupoint-seed.ts
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

// 提取现有的points部分
const pointsRegex = /points:\s*\{([\s\S]*?)\n  \}/;
const match = seedContent.match(pointsRegex);
if (!match) {
  console.log('未找到points部分');
  process.exit(1);
}

// 解析现有的穴位
const existingPoints = {};
const pointRegex = /"([A-Z]+[0-9]+(?:-R)?)":\s*\{([\s\S]*?)\}/g;
let pointMatch;
while ((pointMatch = pointRegex.exec(match[1])) !== null) {
  existingPoints[pointMatch[1]] = pointMatch[2];
}

console.log('现有穴位: ' + Object.keys(existingPoints).length + '个');

// 合并新穴位（不覆盖已有的）
let added = 0;
for (const [code, point] of Object.entries(allPoints)) {
  if (!existingPoints[code]) {
    const pointStr = JSON.stringify(point, null, 2)
      .replace(/"/g, "'")
      .replace(/\n/g, '\n    ');
    existingPoints[code] = '    ' + pointStr;
    added++;
  }
}

console.log('新增穴位: ' + added + '个');
console.log('合并后总穴位: ' + Object.keys(existingPoints).length + '个');

// 重新生成points部分
let newPointsStr = 'points: {\n';
const codes = Object.keys(existingPoints).sort();
for (let i = 0; i < codes.length; i++) {
  const code = codes[i];
  const comma = i < codes.length - 1 ? ',' : '';
  newPointsStr += '  "' + code + '": ' + existingPoints[code] + comma + '\n';
}
newPointsStr += '  }';

// 替换原有的points部分
seedContent = seedContent.replace(pointsRegex, newPointsStr);

fs.writeFileSync('./app/acupoint-seed.ts', seedContent, 'utf8');
console.log('\nacupoint-seed.ts 已更新');
