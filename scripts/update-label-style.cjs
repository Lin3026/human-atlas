// 修改穴位标签样式：放大字体、去掉白框、修复跗阳标签方向
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'acupoint-editor.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. 放大字体：28px -> 38px，同时调整canvas高度
content = content.replace(
  `    canvas.width = 512;
    canvas.height = 96;`,
  `    canvas.width = 512;
    canvas.height = 112;`
);

// 2. 去掉白色方框背景（fillRect）
content = content.replace(
  `    context.fillStyle = 'rgba(255,254,247,0.96)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = code === selected ? '#cf861c' : '#b84b3a';
    context.lineWidth = 3;
    context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);`,
  `    // 透明背景，无方框
    context.clearRect(0, 0, canvas.width, canvas.height);`
);

// 3. 放大字体
content = content.replace(
  `    context.font = '600 28px "Microsoft YaHei", sans-serif';`,
  `    context.font = '700 36px "Microsoft YaHei", sans-serif';`
);

// 4. 文字颜色改深一点，去掉背景后更清晰
content = content.replace(
  `    context.fillStyle = '#263e37';`,
  `    context.fillStyle = '#1a2e28';`
);

// 5. 修复跗阳BL59等小腿后面穴位的标签方向
// 在isFootTop判断中添加z>0的条件（只有在前面才是脚背）
content = content.replace(
  `    const isFootTop = position.y >= 0.12 && position.y < 0.20;  // 脚背`,
  `    const isFootTop = position.y >= 0.12 && position.y < 0.20 && position.z > 0;  // 脚背（前面）`
);

// 6. 调整sprite缩放比例以适应更大的字体
content = content.replace(
  `    sprite.scale.set(.055, .01375, 1);`,
  `    sprite.scale.set(.065, .01625, 1);`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('标签样式修改完成：');
console.log('  - 字体：28px -> 36px（加粗）');
console.log('  - 去掉白色方框背景');
console.log('  - canvas高度：96 -> 112');
console.log('  - sprite缩放：0.055x0.01375 -> 0.065x0.01625');
console.log('  - 修复跗阳BL59等小腿后面穴位标签方向（isFootTop添加z>0条件）');
