import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const marker = '// chinese-study-upgrade-v1';
const changes = new Map();

const read = relative =>
  fs.readFileSync(path.join(root, relative), 'utf8');

function replaceRequired(text, before, after, label) {
  if (!text.includes(before)) {
    throw new Error(`没有找到：${label}。尚未写入修改。`);
  }
  return text.replace(before, after);
}

let page = read('app/page.tsx');
let scene = read('app/scene.tsx');
let anatomy = read('app/anatomy.ts');
let study = read('app/meridian-study.tsx');

if (page.includes(marker)) {
  throw new Error('这次中文更新已经运行过，不需要重复运行。');
}

/* ---------- 中文术语表：保留原始 ID 和英文数据 ---------- */

changes.set('app/anatomy-zh.ts', `
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
  return name.trim().toLowerCase().replace(/\\s+/g, ' ');
}

export function anatomyChinese(name: string): string | undefined {
  const key = normalize(name);
  if (ANATOMY_ZH[key]) return ANATOMY_ZH[key];

  // 只处理明确的左/右修饰，不对未知术语做猜测翻译。
  const sideMatch =
    key.match(/^(left|right)\\s+(.+)$/) ??
    key.match(/^(.+),\\s*(left|right)$/);

  if (sideMatch) {
    const prefixForm = sideMatch[1] === 'left' || sideMatch[1] === 'right';
    const side = prefixForm ? sideMatch[1] : sideMatch[2];
    const base = prefixForm ? sideMatch[2] : sideMatch[1];
    const translated = anatomyChinese(base);
    if (translated) return (side === 'left' ? '左侧' : '右侧') + translated;
  }

  const rib = key.match(/^rib\\s+(\\d+)$/);
  if (rib) return '第' + rib[1] + '肋骨';

  const vertebra = key.match(/^(cervical|thoracic|lumbar) vertebra\\s+(\\d+)$/);
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
`);

/* ---------- 系统列表汉化 ---------- */

const systemNames = {
  'Skeleton': '骨骼系统',
  'Muscles': '肌肉系统',
  'Heart': '心脏',
  'Sensory organs': '感觉器官',
  'Arteries': '动脉',
  'Veins': '静脉',
  'Nervous system': '神经系统',
  'Respiratory': '呼吸系统',
  'Digestive': '消化系统',
  'Urinary': '泌尿系统',
  'Lymphatic': '淋巴系统',
  'Endocrine': '内分泌系统',
  'Reproductive': '生殖系统',
  'Body surface': '体表',
  'Connective tissue': '结缔组织'
};

for (const [en, zh] of Object.entries(systemNames)) {
  anatomy = anatomy.replaceAll(`name:'${en}'`, `name:'${zh}'`);
}
changes.set('app/anatomy.ts', anatomy);

/* ---------- 标题、搜索、详情、模型提示 ---------- */

page =
  marker + '\n' +
  "import {anatomyLabel,anatomySearch,anatomyContext} from './anatomy-zh';\n" +
  page;

page = replaceRequired(
  page,
  'c.name.toLowerCase().includes(term)',
  'anatomySearch(c.name).includes(term)',
  '解剖搜索'
);

page = page
  .replaceAll('{c.name}', '{anatomyLabel(c.name)}')
  .replaceAll('{p.name}', '{anatomyLabel(p.name)}')
  .replaceAll(
    '{chosen?.name}',
    "{chosen ? anatomyLabel(chosen.name) : ''}"
  )
  .replaceAll(
    "chosen&&selected?explanation(chosen.name,selected.system):''",
    "chosen&&selected?anatomyContext(selected.system):''"
  )
  .replaceAll(
    "{['¾','F','S','B'][i]}",
    "{['斜','前','侧','后'][i]}"
  );

