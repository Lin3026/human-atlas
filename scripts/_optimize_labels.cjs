// 优化标签显示：缩短文字、缩小尺寸、智能分布避免重叠
const fs = require('fs');

let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

// 1. 缩短标签文字：只显示名称，不显示编号
content = content.replace(
  "context.fillText(\n      definition.name + ' ' + code,\n      canvas.width / 2,\n      canvas.height / 2\n    );",
  "context.fillText(\n      definition.name,\n      canvas.width / 2,\n      canvas.height / 2\n    );"
);

// 2. 缩小canvas尺寸
content = content.replace(
  "canvas.width = 512;\n    canvas.height = 96;",
  "canvas.width = 256;\n    canvas.height = 64;"
);

// 3. 缩小字体
content = content.replace(
  "context.font = '600 42px \"Microsoft YaHei\", sans-serif';",
  "context.font = '600 28px \"Microsoft YaHei\", sans-serif';"
);

// 4. 缩小边框宽度
content = content.replace(
  "context.lineWidth = 5;",
  "context.lineWidth = 3;"
);

// 5. 缩小sprite scale
content = content.replace(
  "sprite.scale.set(.074, .013875, 1);",
  "sprite.scale.set(.055, .01375, 1);"
);

// 6. 修改背部穴位的标签分布逻辑
// 找到isBack的处理部分，修改为智能分布
const oldBackLogic = `} else if (isBack && !isLeftSide && !isRightSide) {
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
    }`;

const newBackLogic = `} else if (isBack && !isLeftSide && !isRightSide) {
      // 身体后面正中线：标签向后
      sprite.position.z -= 0.09;
      sprite.position.x += 0.02;
    } else if (isLeftSide) {
      // 身体左侧：智能分布避免重叠
      // 膀胱经第一侧线（旁开1.5寸，X<0.06）向左
      // 膀胱经第二侧线（旁开3寸，X>=0.06）向右
      const isFirstLine = Math.abs(position.x) < 0.06;
      if (isFirstLine) {
        sprite.position.x += 0.08;
      } else {
        sprite.position.x -= 0.06;
      }
      // 上下交错：根据Y坐标的奇偶性微调Y
      const yIndex = Math.floor(position.y * 100);
      if (yIndex % 2 === 0) {
        sprite.position.y += 0.015;
      } else {
        sprite.position.y -= 0.015;
      }
      if (isFront) sprite.position.z += 0.02;
      if (isBack) sprite.position.z -= 0.02;
    } else if (isRightSide) {
      // 身体右侧：智能分布避免重叠
      const isFirstLine = Math.abs(position.x) < 0.06;
      if (isFirstLine) {
        sprite.position.x -= 0.08;
      } else {
        sprite.position.x += 0.06;
      }
      // 上下交错
      const yIndex = Math.floor(position.y * 100);
      if (yIndex % 2 === 0) {
        sprite.position.y += 0.015;
      } else {
        sprite.position.y -= 0.015;
      }
      if (isFront) sprite.position.z += 0.02;
      if (isBack) sprite.position.z -= 0.02;
    }`;

if (content.includes(oldBackLogic)) {
  content = content.replace(oldBackLogic, newBackLogic);
  console.log('已修改背部标签分布逻辑');
} else {
  console.log('未找到旧的背部标签分布逻辑，尝试更宽松的匹配...');
  // 用正则替换
  content = content.replace(
    /\} else if \(isLeftSide\) \{[\s\S]*?\} else if \(isRightSide\) \{[\s\S]*?\}/,
    newBackLogic.replace('} else if (isBack && !isLeftSide && !isRightSide) {', '').trim()
  );
  console.log('已用正则修改标签分布逻辑');
}

fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
console.log('\nacupoint-editor.ts 已更新');
console.log('优化内容：');
console.log('1. 标签只显示名称，不显示编号');
console.log('2. 标签尺寸缩小（512x96 → 256x64）');
console.log('3. 字体缩小（42px → 28px）');
console.log('4. 膀胱经第一侧线标签向外，第二侧线标签向内');
console.log('5. 上下交错分布，避免重叠');
