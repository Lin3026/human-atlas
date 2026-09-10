const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

// 把LineBasicMaterial改成LineDashedMaterial（虚线）
const oldMaterial = `const material = new T.LineBasicMaterial({
        color: new T.Color(color),
        transparent: true,
        opacity: 0.95,
        linewidth: 4
      });`;

const newMaterial = `const material = new T.LineDashedMaterial({
        color: new T.Color(color),
        transparent: true,
        opacity: 0.9,
        dashSize: 0.015,
        gapSize: 0.008,
        linewidth: 2
      });`;

if (content.includes(oldMaterial)) {
  content = content.replace(oldMaterial, newMaterial);
  console.log('连线材质已改为虚线（LineDashedMaterial）');
} else {
  console.log('未找到材质定义，尝试正则替换...');
  const regex = /const material = new T\.LineBasicMaterial\(\{[\s\S]*?\}\);/;
  if (regex.test(content)) {
    content = content.replace(regex, newMaterial);
    console.log('正则替换成功');
  } else {
    console.log('正则也未匹配');
  }
}

// 在创建line后添加computeLineDistances()（虚线需要）
const oldLineCreate = `const line = new T.Line(geometry, material);
        line.userData.meridian = meridian;
        meridianLineGroup.add(line);`;

const newLineCreate = `const line = new T.Line(geometry, material);
        line.computeLineDistances();
        line.userData.meridian = meridian;
        meridianLineGroup.add(line);`;

if (content.includes(oldLineCreate)) {
  content = content.replace(oldLineCreate, newLineCreate);
  console.log('已添加computeLineDistances()');
} else {
  console.log('未找到line创建代码');
}

fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
console.log('\nacupoint-editor.ts 已更新');
