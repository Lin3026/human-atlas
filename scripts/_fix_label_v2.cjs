const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

// 找到标签位置逻辑并替换
const regex = /(\/\/ 标签是显示注释[\s\S]*?sprite\.scale\.set\(\.074, \.013875, 1\);)/;

if (regex.test(content)) {
  const newLabelLogic = `    // 标签是显示注释，不是穴位坐标。
    // 根据穴位在身体的位置智能选择标签方向，避免重叠。
    sprite.position.copy(position);
    
    // 细分区域判断
    const isHeadTop = position.y > 1.62 && Math.abs(position.z) < 0.06;  // 头顶正中线
    const isHeadFront = position.y > 1.55 && position.z > 0.06;  // 头前面
    const isHeadBack = position.y > 1.55 && position.z < -0.06;  // 头后面
    const isHeadSide = position.y > 1.50 && Math.abs(position.x) > 0.06;  // 头侧面
    const isFootBottom = position.y < 0.12;  // 脚底
    const isFootTop = position.y >= 0.12 && position.y < 0.20;  // 脚背
    const isFront = position.z > 0.04;  // 身体前面
    const isBack = position.z < -0.04;  // 身体后面
    const isLeftSide = position.x > 0.10;  // 身体左侧
    const isRightSide = position.x < -0.10;  // 身体右侧
    
    if (isHeadTop) {
      // 头顶正中线：标签向上，并根据前后位置微调
      sprite.position.y += 0.07;
      sprite.position.z += position.z > 0 ? 0.02 : -0.02;
    } else if (isHeadFront) {
      // 头前面：标签向前上方
      sprite.position.z += 0.08;
      sprite.position.y += 0.03;
      sprite.position.x += position.x > 0 ? 0.02 : -0.02;
    } else if (isHeadBack) {
      // 头后面：标签向后上方
      sprite.position.z -= 0.08;
      sprite.position.y += 0.03;
      sprite.position.x += position.x > 0 ? 0.02 : -0.02;
    } else if (isHeadSide) {
      // 头侧面：标签向侧面
      if (position.x > 0) {
        sprite.position.x += 0.09;
      } else {
        sprite.position.x -= 0.09;
      }
      sprite.position.y += 0.02;
    } else if (isFootBottom) {
      // 脚底：标签向下
      sprite.position.y -= 0.07;
      sprite.position.x += position.x > 0 ? 0.02 : -0.02;
    } else if (isFootTop) {
      // 脚背：标签向前
      sprite.position.z += 0.07;
      sprite.position.x += position.x > 0 ? 0.02 : -0.02;
    } else if (isFront && !isLeftSide && !isRightSide) {
      // 身体前面正中线：标签向前
      sprite.position.z += 0.09;
      sprite.position.x += 0.02;
    } else if (isBack && !isLeftSide && !isRightSide) {
      // 身体后面正中线：标签向后
      sprite.position.z -= 0.09;
      sprite.position.x += 0.02;
    } else if (isLeftSide) {
      // 身体左侧：标签向左
      sprite.position.x += 0.09;
      if (isFront) sprite.position.z += 0.02;
      if (isBack) sprite.position.z -= 0.02;
    } else if (isRightSide) {
      // 身体右侧：标签向右
      sprite.position.x -= 0.09;
      if (isFront) sprite.position.z += 0.02;
      if (isBack) sprite.position.z -= 0.02;
    } else {
      // 默认：根据前后决定Z方向，X轻微偏移
      sprite.position.x += 0.05;
      sprite.position.z += position.z >= 0 ? 0.07 : -0.07;
    }
    
    sprite.scale.set(.074, .013875, 1);`;

  content = content.replace(regex, newLabelLogic);
  fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
  console.log('标签逻辑已更新：细分头部/脚底/身体各区域，智能分布标签');
} else {
  console.log('未找到标签逻辑');
}
