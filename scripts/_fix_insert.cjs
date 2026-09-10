const fs = require('fs');
let c = fs.readFileSync('./app/anatomy-zh.ts', 'utf8');

// 删除错误插入的内容
const wrong = "  sensory: '感觉器官参与视觉、听觉等感觉功能。'\r\n  'fibularis brevis': '腓骨短肌',\r\n  'fibularis longus': '腓骨长肌',\r\n  'fibularis tertius': '第三腓骨肌',\r\n  'tibialis anterior': '胫骨前肌',\r\n  'tibialis posterior': '胫骨后肌',\r\n  'subscapularis': '肩胛下肌',\r\n  'levator scapulae': '肩胛提肌',\r\n  'iliotibial tract': '髂胫束',\r\n};";
const correct = "  sensory: '感觉器官参与视觉、听觉等感觉功能。'\r\n};";

if (c.includes(wrong)) {
  c = c.replace(wrong, correct);
  console.log('已删除错误插入的内容');
} else {
  console.log('未找到错误内容，尝试其他方式');
  // 直接删除fibularis到iliotibial tract的行
  c = c.replace(/  'fibularis brevis':.*?iliotibial tract': '髂胫束',\r\n/s, '');
  console.log('已通过正则删除');
}

// 现在把这些条目正确地添加到ANATOMY_ZH对象里
// 找到ANATOMY_ZH对象的结束位置（第一个};）
const extra = [
  "  'fibularis brevis': '腓骨短肌',",
  "  'fibularis longus': '腓骨长肌',",
  "  'fibularis tertius': '第三腓骨肌',",
  "  'tibialis anterior': '胫骨前肌',",
  "  'tibialis posterior': '胫骨后肌',",
  "  'subscapularis': '肩胛下肌',",
  "  'levator scapulae': '肩胛提肌',",
  "  'iliotibial tract': '髂胫束',",
].join('\r\n');

// 在第一个};前面插入（ANATOMY_ZH对象的结束）
const firstEnd = c.indexOf('\r\n};');
if (firstEnd > 0) {
  c = c.substring(0, firstEnd) + '\r\n' + extra + c.substring(firstEnd);
  console.log('已正确添加到ANATOMY_ZH对象');
}

fs.writeFileSync('./app/anatomy-zh.ts', c);
console.log('文件已保存');
