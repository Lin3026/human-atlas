// 合并所有draft.json穴位到acupoint-seed.ts
const fs = require('fs');

// 读取现有的seed文件
let seedContent = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');

// 读取所有draft文件
const drafts = [
  './bladder-back-draft.json',
  './chest-limb-draft.json',
  './lower-limb-draft.json',
  './head-face-draft.json',
  './right-side-draft.json',
];

let allNewPoints = {};
for (const draftPath of drafts) {
  if (fs.existsSync(draftPath)) {
    const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
    Object.assign(allNewPoints, draft.points);
    console.log(`从 ${draftPath} 读取 ${Object.keys(draft.points).length} 个穴位`);
  }
}

console.log(`\n总共新增 ${Object.keys(allNewPoints).length} 个穴位`);

// 检查哪些穴位已经存在于seed中
const existingMatches = seedContent.match(/"([A-Z]+\d+)"\s*:\s*\{/g);
const existingCodes = new Set();
if (existingMatches) {
  for (const m of existingMatches) {
    const code = m.match(/"([A-Z]+\d+)"/)[1];
    existingCodes.add(code);
  }
}
console.log(`seed中已有 ${existingCodes.size} 个穴位`);

// 过滤掉已存在的穴位
const newPoints = {};
let skipped = 0;
for (const [code, point] of Object.entries(allNewPoints)) {
  if (existingCodes.has(code)) {
    skipped++;
  } else {
    newPoints[code] = point;
  }
}
console.log(`跳过已存在的 ${skipped} 个穴位，实际新增 ${Object.keys(newPoints).length} 个穴位`);

// 生成新的穴位JSON字符串
function formatPoint(code, point) {
  const pos = point.position.map(v => v.toFixed(6));
  const normal = point.displayNormal.map(v => v.toFixed(6));
  const bary = point.barycentric.map(v => v.toFixed(6));
  return `  "${code}": {
    "name": "${point.name}",
    "position": [${pos.join(', ')}],
    "displayNormal": [${normal.join(', ')}],
    "faceIndex": ${point.faceIndex},
    "vertexIndices": [${point.vertexIndices.join(', ')}],
    "barycentric": [${bary.join(', ')}],
    "meshId": "${point.meshId}",
    "status": "${point.status || 'pending-review'}",
    "note": "${point.note || ''}"
  }`;
}

const newPointsStr = Object.entries(newPoints).map(([code, point]) => formatPoint(code, point)).join(',\n');

// 在seed文件的points对象末尾插入新穴位
// 找到points对象的最后一个穴位，然后在其后插入
const pointsMatch = seedContent.match(/"points"\s*:\s*\{/);
if (pointsMatch) {
  // 找到points对象的闭合位置
  let braceCount = 0;
  let startIdx = seedContent.indexOf('"points"');
  let objStart = seedContent.indexOf('{', startIdx);
  let i = objStart;
  for (; i < seedContent.length; i++) {
    if (seedContent[i] === '{') braceCount++;
    if (seedContent[i] === '}') {
      braceCount--;
      if (braceCount === 0) break;
    }
  }
  
  // 在闭合括号前插入新穴位
  const before = seedContent.substring(0, i);
  const after = seedContent.substring(i);
  
  // 检查before末尾是否有逗号
  let insertStr = '';
  if (before.trim().endsWith(',')) {
    insertStr = '\n' + newPointsStr + '\n';
  } else {
    insertStr = ',\n' + newPointsStr + '\n';
  }
  
  seedContent = before + insertStr + after;
  
  fs.writeFileSync('./app/acupoint-seed.ts', seedContent, 'utf8');
  console.log('\n已合并到 acupoint-seed.ts');
  
  // 统计最终穴位数量
  const finalMatches = seedContent.match(/"([A-Z]+\d+)"\s*:\s*\{/g);
  console.log(`最终seed文件包含 ${finalMatches ? finalMatches.length : 0} 个穴位`);
} else {
  console.log('未找到points对象');
}
