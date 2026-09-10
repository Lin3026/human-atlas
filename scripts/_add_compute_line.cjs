const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

// 添加computeLineDistances()
const oldLine = 'const line = new T.Line(geometry, material);\n        line.userData.meridian = meridian;';
const newLine = 'const line = new T.Line(geometry, material);\n        line.computeLineDistances();\n        line.userData.meridian = meridian;';

if (content.includes(oldLine)) {
  content = content.replace(oldLine, newLine);
  fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
  console.log('已添加computeLineDistances()');
} else {
  console.log('未找到，尝试用正则...');
  const regex = /(const line = new T\.Line\(geometry, material\);)/;
  if (regex.test(content)) {
    content = content.replace(regex, '$1\n        line.computeLineDistances();');
    fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
    console.log('正则添加成功');
  } else {
    console.log('正则也未匹配');
  }
}
