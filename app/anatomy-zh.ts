
export const ANATOMY_ZH: Record<string, string> = {
  'heart': '心脏',
  'liver': '肝脏',
  'spleen': '脾脏',
  'lung': '肺',
  'lungs': '肺',
  'kidney': '肾脏',
  'kidneys': '肾脏',
  'stomach': '胃',
  'small intestine': '小肠',
  'large intestine': '大肠',
  'gallbladder': '胆囊',
  'gall bladder': '胆囊',
  'urinary bladder': '膀胱',
  'pancreas': '胰腺',
  'brain': '脑',
  'cerebrum': '大脑',
  'cerebellum': '小脑',
  'brainstem': '脑干',
  'brain stem': '脑干',
  'spinal cord': '脊髓',
  'trachea': '气管',
  'bronchus': '支气管',
  'esophagus': '食管',
  'oesophagus': '食管',
  'diaphragm': '膈',
  'thyroid gland': '甲状腺',
  'adrenal gland': '肾上腺',
  'thymus': '胸腺',
  'pituitary gland': '垂体',
  'duodenum': '十二指肠',
  'jejunum': '空肠',
  'ileum': '回肠',
  'cecum': '盲肠',
  'caecum': '盲肠',
  'appendix': '阑尾',
  'vermiform appendix': '阑尾',
  'colon': '结肠',
  'ascending colon': '升结肠',
  'transverse colon': '横结肠',
  'descending colon': '降结肠',
  'sigmoid colon': '乙状结肠',
  'rectum': '直肠',
  'ureter': '输尿管',
  'urethra': '尿道',
  'prostate': '前列腺',
  'prostate gland': '前列腺',
  'testis': '睾丸',
  'epididymis': '附睾',
  'seminal vesicle': '精囊',
  'aorta': '主动脉',
  'ascending aorta': '升主动脉',
  'aortic arch': '主动脉弓',
  'descending aorta': '降主动脉',
  'pulmonary artery': '肺动脉',
  'pulmonary vein': '肺静脉',
  'superior vena cava': '上腔静脉',
  'inferior vena cava': '下腔静脉',

  'skeleton': '骨骼',
  'skull': '颅骨',
  'cranium': '颅',
  'frontal bone': '额骨',
  'parietal bone': '顶骨',
  'temporal bone': '颞骨',
  'occipital bone': '枕骨',
  'sphenoid bone': '蝶骨',
  'ethmoid bone': '筛骨',
  'nasal bone': '鼻骨',
  'lacrimal bone': '泪骨',
  'zygomatic bone': '颧骨',
  'palatine bone': '腭骨',
  'vomer': '犁骨',
  'maxilla': '上颌骨',
  'mandible': '下颌骨',
  'hyoid bone': '舌骨',
  'clavicle': '锁骨',
  'scapula': '肩胛骨',
  'sternum': '胸骨',
  'manubrium of sternum': '胸骨柄',
  'body of sternum': '胸骨体',
  'xiphoid process': '剑突',
  'rib': '肋骨',
  'costal cartilage': '肋软骨',
  'vertebral column': '脊柱',
  'vertebra': '椎骨',
  'cervical vertebra': '颈椎',
  'thoracic vertebra': '胸椎',
  'lumbar vertebra': '腰椎',
  'atlas': '寰椎',
  'axis': '枢椎',
  'sacrum': '骶骨',
  'coccyx': '尾骨',
  'humerus': '肱骨',
  'radius': '桡骨',
  'ulna': '尺骨',
  'carpal bone': '腕骨',
  'scaphoid': '手舟骨',
  'scaphoid bone': '手舟骨',
  'lunate': '月骨',
  'lunate bone': '月骨',
  'triquetrum': '三角骨',
  'pisiform': '豌豆骨',
  'trapezium': '大多角骨',
  'trapezoid': '小多角骨',
  'capitate': '头状骨',
  'hamate': '钩骨',
  'metacarpal bone': '掌骨',
  'hip bone': '髋骨',
  'pelvic bone': '髋骨',
  'pelvis': '骨盆',
  'ilium': '髂骨',
  'ischium': '坐骨',
  'pubis': '耻骨',
  'femur': '股骨',
  'patella': '髌骨',
  'tibia': '胫骨',
  'fibula': '腓骨',
  'talus': '距骨',
  'calcaneus': '跟骨',
  'navicular bone': '足舟骨',
  'cuboid bone': '骰骨',
  'medial cuneiform bone': '内侧楔骨',
  'intermediate cuneiform bone': '中间楔骨',
  'lateral cuneiform bone': '外侧楔骨',
  'metatarsal bone': '跖骨',

  'biceps brachii': '肱二头肌',
  'triceps brachii': '肱三头肌',
  'deltoid': '三角肌',
  'deltoid muscle': '三角肌',
  'pectoralis major': '胸大肌',
  'pectoralis minor': '胸小肌',
  'trapezius': '斜方肌',
  'latissimus dorsi': '背阔肌',
  'rectus abdominis': '腹直肌',
  'gluteus maximus': '臀大肌',
  'gluteus medius': '臀中肌',
  'rectus femoris': '股直肌',
  'sartorius': '缝匠肌',
  'gastrocnemius': '腓肠肌',
  'soleus': '比目鱼肌'
};

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function anatomyChinese(name: string): string | undefined {
  const key = normalize(name);
  if (ANATOMY_ZH[key]) return ANATOMY_ZH[key];

  // 只处理明确的左/右修饰，不对未知术语做猜测翻译。
  const sideMatch =
    key.match(/^(left|right)\s+(.+)$/) ??
    key.match(/^(.+),\s*(left|right)$/);

  if (sideMatch) {
    const prefixForm = sideMatch[1] === 'left' || sideMatch[1] === 'right';
    const side = prefixForm ? sideMatch[1] : sideMatch[2];
    const base = prefixForm ? sideMatch[2] : sideMatch[1];
    const translated = anatomyChinese(base);
    if (translated) return (side === 'left' ? '左侧' : '右侧') + translated;
  }

  const rib = key.match(/^rib\s+(\d+)$/);
  if (rib) return '第' + rib[1] + '肋骨';

  const vertebra = key.match(/^(cervical|thoracic|lumbar) vertebra\s+(\d+)$/);
  if (vertebra) {
    const names: Record<string, string> = {
      cervical: '颈椎', thoracic: '胸椎', lumbar: '腰椎'
    };
    return '第' + vertebra[2] + names[vertebra[1]];
  }

  return undefined;
}

