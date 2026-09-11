const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');

// 修改localStorage加载逻辑：合并到seed数据上，而不是覆盖
const oldCode = `  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const saved = JSON.parse(raw) as SavedData;
      if (saved.schema === 1 && saved.modelKey === modelKey) {
        anchors = {};
        points = {};
        for (const key of ['navel', 'pubic'] as AnchorKey[]) {
          const value = saved.anchors?.[key];
          if (validSurface(value)) anchors[key] = value;
        }
        for (const definition of DEFINITIONS) {
          const value = saved.points?.[definition.code];
          if (validSurface(value)) {
            points[definition.code] = {
              ...value,
              method: value.method === 'manual-surface-pick'
                ? 'manual-surface-pick' : 'regional-projection',
              status: 'pending-review'
            };
          }
        }
        message('已恢复本浏览器保存的标定草稿。');
      } else {
        message('发现其他模型版本的保存记录，未自动套用。');
      }
    }
  } catch {
    message('旧保存记录无法读取，未载入。');
  }`;

const newCode = `  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const saved = JSON.parse(raw) as SavedData;
      if (saved.schema === 1 && saved.modelKey === modelKey) {
        // 合并到seed数据上，而不是覆盖
        for (const key of ['navel', 'pubic'] as AnchorKey[]) {
          const value = saved.anchors?.[key];
          if (validSurface(value)) anchors[key] = value;
        }
        let merged = 0;
        for (const definition of DEFINITIONS) {
          const value = saved.points?.[definition.code];
          if (validSurface(value)) {
            points[definition.code] = {
              ...value,
              method: value.method === 'manual-surface-pick'
                ? 'manual-surface-pick' : 'regional-projection',
              status: 'pending-review'
            };
            merged++;
          }
        }
        message('已恢复本浏览器保存的' + merged + '个标定草稿，并合并项目内置全部穴位。');
      } else {
        message('发现其他模型版本的保存记录，未自动套用。');
      }
    }
  } catch {
    message('旧保存记录无法读取，未载入。');
  }`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  console.log('已修改localStorage加载逻辑：合并而非覆盖');
} else {
  console.log('未找到目标代码，尝试更宽松的匹配...');
  // 用正则替换关键部分
  const regex = /anchors = \{\};\s*points = \{\};/;
  if (regex.test(content)) {
    content = content.replace(regex, '// 合并到seed数据上，不覆盖');
    console.log('已移除清空anchors和points的代码');
  } else {
    console.log('正则也未匹配');
  }
}

// 同时更新提示文字
content = content.replace(
  "message('已载入项目内置七穴，三维状态仍为待复核。');",
  "message('已载入项目内置全部穴位，三维状态仍为待复核。');"
);
console.log('已更新提示文字');

// 更新按钮文字
content = content.replace(
  "恢复项目内置全部穴位（264穴）",
  "恢复项目内置全部穴位（488穴）"
);
console.log('已更新按钮文字');

fs.writeFileSync('./app/acupoint-editor.ts', content, 'utf8');
console.log('\nacupoint-editor.ts 已更新');
