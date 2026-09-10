const fs = require('fs');

// 完整的肌肉中文名称映射表
const muscleZh = {
  // 眼肌
  'inferior oblique': '下斜肌',
  'inferior rectus': '下直肌',
  'lateral rectus': '外直肌',
  'medial rectus': '内直肌',
  'superior oblique': '上斜肌',
  'superior rectus': '上直肌',
  'levator palpebrae superioris': '上睑提肌',

  // 肩带/胸背肌
  'deltoid': '三角肌',
  'deltoid muscle': '三角肌',
  'trapezius': '斜方肌',
  'pectoralis major': '胸大肌',
  'pectoralis minor': '胸小肌',
  'serratus anterior': '前锯肌',
  'subclavius': '锁骨下肌',
  'latissimus dorsi': '背阔肌',
  'rhomboid major': '大菱形肌',
  'rhomboid minor': '小菱形肌',

  // 臂肌
  'biceps brachii': '肱二头肌',
  'triceps brachii': '肱三头肌',
  'brachialis': '肱肌',
  'coracobrachialis': '喙肱肌',

  // 前臂肌
  'brachioradialis': '肱桡肌',
  'extensor carpi radialis longus': '桡侧腕长伸肌',
  'extensor carpi radialis brevis': '桡侧腕短伸肌',
  'extensor carpi ulnaris': '尺侧腕伸肌',
  'extensor digitorum': '指伸肌',
  'extensor digiti minimi': '小指伸肌',
  'extensor indicis': '示指伸肌',
  'extensor pollicis longus': '拇长伸肌',
  'extensor pollicis brevis': '拇短伸肌',
  'abductor pollicis longus': '拇长展肌',
  'abductor pollicis brevis': '拇短展肌',
  'opponens pollicis': '拇对掌肌',
  'flexor pollicis longus': '拇长屈肌',
  'flexor pollicis brevis': '拇短屈肌',
  'adductor pollicis': '拇收肌',
  'flexor carpi radialis': '桡侧腕屈肌',
  'flexor carpi ulnaris': '尺侧腕屈肌',
  'flexor digitorum superficialis': '指浅屈肌',
  'flexor digitorum profundus': '指深屈肌',
  'flexor digiti minimi brevis': '小指短屈肌',
  'abductor digiti minimi': '小指展肌',
  'opponens digiti minimi': '小指对掌肌',
  'palmaris longus': '掌长肌',
  'pronator teres': '旋前圆肌',
  'pronator quadratus': '旋前方肌',
  'supinator': '旋后肌',
  'anconeus': '肘肌',
  'lumbrical': '蚓状肌',
  'plantar interosseous': '骨间足底肌',

  // 髋肌
  'psoas major': '腰大肌',
  'iliacus': '髂肌',
  'gluteus maximus': '臀大肌',
  'gluteus medius': '臀中肌',
  'gluteus minimus': '臀小肌',
  'piriformis': '梨状肌',
  'obturator internus': '闭孔内肌',
  'obturator externus': '闭孔外肌',
  'gemellus superior': '上孖肌',
  'gemellus inferior': '下孖肌',
  'quadratus femoris': '股方肌',

  // 大腿肌
  'rectus femoris': '股直肌',
  'vastus lateralis': '股外侧肌',
  'vastus medialis': '股内侧肌',
  'vastus intermedius': '股中间肌',
  'sartorius': '缝匠肌',
  'biceps femoris': '股二头肌',
  'semitendinosus': '半腱肌',
  'semimembranosus': '半膜肌',
  'adductor longus': '长收肌',
  'adductor brevis': '短收肌',
  'adductor magnus': '大收肌',
  'adductor minimus': '小收肌',
  'pectineus': '耻骨肌',
  'gracilis': '股薄肌',

  // 小腿肌
  'gastrocnemius': '腓肠肌',
  'soleus': '比目鱼肌',
  'plantaris': '跖肌',
  'popliteus': '腘肌',
  'extensor digitorum longus': '趾长伸肌',
  'extensor hallucis longus': '拇长伸肌',
  'extensor hallucis brevis': '拇短伸肌',
  'flexor digitorum longus': '趾长屈肌',
  'flexor digitorum brevis': '趾短屈肌',
  'flexor hallucis longus': '拇长屈肌',
  'flexor accessorius': '足底方肌',
  'abductor hallucis': '拇展肌',
  'adductor hallucis': '拇收肌',

  // 躯干肌 - 背部深层
  'iliocostalis cervicis': '颈髂肋肌',
  'iliocostalis thoracis': '胸髂肋肌',
  'iliocostalis lumborum': '腰髂肋肌',
  'longissimus capitis': '头最长肌',
  'longissimus cervicis': '颈最长肌',
  'longissimus thoracis': '胸最长肌',
  'spinalis': '棘肌',
  'spinalis thoracis': '胸棘肌',
  'semispinalis capitis': '头半棘肌',
  'semispinalis cervicis': '颈半棘肌',
  'semispinalis thoracis': '胸半棘肌',
  'splenius capitis': '头夹肌',
  'splenius cervicis': '颈夹肌',
  'cervical rotator': '颈回旋肌',
  'thoracic rotator': '胸回旋肌',
  'lumbar rotator': '腰回旋肌',
  'interspinalis thoracis': '胸棘间肌',
  'lateral lumbar intertransversarius': '腰横突间外侧肌',
  'medial lumbar intertransversarius': '腰横突间内侧肌',

  // 躯干肌 - 胸部
  'external intercostal muscle': '肋间外肌',
  'internal intercostal muscle': '肋间内肌',
  'innermost intercostal muscle': '肋间最内肌',
  'transversus thoracis': '胸横肌',
  'diaphragm': '膈',
  'external oblique': '腹外斜肌',
  'rectus abdominis': '腹直肌',

  // 盆底肌
  'coccygeus': '尾骨肌',
  'iliococcygeus': '髂尾肌',
  'pubococcygeus': '耻尾肌',
  'puborectalis': '耻骨直肠肌',
  'external anal sphincter': '肛门外括约肌',
  'superficial perineal muscle': '会阴浅肌',

  // 头颈肌
  'sternocleidomastoid': '胸锁乳突肌',
  'scalenus anterior': '前斜角肌',
  'scalenus medius': '中斜角肌',
  'scalenus posterior': '后斜角肌',
  'longus capitis': '头长肌',
  'rectus capitis anterior': '头前直肌',
  'rectus capitis lateralis': '头外侧直肌',
  'rectus capitis posterior major': '头后大直肌',
  'rectus capitis posterior minor': '头后小直肌',
  'obliquus capitis superior': '头上斜肌',
  'obliquus capitis inferior': '头下斜肌',
  'digastric': '二腹肌',
  'stylohyoid': '茎突舌骨肌',
  'mylohyoid': '下颌舌骨肌',
  'geniohyoid': '颏舌骨肌',
  'sternohyoid': '胸骨舌骨肌',
  'sternothyroid': '胸骨甲状肌',
  'thyrohyoid': '甲状舌骨肌',
  'omohyoid': '肩胛舌骨肌',
  'genioglossus': '颏舌肌',
  'hyoglossus': '舌骨舌肌',
  'platysma': '颈阔肌',

  // 喉肌
  'lateral crico-arytenoid': '环杓侧肌',
  'posterior crico-arytenoid': '环杓后肌',
  'thyro-arytenoid': '甲杓肌',
  'vocalis': '声带肌',
  'oblique arytenoid': '杓斜肌',
  'transverse arytenoid': '杓横肌',
  'aryepiglotticus': '杓会厌肌',

  // 腭肌
  'levator veli palatini': '腭帆提肌',
  'tensor veli palatini': '腭帆张肌',
  'uvular muscle': '腭垂肌',

  // 心肌
  'papillary muscle': '乳头肌',
  'anterior papillary muscle': '前乳头肌',
  'posterior papillary muscle': '后乳头肌',
  'septal papillary muscle': '隔侧乳头肌',
  'lateral papillary muscle': '外侧乳头肌',

  // 提肋肌
  'levatores costarum breves': '短提肋肌',
  'levatores costarum longi': '长提肋肌',

  // 横突间肌/棘间肌集合
  'anterior cervical intertransversarii': '颈横突间前肌',
  'posterior cervical intertransversarii': '颈横突间后肌',
  'dorsal interossei': '骨间背侧肌',
  'palmar interossei': '骨间掌侧肌',
  'interspinales cervicis': '颈棘间肌',
  'interspinales lumborum': '腰棘间肌',
  'lumbricals': '蚓状肌',
  'infraspinatus muscle': '冈下肌',
  'supraspinatus': '冈上肌',
  'teres major': '大圆肌',
  'teres minor': '小圆肌',
  'infraspinatus': '冈下肌',
};

