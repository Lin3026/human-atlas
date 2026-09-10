const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

// 用正则替换材质
const regex = /const material = new T\.LineBasicMaterial\(\{\s*color: new T\.Color\(color\),\s*transparent: true,\s*opacity: 0\.7,\s*linewidth: 2\s*\}\);/;

if (regex.test(content)) {
  content = content.replace(regex, `const material = new T.LineBasicMaterial({
        color: new T.Color(color),
        transparent: true,
        opacity: 0.95,
        linewidth: 4
      });`);
  fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
  console.log('材质已更新：opacity=0.95, linewidth=4');
} else {
  console.log('未匹配到材质，尝试更宽松的正则...');
  const regex2 = /opacity: 0\.7,[\s\S]*?linewidth: 2/;
  if (regex2.test(content)) {
    content = content.replace(regex2, 'opacity: 0.95,\n        linewidth: 4');
    fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
    console.log('宽松正则替换成功');
  } else {
    console.log('还是未匹配');
  }
}
