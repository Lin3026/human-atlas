const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

const oldOffset = `    sprite.position.copy(position);
    sprite.position.x += .085;
    sprite.position.z += .045;`;

const newOffset = `    sprite.position.copy(position);
    sprite.position.x += .085;
    sprite.position.z += .060;`;

if (normalized.includes(oldOffset)) {
  content = normalized.replace(oldOffset, newOffset);
  fs.writeFileSync('./app/acupoint-editor.ts', content.replace(/\n/g, '\r\n'));
  console.log('Z轴偏移修改成功：0.045 -> 0.060');
} else {
  console.log('未找到目标块');
}
