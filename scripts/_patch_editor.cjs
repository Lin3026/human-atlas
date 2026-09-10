const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

// 统一换行符
const normalized = content.replace(/\r\n/g, '\n');

const oldBlock = `    for (const definition of ABDOMINAL_DEFINITIONS) {
      const value = saved.points[definition.code];
      if (!validSurface(value)) throw new Error('项目穴位数据无效。');
      nextPoints[definition.code] = {
        ...JSON.parse(JSON.stringify(value)),
        status: 'pending-review'
      };
    }`;

const newBlock = `    for (const item of ACUPOINT_CATALOG) {
      const value = saved.points[item.code];
      if (value && validSurface(value)) {
        nextPoints[item.code] = {
          ...JSON.parse(JSON.stringify(value)),
          status: 'pending-review'
        };
      }
    }`;

if (normalized.includes(oldBlock)) {
  const result = normalized.replace(oldBlock, newBlock);
  // 恢复Windows换行符
  fs.writeFileSync('./app/acupoint-editor.ts', result.replace(/\n/g, '\r\n'));
  console.log('替换成功');
} else {
  console.log('未找到目标块，搜索loadProjectSeed...');
  const idx = normalized.indexOf('function loadProjectSeed');
  console.log('loadProjectSeed位置:', idx);
  console.log('上下文:', JSON.stringify(normalized.substring(idx, idx+600)));
}