// 读取现有文件
let content = fs.readFileSync('./app/anatomy-zh.ts', 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

// 在现有ANATOMY_ZH表的最后一个条目（soleus）后面插入肌肉翻译
const oldEnd = `  'soleus': '比目鱼肌'
};`;

let muscleEntries = '';
for (const [en, zh] of Object.entries(muscleZh)) {
  muscleEntries += `  '${en}': '${zh}',\n`;
}

const newEnd = `  'soleus': '比目鱼肌',
${muscleEntries}};`;

if (normalized.includes(oldEnd)) {
  content = normalized.replace(oldEnd, newEnd);
  console.log('已添加', Object.keys(muscleZh).length, '个肌肉中文名称');
} else {
  console.log('未找到soleus结尾标记');
}

// 添加肌肉自动处理规则（在anatomyChinese函数里）
// 1. 肌肉部分：abdominal part of pectoralis major → 胸大肌腹部
// 2. 肌肉头：long head of biceps brachii → 肱二头肌长头
// 3. 手足序数词肌肉：First lumbrical of right foot → 右足第一蚓状肌
// 4. 心室乳头肌：anterior papillary muscle of right ventricle → 右心室前乳头肌

const oldReturn = `  return undefined;
}

export function anatomyLabel`;

const newRules = `  // 肌肉部分：abdominal part of pectoralis major → 胸大肌腹部
  const partMatch = key.match(/^(\\w[\\w\\s]*?)\\s+part\\s+of\\s+(left|right)\\s+(.+)$/);
  if (partMatch) {
    const partZh: Record<string, string> = {
      abdominal: '腹部', clavicular: '锁骨部', sternocostal: '胸肋部',
      acromial: '肩峰部', spinal: '脊柱部', ascending: '上部',
      descending: '下部', transverse: '中部', straight: '直部', oblique: '斜部',
      superior: '上部', inferior: '下部', vertical: '垂直部',
      'superior oblique': '上斜部', 'inferior oblique': '下斜部',
      'vertical intermediate': '垂直中间部'
    };
    const side = partMatch[2] === 'left' ? '左侧' : '右侧';
    const base = anatomyChinese(partMatch[3]);
    const part = partZh[partMatch[1]] || partMatch[1];
    if (base) return side + base + part;
  }

  // 肌肉头：long head of left biceps brachii → 左侧肱二头肌长头
  const headMatch = key.match(/^(long|short|lateral|medial|humeral|ulnar|oblique|transverse|superficial|deep|anterolateral)\\s+head\\s+of\\s+(left|right)\\s+(.+)$/);
  if (headMatch) {
    const headZh: Record<string, string> = {
      long: '长头', short: '短头', lateral: '外侧头', medial: '内侧头',
      humeral: '肱头', ulnar: '尺头', oblique: '斜头', transverse: '横头',
      superficial: '浅头', deep: '深头', anterolateral: '前外侧头'
    };
    const side = headMatch[2] === 'left' ? '左侧' : '右侧';
    const base = anatomyChinese(headMatch[3]);
    const head = headZh[headMatch[1]] || headMatch[1] + '头';
    if (base) return side + base + head;
  }

  // 手足序数词肌肉：First lumbrical of right foot → 右足第一蚓状肌
  const footHandMatch = key.match(/^(first|second|third|fourth|fifth|sixth|seventh|eighth)\\s+(.+?)\\s+of\\s+(left|right)\\s+(foot|hand)$/);
  if (footHandMatch) {
    const ord: Record<string, string> = {
      first: '第一', second: '第二', third: '第三', fourth: '第四',
      fifth: '第五', sixth: '第六', seventh: '第七', eighth: '第八'
    };
    const side = footHandMatch[3] === 'left' ? '左' : '右';
    const limb = footHandMatch[4] === 'foot' ? '足' : '手';
    const base = anatomyChinese(footHandMatch[2]);
    if (base) return side + limb + ord[footHandMatch[1]] + base;
  }

  // 心室乳头肌：anterior papillary muscle of right ventricle → 右心室前乳头肌
  const papillaryMatch = key.match(/^(anterior|posterior|septal|lateral|anterolateral)\\s+(papillary muscle)\\s+of\\s+(left|right)\\s+ventricle$/);
  if (papillaryMatch) {
    const posZh: Record<string, string> = {
      anterior: '前', posterior: '后', septal: '隔侧', lateral: '外侧', anterolateral: '前外侧'
    };
    const side = papillaryMatch[3] === 'left' ? '左' : '右';
    return side + '心室' + posZh[papillaryMatch[1]] + '乳头肌';
  }

  // 提肋肌集合：set of left levatores costarum breves → 左侧短提肋肌
  const levatoresMatch = key.match(/^set\\s+of\\s+(left|right)\\s+(levatores costarum (breves|longi))$/);
  if (levatoresMatch) {
    const side = levatoresMatch[1] === 'left' ? '左侧' : '右侧';
    const base = anatomyChinese(levatoresMatch[2]);
    if (base) return side + base;
  }

  // 肌肉集合：set of dorsal interossei → 骨间背侧肌
  const setMatch = key.match(/^set\\s+of\\s+(.+)$/);
  if (setMatch) {
    const base = anatomyChinese(setMatch[1]);
    if (base) return base;
  }

  return undefined;
}

export function anatomyLabel`;

if (content.includes(oldReturn)) {
  content = content.replace(oldReturn, newRules);
  console.log('已添加肌肉自动处理规则');
} else {
  console.log('未找到return undefined标记');
  const idx = content.indexOf('return undefined;');
  console.log('位置:', idx);
}

fs.writeFileSync('./app/anatomy-zh.ts', content.replace(/\n/g, '\r\n'));
console.log('\nanatomy-zh.ts 已保存');
