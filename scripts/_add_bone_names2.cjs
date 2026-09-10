const fs = require('fs');
const boneZh = {
  'frontal bone': '额骨', 'parietal bone': '顶骨', 'temporal bone': '颞骨',
  'occipital bone': '枕骨', 'sphenoid bone': '蝶骨', 'ethmoid': '筛骨',
  'vomer': '犁骨', 'nasal bone': '鼻骨', 'zygomatic bone': '颧骨',
  'maxilla': '上颌骨', 'mandible': '下颌骨', 'palatine bone': '腭骨',
  'hyoid bone': '舌骨', 'atlas': '寰椎', 'axis': '枢椎',
  'cervical vertebra': '颈椎', 'thoracic vertebra': '胸椎', 'lumbar vertebra': '腰椎',
  'sacrum': '骶骨', 'intervertebral disk': '椎间盘', 'rib': '肋',
  'costal cartilage': '肋软骨', 'manubrium': '胸骨柄', 'body of sternum': '胸骨体',
  'xiphoid process': '剑突', 'clavicle': '锁骨', 'scapula': '肩胛骨',
  'humerus': '肱骨', 'radius': '桡骨', 'ulna': '尺骨',
  'scaphoid': '手舟骨', 'lunate': '月骨', 'triquetral': '三角骨',
  'pisiform': '豌豆骨', 'trapezium': '大多角骨', 'trapezoid': '小多角骨',
  'capitate': '头状骨', 'hamate': '钩骨', 'metacarpal bone': '掌骨',
  'metatarsal bone': '跖骨', 'hip bone': '髋骨', 'femur': '股骨',
  'patella': '髌骨', 'tibia': '胫骨', 'fibula': '腓骨',
  'talus': '距骨', 'calcaneus': '跟骨', 'navicular bone': '足舟骨',
  'cuboid bone': '骰骨', 'medial cuneiform bone': '内侧楔骨',
  'intermediate cuneiform bone': '中间楔骨', 'lateral cuneiform bone': '外侧楔骨',
  'sesamoid bone': '籽骨', 'thyroid cartilage': '甲状软骨',
  'cricoid cartilage': '环状软骨', 'arytenoid cartilage': '杓状软骨',
  'corniculate cartilage': '小角软骨', 'cuneiform cartilage': '楔状软骨',
  'major alar cartilage': '鼻翼大软骨', 'gingiva of lower jaw': '下颌牙龈',
  'gingiva of upper jaw': '上颌牙龈',
};

let c = fs.readFileSync('./app/anatomy-zh.ts', 'utf8');
let entries = '';
for (const [en, zh] of Object.entries(boneZh)) {
  entries += "  '" + en + "': '" + zh + "',\r\n";
}
const old = "  'infraspinatus': '冈下肌',\r\n};\r\n";
const newStr = "  'infraspinatus': '冈下肌',\r\n" + entries + "};\r\n";
if (c.includes(old)) {
  c = c.replace(old, newStr);
  fs.writeFileSync('./app/anatomy-zh.ts', c);
  console.log('已添加', Object.keys(boneZh).length, '个骨骼中文名称');
} else {
  console.log('未找到标记，尝试其他方式');
  // 直接在};前面插入
  const idx = c.lastIndexOf('};');
  if (idx > 0) {
    c = c.substring(0, idx) + entries + c.substring(idx);
    fs.writeFileSync('./app/anatomy-zh.ts', c);
    console.log('已通过lastIndexOf方式添加', Object.keys(boneZh).length, '个骨骼中文名称');
  }
}
