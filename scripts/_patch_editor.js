const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

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

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync('./app/acupoint-editor.ts', content);
  console.log('替换成功');
} else {
  console.log('未找到目标块');
  const idx = content.indexOf('ABDOMINAL_DEFINITIONS)');
  console.log('位置:', idx);
  console.log('上下文:', content.substring(idx-30, idx+250));
}
