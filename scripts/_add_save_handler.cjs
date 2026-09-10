const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

// 在export前面添加save的事件处理
const oldCode = "} else if (action === 'export') {\n        exportData();";
const newCode = "} else if (action === 'save') {\n        if (persist()) {\n          exportData();\n          message('✅ 已保存到浏览器本地，并下载了JSON备份文件。');\n        } else {\n          message('保存失败，请使用导出JSON备份。');\n        }\n      } else if (action === 'export') {\n        exportData();";

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
  console.log('已添加save按钮事件处理');
} else {
  console.log('未找到目标代码，尝试更宽松的匹配...');
  const regex = /(\} else if \(action === 'export'\) \{\s*exportData\(\);)/;
  if (regex.test(content)) {
    content = content.replace(regex, newCode);
    fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
    console.log('正则替换成功');
  } else {
    console.log('正则也未匹配');
  }
}
