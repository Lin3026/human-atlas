const fs = require('fs');
const content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

const oldCode = `    // 标签是显示注释，不是穴位坐标。
    // 拉远标签避免与身体重叠，用引导线指向穴位。
    sprite.position.copy(position);
    sprite.position.x += .085;
    // 根据穴位在身体前方/后方决定Z偏移方向，避免前后标签粘连
    sprite.position.z += position.z >= 0 ? .100 : -.100;
    sprite.scale.set(.074, .013875, 1);`;

const newCode = `    // 标签是显示注释，不是穴位坐标。
    // 根据穴位在身体的位置自动选择标签方向，避免重叠。
    sprite.position.copy(position);
    
    // 判断主要方向
    const isHeadTop = position.y > 1.60;
    const isFootBottom = position.y < 0.15;
    const isFront = position.z > 0.04;
    const isBack = position.z < -0.04;
    const isLeftSide = position.x > 0.12;
    const isRightSide = position.x < -0.12;
    
    if (isHeadTop) {
      sprite.position.y += 0.08;
      sprite.position.x += position.x > 0 ? 0.03 : -0.03;
    } else if (isFootBottom) {
      sprite.position.y -= 0.08;
      sprite.position.x += position.x > 0 ? 0.03 : -0.03;
    } else if (isFront && !isLeftSide && !isRightSide) {
      sprite.position.z += 0.10;
      sprite.position.x += 0.02;
    } else if (isBack && !isLeftSide && !isRightSide) {
      sprite.position.z -= 0.10;
      sprite.position.x += 0.02;
    } else if (isLeftSide) {
      sprite.position.x += 0.10;
      if (isFront) sprite.position.z += 0.03;
      if (isBack) sprite.position.z -= 0.03;
    } else if (isRightSide) {
      sprite.position.x -= 0.10;
      if (isFront) sprite.position.z += 0.03;
      if (isBack) sprite.position.z -= 0.03;
    } else {
      sprite.position.x += 0.06;
      sprite.position.z += position.z >= 0 ? 0.08 : -0.08;
    }
    
    sprite.scale.set(.074, .013875, 1);`;

if (content.includes(oldCode)) {
  const newContent = content.replace(oldCode, newCode);
  fs.writeFileSync('./app/acupoint-editor.ts', newContent, 'utf8');
  console.log('替换成功');
} else {
  console.log('未找到目标代码，尝试用正则替换...');
  // 用正则替换
  const regex = /    \/\/ 标签是显示注释[\s\S]*?sprite\.scale\.set\(\.074, \.013875, 1\);/;
  if (regex.test(content)) {
    const newContent = content.replace(regex, newCode);
    fs.writeFileSync('./app/acupoint-editor.ts', newContent, 'utf8');
    console.log('正则替换成功');
  } else {
    console.log('正则也未匹配');
  }
}
