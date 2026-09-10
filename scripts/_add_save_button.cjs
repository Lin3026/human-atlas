const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

// 1. 在"在皮肤上标注／调整当前穴位"按钮后添加"保存标注"按钮
const oldAdjust = "'<button data-action=\"adjust\">在皮肤上标注／调整当前穴位</button>',";
const newAdjust = "'<button data-action=\"adjust\">在皮肤上标注／调整当前穴位</button>',\n    '<button data-action=\"save\" style=\"background:#286c57;color:white;font-weight:bold\">💾 保存标注（自动+手动备份）</button>',";

if (content.includes(oldAdjust)) {
  content = content.replace(oldAdjust, newAdjust);
  console.log('已添加保存标注按钮');
} else {
  console.log('未找到adjust按钮');
}

// 2. 更新"恢复项目内置七穴"为"恢复项目内置穴位"
const oldRestore = "'<button data-action=\"restore-seed\">恢复项目内置七穴</button>',";
const newRestore = "'<button data-action=\"restore-seed\">恢复项目内置全部穴位（264穴）</button>',";

if (content.includes(oldRestore)) {
  content = content.replace(oldRestore, newRestore);
  console.log('已更新恢复按钮文字');
} else {
  console.log('未找到restore按钮');
}

// 3. 添加save按钮的事件处理
// 找到export按钮的事件处理，在旁边添加save的处理
const oldExportHandler = "case 'export': {\n      const data=serialize();";
const newExportHandler = "case 'save': {\n      const data=serialize();\n      try {\n        localStorage.setItem(storageKey, JSON.stringify(data));\n        const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});\n        const url=URL.createObjectURL(blob);\n        const a=document.createElement('a');\n        a.href=url;\n        a.download='acupoint-annotations-'+new Date().toISOString().slice(0,10)+'.json';\n        a.click();\n        URL.revokeObjectURL(url);\n        message('✅ 已保存到浏览器本地，并下载了JSON备份文件。');\n      } catch(e) {\n        message('保存失败：'+e.message);\n      }\n      break;\n    }\n    case 'export': {\n      const data=serialize();";

if (content.includes(oldExportHandler)) {
  content = content.replace(oldExportHandler, newExportHandler);
  console.log('已添加save按钮事件处理');
} else {
  console.log('未找到export事件处理');
}

fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
console.log('\nacupoint-editor.ts 已更新');
