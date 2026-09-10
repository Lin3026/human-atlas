const fs = require('fs');

// 1. 读取修复后的膀胱经背部穴位
const bladderFixed = JSON.parse(fs.readFileSync('./bladder-back-fixed.json', 'utf8'));

// 2. 读取acupoint-seed.ts
let seedContent = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');

// 3. 替换膀胱经背部穴位的坐标
for (const [code, point] of Object.entries(bladderFixed.points)) {
  // 查找该穴位的position
  const regex = new RegExp('("' + code + '"[\\s\\S]*?"position":\\s*)\\[[^\\]]+\\]');
  if (regex.test(seedContent)) {
    const posStr = '[' + point.position.map(v => v.toFixed(6)).join(', ') + ']';
    seedContent = seedContent.replace(regex, '$1' + posStr);
    console.log('已替换 ' + code + ' position: ' + posStr);
  }
}

fs.writeFileSync('./app/acupoint-seed.ts', seedContent, 'utf8');
console.log('\nacupoint-seed.ts 已更新');

// 4. 修改acupoint-editor.ts的连线逻辑
let editorContent = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

// 替换rebuildMeridianLines函数中的逻辑：只显示选中经脉的连线
const oldLineLogic = `    // 每条经脉按穴位编号排序后连线
    for (const [meridian, codes] of Object.entries(byMeridian)) {
      if (codes.length < 2) continue;`;

const newLineLogic = `    // 只显示当前选中经脉的连线
    for (const [meridian, codes] of Object.entries(byMeridian)) {
      if (meridian !== activeMeridian) continue;
      if (codes.length < 2) continue;`;

if (editorContent.includes(oldLineLogic)) {
  editorContent = editorContent.replace(oldLineLogic, newLineLogic);
  console.log('已修改连线逻辑：只显示选中经脉');
} else {
  console.log('未找到连线逻辑，尝试正则替换...');
  const regex = /(\/\/ 每条经脉按穴位编号排序后连线[\s\S]*?if \(codes\.length < 2\) continue;)/;
  if (regex.test(editorContent)) {
    editorContent = editorContent.replace(regex, newLineLogic);
    console.log('正则替换成功');
  } else {
    console.log('正则也未匹配');
  }
}

// 5. 增加线宽和透明度
const oldMaterial = `      const material = new T.LineBasicMaterial({
        color: new T.Color(color),
        transparent: true,
        opacity: 0.7,
        linewidth: 2
      });`;

const newMaterial = `      const material = new T.LineBasicMaterial({
        color: new T.Color(color),
        transparent: true,
        opacity: 0.95,
        linewidth: 4
      });`;

if (editorContent.includes(oldMaterial)) {
  editorContent = editorContent.replace(oldMaterial, newMaterial);
  console.log('已增加线宽和透明度');
} else {
  console.log('未找到材质定义');
}

fs.writeFileSync('./app/acupoint-editor.ts', editorContent, 'utf8');
console.log('\nacupoint-editor.ts 已更新');
