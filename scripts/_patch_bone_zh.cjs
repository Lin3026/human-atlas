const fs = require('fs');

// 基础骨骼中文名称映射
const boneZh = {
  // 颅骨
  'frontal bone': '额骨',
  'parietal bone': '顶骨',
  'temporal bone': '颞骨',
  'occipital bone': '枕骨',
  'sphenoid bone': '蝶骨',
  'ethmoid': '筛骨',
  'vomer': '犁骨',
  'nasal bone': '鼻骨',
  'zygomatic bone': '颧骨',
  'maxilla': '上颌骨',
  'mandible': '下颌骨',
  'palatine bone': '腭骨',
  'hyoid bone': '舌骨',

  // 脊柱
  'atlas': '寰椎',
  'axis': '枢椎',
  'cervical vertebra': '颈椎',
  'thoracic vertebra': '胸椎',
  'lumbar vertebra': '腰椎',
  'sacrum': '骶骨',
  'intervertebral disk': '椎间盘',

  // 胸廓
  'rib': '肋',
  'costal cartilage': '肋软骨',
  'manubrium': '胸骨柄',
  'body of sternum': '胸骨体',
  'xiphoid process': '剑突',

  // 上肢带骨
  'clavicle': '锁骨',
  'scapula': '肩胛骨',

  // 自由上肢骨
  'humerus': '肱骨',
  'radius': '桡骨',
  'ulna': '尺骨',

  // 腕骨
  'scaphoid': '手舟骨',
  'lunate': '月骨',
  'triquetral': '三角骨',
  'pisiform': '豌豆骨',
  'trapezium': '大多角骨',
  'trapezoid': '小多角骨',
  'capitate': '头状骨',
  'hamate': '钩骨',

  // 掌骨/跖骨
  'metacarpal bone': '掌骨',
  'metatarsal bone': '跖骨',

  // 指骨/趾骨
  'phalanx': '指骨',

  // 下肢带骨
  'hip bone': '髋骨',

  // 自由下肢骨
  'femur': '股骨',
  'patella': '髌骨',
  'tibia': '胫骨',
  'fibula': '腓骨',

  // 跗骨
  'talus': '距骨',
  'calcaneus': '跟骨',
  'navicular bone': '足舟骨',
  'cuboid bone': '骰骨',
  'medial cuneiform bone': '内侧楔骨',
  'intermediate cuneiform bone': '中间楔骨',
  'lateral cuneiform bone': '外侧楔骨',

  // 籽骨
  'sesamoid bone': '籽骨',

  // 喉软骨/鼻软骨
  'thyroid cartilage': '甲状软骨',
  'cricoid cartilage': '环状软骨',
  'arytenoid cartilage': '杓状软骨',
  'corniculate cartilage': '小角软骨',
  'cuneiform cartilage': '楔状软骨',
  'major alar cartilage': '鼻翼大软骨',

  // 牙龈（虽然不是骨骼，但在skeletal系统里）
  'gingiva of lower jaw': '下颌牙龈',
  'gingiva of upper jaw': '上颌牙龈',
};

// 读取现有文件
let content = fs.readFileSync('./app/anatomy-zh.ts', 'utf8');

// 在ANATOMY_ZH表的最后一个条目后面插入骨骼翻译
// 找到最后一个肌肉条目（uvular muscle）后面
const oldEnd = `  'uvular muscle': '腭垂肌',
};`;

let boneEntries = '';
for (const [en, zh] of Object.entries(boneZh)) {
  boneEntries += `  '${en}': '${zh}',\n`;
}

const newEnd = `  'uvular muscle': '腭垂肌',
${boneEntries}};`;

if (content.includes(oldEnd)) {
  content = content.replace(oldEnd, newEnd);
  console.log('已添加', Object.keys(boneZh).length, '个骨骼中文名称');
} else {
  console.log('未找到uvular muscle结尾标记');
}

// 添加骨骼自动处理规则
// 在anatomyChinese函数里，在肌肉自动处理规则之前添加

const oldMuscleRules = `  // 肌肉部分：abdominal part of pectoralis major → 胸大肌腹部`;