const ui = [
  ['INTERACTIVE ANATOMY', '三维解剖 · 经络研习'],
  [' modeled pieces ', ' 个模型部件 '],
  ['Find a structure', '查找解剖结构'],
  ['>Systems<', '>人体系统<'],
  ['>All<', '>全部<'],
  ['>Skeleton<', '>骨骼<'],
  ['>Organs<', '>内脏<'],
  [' pieces visible', ' 个部件可见'],
  ['>Hide all<', '>全部隐藏<'],
  ['Heart, femur, cranial nerve…', '搜索：心脏、股骨、肝脏…'],
  ['No structures match your search.', '没有找到匹配的结构。'],
  ['Showing up to 80 matches. Refine your search to find smaller structures.',
   '最多显示80项结果，可输入更具体的名称。'],
  ['Start with a major organ, or search every named structure.',
   '可搜索已收录的中文名称、原始英文名称或模型编号。'],
  ["c.elements.length===1?'piece':'pieces'",
   "c.elements.length===1?'部件':'部件'"],
  ['Explode anatomy', '展开解剖结构'],
  ['>Assembled<', '>合拢<'],
  ['>Every piece<', '>全部展开<'],
  ['>Reset<', '>重置<'],
  ['Drag to pan', '拖动平移'],
  ['Drag to orbit', '拖动旋转'],
  ['Pinch to zoom', '双指或滚轮缩放'],
  ['Tap to inspect', '点击查看结构'],
  ['Source & credits', '来源与署名'],
  ['Preparing the anatomy', '正在加载人体模型'],
  ['% · Loading ', '% · 正在加载 '],
  ['Reload viewer', '重新加载'],
  ['Atlas reference', '模型编号'],
  ['Selected pieces', '选中部件数'],
  ['Included structures', '包含的结构'],
  ['View anatomical source', '查看解剖数据来源'],
  ['Show surrounding anatomy', '显示周围结构'],
  ['Isolate structure', '单独观察结构'],
  ['Clear selection', '取消选择'],
  ['System overview · structure identified from source anatomy',
   '系统概述 · 名称依据原始解剖数据'],
  ['ANATOMICAL INVENTORY', '解剖部件总览'],
  ['SEPARATED STRUCTURES', '已展开的结构'],
  ['ADULT HUMAN · MALE', '成年男性参考人体'],
  ['SELECTED STRUCTURE', '已选结构'],
  ['SOURCE & SCOPE', '数据来源与适用范围'],
  ['A body, revealed.', '人体解剖参考'],
  ['Explore the adult male reference anatomy from BodyParts3D.',
   '探索来自 BodyParts3D 的成年男性参考人体。'],
  ['Dataset license', '数据集许可证'],
  ['Original geometry & metadata', '原始模型与元数据'],
  ['Read the source publication', '阅读原始研究论文']
];

for (const [before, after] of ui) {
  page = page.replaceAll(before, after);
}
changes.set('app/page.tsx', page);

scene =
  "import {anatomyLabel} from './anatomy-zh';\n" + scene;

scene = replaceRequired(
  scene,
  'hover.textContent=atlas.parts[index].name;',
  'hover.textContent=anatomyLabel(atlas.parts[index].name);',
  '模型悬浮提示'
);
changes.set('app/scene.tsx', scene);

/* ---------- 奇经八脉、穴位资料模块 ---------- */

