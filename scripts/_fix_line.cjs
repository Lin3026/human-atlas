const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

// 修正引导线起点：addLabel的参数是position，没有value变量
const oldLine = `    // 引导线：从穴位红点到标签框
    const lineGeometry = new T.BufferGeometry().setFromPoints([
      position.clone().addScaledVector(vector(value.displayNormal), .002),
      sprite.position.clone()
    ]);`;

const newLine = `    // 引导线：从穴位红点到标签框
    const lineGeometry = new T.BufferGeometry().setFromPoints([
      position.clone(),
      sprite.position.clone()
    ]);`;

if (normalized.includes(oldLine)) {
  content = normalized.replace(oldLine, newLine);
  fs.writeFileSync('./app/acupoint-editor.ts', content.replace(/\n/g, '\r\n'));
  console.log('引导线起点修正成功');
} else {
  console.log('未找到目标块');
  const idx = normalized.indexOf('引导线：从穴位红点');
  console.log('位置:', idx);
  console.log('上下文:', JSON.stringify(normalized.substring(idx, idx+200)));
}
