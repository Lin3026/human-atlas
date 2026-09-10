const fs = require('fs');
let content = fs.readFileSync('./app/scene.tsx', 'utf8');

// 把ground.visible=platform.visible=ring.visible=innerRing.visible=amount<.5&&!s.isolate;
// 替换为ground.visible=platform.visible=ring.visible=innerRing.visible=false;
const oldCode = 'ground.visible=platform.visible=ring.visible=innerRing.visible=amount<.5&&!s.isolate;';
const newCode = 'ground.visible=platform.visible=ring.visible=innerRing.visible=false;';

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync('./app/scene.tsx', content, 'utf8');
  console.log('已修改：底部圆盘始终隐藏');
} else {
  console.log('未找到目标代码');
}