changes.set('app/study-library.tsx', `
import {useState} from 'react';

const EXTRAORDINARY = [
  ['任脉', '主要体表路线沿人体前正中线。具有本经所属穴位。'],
  ['督脉', '主要体表路线沿背部正中线，经头部至面部。具有本经所属穴位。'],
  ['冲脉', '循行涉及腹部、胸部及下肢等，存在分支与体内路线，不能只用一条前腹直线表示。'],
  ['带脉', '循行具有环绕腰腹部的特点，不能简单等同于任意水平腰围线。'],
  ['阴跷脉', '循行涉及内踝、下肢内侧及头面部等。'],
  ['阳跷脉', '循行涉及外踝、下肢外侧、躯干及头面部等。'],
  ['阴维脉', '循行涉及下肢内侧、腹胸及咽喉等。'],
  ['阳维脉', '循行涉及下肢外侧、躯干、肩颈及头部等。']
];

const POINTS = [
  ['LU9', '太渊', '手太阴肺经', '腕前区'],
  ['LI4', '合谷', '手阳明大肠经', '手背'],
  ['ST36', '足三里', '足阳明胃经', '小腿前外侧'],
  ['SP6', '三阴交', '足太阴脾经', '小腿内侧'],
  ['HT7', '神门', '手少阴心经', '腕前区'],
  ['SI3', '后溪', '手太阳小肠经', '手尺侧'],
  ['BL40', '委中', '足太阳膀胱经', '膝后区'],
  ['KI3', '太溪', '足少阴肾经', '踝内侧'],
  ['PC6', '内关', '手厥阴心包经', '前臂前区'],
  ['TE5', '外关', '手少阳三焦经', '前臂后区'],
  ['GB34', '阳陵泉', '足少阳胆经', '小腿外侧'],
  ['LR3', '太冲', '足厥阴肝经', '足背'],
  ['CV12', '中脘', '任脉', '上腹部'],
  ['CV6', '气海', '任脉', '下腹部'],
  ['GV20', '百会', '督脉', '头顶部'],
  ['GV14', '大椎', '督脉', '后正中线第七颈椎棘突下方区域']
];

export function StudyLibrary() {
  const [query, setQuery] = useState('');
  const filtered = POINTS.filter(point =>
    point.join(' ').toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div style={{borderTop:'1px solid #dce3d8',marginTop:14,paddingTop:10}}>
      <details>
        <summary style={{cursor:'pointer',fontWeight:600}}>
          奇经八脉 · 文字资料
        </summary>
        <p className="mp-note">
          本区尚未关联三维路线。以下为概要，不是完整循行原文。
        </p>
        {EXTRAORDINARY.map(([name, description]) => (
          <div className="mp-info" key={name}>
            <strong>{name}</strong>
            <p>{description}</p>
          </div>
        ))}
        <p className="mp-note">
          十二正经加任脉、督脉，通常合称十四经。
          奇经八脉中，除任督二脉外，其余六脉没有本经专属穴位，
          而与其他经脉的穴位发生交会关系。
        </p>
      </details>

      <details style={{marginTop:12}}>
        <summary style={{cursor:'pointer',fontWeight:600}}>
          穴位资料 · 16个学习示例
        </summary>
        <p className="mp-note">
          目前只有名称、归经与大致区域，尚未进行3D定位。
          “区域”不等于标准取穴方法。
        </p>
        <input
          className="mp-search"
          placeholder="搜索穴位、代码或经脉"
          aria-label="搜索穴位资料"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        {filtered.map(([code, name, meridian, region]) => (
          <div className="mp-info" key={code}>
            <strong>{name} · {code}</strong>
            <p>归经：{meridian}</p>
            <p>大致区域：{region}</p>
            <p className="mp-note">三维标注状态：未定位</p>
          </div>
        ))}
        {filtered.length === 0 && <p>示例库中暂无匹配项。</p>}
      </details>

      <details style={{marginTop:12}}>
        <summary style={{cursor:'pointer',fontWeight:600}}>
          五脏六腑与解剖模型
        </summary>
        <div className="mp-info">
          <p>五脏：心、肝、脾、肺、肾。</p>
          <p>六腑：胆、胃、小肠、大肠、膀胱、三焦。</p>
          <p>
            中医脏腑是传统医学的功能理论概念，
            与现代解剖器官有联系，但不能完全等同。
          </p>
          <p>
            模型里的胆囊、心脏、肝脏等使用现代解剖名称。
            三焦不对应某一个独立的现代解剖器官，
            因此不创建虚构的“三焦器官”模型。
          </p>
        </div>
      </details>
    </div>
  );
}
`);

study = "import {StudyLibrary} from './study-library';\n" + study;

study = replaceRequired(
  study,
  '{suspended && (',
  '<StudyLibrary />\n\n            {suspended && (',
  '插入学习资料模块'
);
changes.set('app/meridian-study.tsx', study);

/* ---------- 备份，然后写入 ---------- */

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(
  path.dirname(root),
  'human-atlas-chinese-backup-' + stamp
);

for (const relative of changes.keys()) {
  const original = path.join(root, relative);
  if (!fs.existsSync(original)) continue;

  const destination = path.join(backup, relative);
  fs.mkdirSync(path.dirname(destination), {recursive:true});
  fs.copyFileSync(original, destination);
}

for (const [relative, content] of changes) {
  const destination = path.join(root, relative);
  fs.mkdirSync(path.dirname(destination), {recursive:true});
  fs.writeFileSync(destination, content, 'utf8');
}

console.log('中文界面和学习资料模块已写入。');
console.log('备份位置：' + backup);
console.log('常见术语已收录；其他解剖名称会标记“中文待校对”。');
console.log('八脉与穴位目前为文字资料，不是三维定位。');
console.log('请执行 npm.cmd run check 和 npm.cmd run build 检查。');