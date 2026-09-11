// 把用户导出的JSON转换成TypeScript种子文件
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'acupoints-latest.json');
const tsPath = path.join(__dirname, '..', 'app', 'acupoint-seed.ts');

const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 统计穴位数量
const pointCount = Object.keys(json.points || {}).length;
const defCount = (json.definitions || []).length;

console.log(`穴位数量: ${pointCount}`);
console.log(`定义数量: ${defCount}`);
console.log(`基准点: ${Object.keys(json.anchors || {}).join(', ')}`);

// 生成TypeScript内容
const tsContent = `// 用户导出的模型标注草稿；未经专业复核。
// 导出时间: ${json.exportedAt || 'unknown'}
// 穴位数量: ${pointCount}
// 标准: ${json.standard || 'GB/T 12346—2021'}
export const PROJECT_ACUPOINT_SEED = ${JSON.stringify(json, null, 2)};
`;

fs.writeFileSync(tsPath, tsContent, 'utf8');
console.log(`\n已写入: ${tsPath}`);
console.log(`文件大小: ${(fs.statSync(tsPath).size / 1024).toFixed(1)} KB`);