const boneRules = `  // Left/Right前缀：Left clavicle → 左侧锁骨
  const sideMatch = key.match(/^(left|right)\\s+(.+)$/);
  if (sideMatch) {
    const side = sideMatch[1] === 'left' ? '左侧' : '右侧';
    const base = anatomyChinese(sideMatch[2]);
    if (base) return side + base;
  }

  // 序数词+骨骼名：First rib → 第1肋，Fifth metacarpal bone → 第5掌骨
  const ordinalBoneMatch = key.match(/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\\s+(.+)$/);
  if (ordinalBoneMatch) {
    const ordMap: Record<string, string> = {
      first: '1', second: '2', third: '3', fourth: '4', fifth: '5',
      sixth: '6', seventh: '7', eighth: '8', ninth: '9', tenth: '10',
      eleventh: '11', twelfth: '12'
    };
    const base = anatomyChinese(ordinalBoneMatch[2]);
    if (base) return '第' + ordMap[ordinalBoneMatch[1]] + base;
  }

  // 指骨/趾骨：Distal phalanx of left index finger → 左手示指远节指骨
  const phalanxMatch = key.match(/^(distal|middle|proximal)\\s+phalanx\\s+of\\s+(left|right)\\s+(.+)$/);
  if (phalanxMatch) {
    const phalanxZh: Record<string, string> = {
      distal: '远节', middle: '中节', proximal: '近节'
    };
    const fingerZh: Record<string, string> = {
      'thumb': '拇指', 'index finger': '示指', 'middle finger': '中指',
      'ring finger': '环指', 'little finger': '小指',
      'big toe': '拇趾', 'second toe': '第2趾', 'third toe': '第3趾',
      'fourth toe': '第4趾', 'little toe': '小趾'
    };
    const side = phalanxMatch[2] === 'left' ? '左' : '右';
    const limb = phalanxMatch[3].includes('toe') ? '足' : '手';
    const digit = fingerZh[phalanxMatch[3]] || phalanxMatch[3];
    return side + limb + digit + phalanxZh[phalanxMatch[1]] + '指骨';
  }

  // 椎间盘：Intervertebral disk of fifth cervical vertebra → 第5颈椎椎间盘
  const diskMatch = key.match(/^intervertebral disk of (.+)$/);
  if (diskMatch) {
    const base = anatomyChinese(diskMatch[1]);
    if (base) return base + '椎间盘';
  }

  // 足舟骨：Navicular bone of left foot → 左侧足舟骨
  const navicularMatch = key.match(/^navicular bone of (left|right) foot$/);
  if (navicularMatch) {
    const side = navicularMatch[1] === 'left' ? '左侧' : '右侧';
    return side + '足舟骨';
  }

  // 籽骨：Sesamoid bone of left foot → 左足籽骨
  const sesamoidMatch = key.match(/^sesamoid bone of (left|right) foot$/);
  if (sesamoidMatch) {
    const side = sesamoidMatch[1] === 'left' ? '左' : '右';
    return side + '足籽骨';
  }

  // 牙齿：Lower central secondary incisor tooth → 下颌恒中切牙
  const toothMatch = key.match(/^(lower|upper)\\s+(.+)\\s+tooth$/);
  if (toothMatch) {
    const jaw = toothMatch[1] === 'lower' ? '下颌' : '上颌';
    const toothType = toothMatch[2]
      .replace('central secondary incisor', '恒中切')
      .replace('lateral secondary incisor', '恒侧切')
      .replace('first secondary premolar', '恒第一前磨')
      .replace('second secondary premolar', '恒第二前磨')
      .replace('first secondary molar', '恒第一磨')
      .replace('second secondary molar', '恒第二磨')
      .replace('secondary canine', '恒尖');
    return jaw + toothType + '牙';
  }

  // 肌肉部分：abdominal part of pectoralis major → 胸大肌腹部`;

if (content.includes(oldMuscleRules)) {
  content = content.replace(oldMuscleRules, boneRules);
  console.log('已添加骨骼自动处理规则');
} else {
  console.log('未找到肌肉规则标记');
}

fs.writeFileSync('./app/anatomy-zh.ts', content);
console.log('\nanatomy-zh.ts 已保存');
