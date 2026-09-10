const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

// 增大Z轴偏移，让标签更靠前，引导线不贴模型
const oldOffset = `    sprite.position.copy(position);
    sprite.position.x += .092;
    sprite.position.z += .018;`;

const newOffset = `    sprite.position.copy(position);
    sprite.position.x += .085;
    sprite.position.z += .045;`;

if (normalized.includes(oldOffset)) {
  content = normalized.replace(oldOffset, newOffset);
  fs.writeFileSync('./app/acupoint-editor.ts', content.replace(/\n/g, '\r\n'));
  console.log('Z轴偏移修改成功：0.018 -> 0.045');
} else {
  console.log('未找到目标块');
  const idx = normalized.indexOf('sprite.position.x +=');
  console.log('位置:', idx);
  console.log('上下文:', JSON.stringify(normalized.substring(idx-10, idx+80)));
}
