const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

const oldOffset = `    sprite.position.copy(position);
    sprite.position.x += .085;
    sprite.position.z += .100;`;

const newOffset = `    sprite.position.copy(position);
    sprite.position.x += .085;
    // 根据穴位在身体前方/后方决定Z偏移方向，避免前后标签粘连
    sprite.position.z += position.z >= 0 ? .100 : -.100;`;

if (normalized.includes(oldOffset)) {
  content = normalized.replace(oldOffset, newOffset);
  fs.writeFileSync('./app/acupoint-editor.ts', content.replace(/\n/g, '\r\n'));
  console.log('标签Z偏移方向修改成功：前方+10cm，后方-10cm');
} else {
  console.log('未找到目标块');
  const idx = normalized.indexOf('sprite.position.z +=');
  console.log('当前:', JSON.stringify(normalized.substring(idx-10, idx+40)));
}