export function anatomyLabel(name: string): string {
  const chinese = anatomyChinese(name);
  return chinese ? chinese + ' · ' + name : name + '（中文待校对）';
}

export function anatomySearch(name: string): string {
  return (name + ' ' + (anatomyChinese(name) ?? '')).toLowerCase();
}

export const SYSTEM_CONTEXT_ZH: Record<string, string> = {
  skeletal: '骨骼构成人体的支架，参与支持、保护及运动。',
  muscular: '骨骼肌通过收缩牵拉附着结构，参与运动与姿势维持。',
  cardiac: '心脏通过节律性收缩推动血液循环。',
  arterial: '动脉将血液从心脏输送至各组织或肺。',
  venous: '静脉将血液送回心脏。',
  nervous: '神经系统参与感觉、运动及身体功能调节。',
  respiratory: '呼吸系统参与通气及气体交换。',
  digestive: '消化系统参与食物消化、营养吸收及残渣排出。',
  urinary: '泌尿系统参与尿液形成、运输、储存和排出。',
  reproductive: '此模型呈现部分成年男性生殖系统结构。',
  lymphatic: '淋巴系统参与组织液回流和免疫活动。',
  endocrine: '内分泌器官通过激素参与身体功能调节。',
  integumentary: '体表模型提供人体外部形态参考，其完整性需要结合实际模型检查。',
  connective: '结缔组织参与支持、连接与稳定身体结构。',
  sensory: '感觉器官参与视觉、听觉等感觉功能。'
};

export function anatomyContext(system: string): string {
  return (SYSTEM_CONTEXT_ZH[system] ?? '该结构来自原始解剖模型。') +
    ' 此处为系统概述，不是该结构的完整专门说明。';
}
