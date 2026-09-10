const fs = require('fs');
const extra = {
  'fibularis brevis': '腓骨短肌',
  'fibularis longus': '腓骨长肌',
  'fibularis tertius': '第三腓骨肌',
  'tibialis anterior': '胫骨前肌',
  'tibialis posterior': '胫骨后肌',
  'subscapularis': '肩胛下肌',
  'levator scapulae': '肩胛提肌',
  'iliotibial tract': '髂胫束',
};
let c = fs.readFileSync('./app/anatomy-zh.ts', 'utf8');
let entries = '';
for (const [en, zh] of Object.entries(extra)) {
  entries += "  '" + en + "': '" + zh + "',\r\n";
}
const idx = c.lastIndexOf('};');
c = c.substring(0, idx) + entries + c.substring(idx);
fs.writeFileSync('./app/anatomy-zh.ts', c);
console.log('已添加', Object.keys(extra).length, '个缺失的肌肉/筋膜名称');
