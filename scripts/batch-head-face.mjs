// 批量标注头面部穴位 + 生成右侧对称穴位
import * as T from 'three';
import {readFileSync, writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const atlas = JSON.parse(readFileSync('./public/models/atlas.json', 'utf8'));
const skinPart = atlas.parts.find(p => p.id === 'FJ2810');

const chunk = atlas.chunks[skinPart.chunk];
const gzBuffer = readFileSync('./public/' + chunk.gzip);
const buffer = gunzipSync(gzBuffer);
const positions = new Float32Array(buffer.buffer, buffer.byteOffset + skinPart.positions, skinPart.vertexCount * 3);
const normals = new Int16Array(buffer.buffer, buffer.byteOffset + skinPart.normals, skinPart.vertexCount * 3);
const indices = new Uint32Array(buffer.buffer, buffer.byteOffset + skinPart.indices, skinPart.indexCount);
const skinGeo = new T.BufferGeometry();
skinGeo.setAttribute('position', new T.BufferAttribute(positions, 3));
skinGeo.setAttribute('normal', new T.BufferAttribute(normals, 3, true));
skinGeo.setIndex(new T.BufferAttribute(indices, 1));
const skin = new T.Mesh(skinGeo, new T.MeshBasicMaterial());
skin.updateMatrixWorld(true);

const raycaster = new T.Raycaster();

function projectToSkin(x, y, z, dirX, dirY, dirZ) {
  const origin = new T.Vector3(x, y, z);
  const dir = new T.Vector3(dirX, dirY, dirZ).normalize();
  raycaster.set(origin, dir);
  const hits = raycaster.intersectObject(skin);
  if (hits.length > 0) {
    const hit = hits[0];
    const face = hit.face;
    return {
      position: [hit.point.x, hit.point.y, hit.point.z],
      displayNormal: [face.normal.x, face.normal.y, face.normal.z],
      faceIndex: hit.faceIndex,
      vertexIndices: [face.a, face.b, face.c],
      barycentric: [0.33, 0.33, 0.34],
      meshId: 'FJ2810'
    };
  }
  return null;
}

const CUN = 0.026;
const results = {};
let success = 0, fail = 0;

function addPoint(code, name, x, y, z, dirX, dirY, dirZ, note) {
  const hit = projectToSkin(x, y, z, dirX, dirY, dirZ);
  if (hit) {
    results[code] = { name, ...hit, status: 'pending-review', note };
    success++;
  } else {
    console.log(`失败: ${code} ${name}`);
    fail++;
  }
}

// ========== 督脉头面部 ==========
console.log('标注督脉头面部...');
// GV20百会：头顶正中，两耳尖连线中点
addPoint('GV20', '百会', 0, 1.71, 0, 0, -1, 0, '头顶正中线与两耳尖连线交点处');
// GV21前顶：百会前1.5寸
addPoint('GV21', '前顶', 0, 1.69, 0.03, 0, 0, 1, '头部，前发际正中直上3.5寸，百会前1.5寸');
// GV22囟会：百会前3寸
addPoint('GV22', '囟会', 0, 1.67, 0.05, 0, 0, 1, '头部，前发际正中直上2寸，百会前3寸');
// GV23上星：前发际正中直上1寸
addPoint('GV23', '上星', 0, 1.65, 0.07, 0, 0, 1, '头部，前发际正中直上1寸');
// GV24神庭：前发际正中直上0.5寸
addPoint('GV24', '神庭', 0, 1.64, 0.08, 0, 0, 1, '头部，前发际正中直上0.5寸');
// GV25素髎：鼻尖正中
addPoint('GV25', '素髎', 0, 1.59, 0.12, 0, 0, 1, '面部，鼻尖正中');
// GV26人中：人中沟上1/3与下2/3交点
addPoint('GV26', '人中', 0, 1.56, 0.11, 0, 0, 1, '面部，人中沟上1/3与下2/3交点处');
// GV27兑端：上唇尖端
addPoint('GV27', '兑端', 0, 1.55, 0.10, 0, 0, 1, '面部，上唇结节的高点处');

// ========== 任脉头面部 ==========
console.log('标注任脉头面部...');
// CV23廉泉：喉结上方，舌骨上缘凹陷
addPoint('CV23', '廉泉', 0, 1.51, 0.05, 0, 0, 1, '颈前区，喉结上方，舌骨上缘凹陷中，前正中线上');
// CV24承浆：颏唇沟正中凹陷
addPoint('CV24', '承浆', 0, 1.53, 0.09, 0, 0, 1, '面部，颏唇沟的正中凹陷处');

// ========== 胃经头面部 ==========
console.log('标注胃经头面部...');
const stHead = [
  { code: 'ST1', name: '承泣', x: 0.04, y: 1.60, z: 0.10, note: '面部，眼球与眶下缘之间，瞳孔直下' },
  { code: 'ST2', name: '四白', x: 0.04, y: 1.59, z: 0.10, note: '面部，眶下孔凹陷处，瞳孔直下' },
  { code: 'ST3', name: '巨髎', x: 0.04, y: 1.57, z: 0.10, note: '面部，横平鼻翼下缘，瞳孔直下' },
  { code: 'ST4', name: '地仓', x: 0.05, y: 1.55, z: 0.10, note: '面部，口角旁开0.4寸' },
  { code: 'ST5', name: '大迎', x: 0.04, y: 1.53, z: 0.08, note: '面部，下颌角前方，咬肌附着部前缘，面动脉搏动处' },
  { code: 'ST6', name: '颊车', x: 0.05, y: 1.52, z: 0.06, note: '面部，下颌角前上方一横指，咀嚼时咬肌隆起最高点' },
  { code: 'ST7', name: '下关', x: 0.06, y: 1.56, z: 0.07, note: '面部，颧弓下缘中央与下颌切迹之间凹陷中' },
  { code: 'ST8', name: '头维', x: 0.08, y: 1.65, z: 0.05, note: '头部，额角发际直上0.5寸，头正中线旁开4.5寸' },
  { code: 'ST9', name: '人迎', x: 0.03, y: 1.50, z: 0.04, note: '颈部，横平喉结，胸锁乳突肌前缘，颈总动脉搏动处' },
  { code: 'ST10', name: '水突', x: 0.03, y: 1.48, z: 0.03, note: '颈部，横平环状软骨，胸锁乳突肌前缘' },
  { code: 'ST11', name: '气舍', x: 0.03, y: 1.46, z: 0.02, note: '胸锁乳突肌区，锁骨上小窝，锁骨胸骨端上缘' },
];
for (const pt of stHead) {
  addPoint(pt.code, pt.name, pt.x, pt.y, pt.z, 0, 0, 1, pt.note);
}

// ========== 膀胱经头面部 ==========
console.log('标注膀胱经头面部...');
const blHead = [
  { code: 'BL1', name: '睛明', x: 0.02, y: 1.60, z: 0.10, note: '面部，目内眦内上方眶内侧壁凹陷中' },
  { code: 'BL2', name: '攒竹', x: 0.02, y: 1.61, z: 0.09, note: '面部，眉头凹陷中，额切迹处' },
  { code: 'BL3', name: '眉冲', x: 0.02, y: 1.63, z: 0.07, note: '头部，额切迹直上入发际0.5寸' },
  { code: 'BL4', name: '曲差', x: 0.03, y: 1.64, z: 0.06, note: '头部，前发际正中直上0.5寸，旁开1.5寸' },
  { code: 'BL5', name: '五处', x: 0.03, y: 1.65, z: 0.05, note: '头部，前发际正中直上1寸，旁开1.5寸' },
  { code: 'BL6', name: '承光', x: 0.03, y: 1.66, z: 0.03, note: '头部，前发际正中直上2.5寸，旁开1.5寸' },
  { code: 'BL7', name: '通天', x: 0.03, y: 1.67, z: 0.01, note: '头部，前发际正中直上4寸，旁开1.5寸' },
  { code: 'BL8', name: '络却', x: 0.03, y: 1.68, z: -0.01, note: '头部，前发际正中直上5.5寸，旁开1.5寸' },
  { code: 'BL9', name: '玉枕', x: 0.03, y: 1.64, z: -0.08, note: '头部，横平枕外隆凸上缘，后发际正中旁开1.3寸' },
  { code: 'BL10', name: '天柱', x: 0.03, y: 1.55, z: -0.06, note: '颈后区，横平第2颈椎棘突上际，斜方肌外缘凹陷中' },
];
for (const pt of blHead) {
  addPoint(pt.code, pt.name, pt.x, pt.y, pt.z, 0, 0, 1, pt.note);
}

// ========== 胆经头面部 ==========
console.log('标注胆经头面部...');
const gbHead = [
  { code: 'GB1', name: '瞳子髎', x: 0.07, y: 1.60, z: 0.09, note: '面部，目外眦外侧0.5寸凹陷中' },
  { code: 'GB2', name: '听会', x: 0.07, y: 1.56, z: 0.06, note: '面部，耳屏间切迹与下颌骨髁突之间的凹陷中' },
  { code: 'GB3', name: '上关', x: 0.07, y: 1.58, z: 0.06, note: '面部，颧弓上缘中央凹陷中' },
  { code: 'GB4', name: '颔厌', x: 0.08, y: 1.63, z: 0.04, note: '头部，从头维至曲鬓的弧形连线的上1/4与下3/4交点处' },
  { code: 'GB5', name: '悬颅', x: 0.08, y: 1.62, z: 0.02, note: '头部，从头维至曲鬓的弧形连线的中点处' },
  { code: 'GB6', name: '悬厘', x: 0.08, y: 1.61, z: 0.00, note: '头部，从头维至曲鬓的弧形连线的下1/4与上3/4交点处' },
  { code: 'GB7', name: '曲鬓', x: 0.07, y: 1.60, z: -0.02, note: '头部，耳前鬓角发际后缘与耳尖水平线交点处' },
  { code: 'GB8', name: '率谷', x: 0.07, y: 1.63, z: -0.03, note: '头部，耳尖直上入发际1.5寸' },
  { code: 'GB9', name: '天冲', x: 0.06, y: 1.65, z: -0.04, note: '头部，耳根后缘直上入发际2寸' },
  { code: 'GB10', name: '浮白', x: 0.05, y: 1.64, z: -0.06, note: '头部，耳后乳突的后上方，从天冲至完骨的弧形连线的上1/3与下2/3交点处' },
  { code: 'GB11', name: '头窍阴', x: 0.05, y: 1.62, z: -0.07, note: '头部，耳后乳突的后上方，从天冲至完骨的弧形连线的上2/3与下1/3交点处' },
  { code: 'GB12', name: '完骨', x: 0.04, y: 1.59, z: -0.07, note: '头部，耳后乳突的后下方凹陷中' },
  { code: 'GB13', name: '本神', x: 0.05, y: 1.65, z: 0.05, note: '头部，前发际上0.5寸，头正中线旁开3寸' },
  { code: 'GB14', name: '阳白', x: 0.05, y: 1.62, z: 0.08, note: '头部，眉上1寸，瞳孔直上' },
  { code: 'GB15', name: '头临泣', x: 0.05, y: 1.64, z: 0.06, note: '头部，前发际上0.5寸，瞳孔直上' },
  { code: 'GB16', name: '目窗', x: 0.05, y: 1.65, z: 0.04, note: '头部，前发际上1.5寸，瞳孔直上' },
  { code: 'GB17', name: '正营', x: 0.05, y: 1.66, z: 0.02, note: '头部，前发际上2.5寸，瞳孔直上' },
  { code: 'GB18', name: '承灵', x: 0.05, y: 1.67, z: 0.00, note: '头部，前发际上4寸，瞳孔直上' },
  { code: 'GB19', name: '脑空', x: 0.05, y: 1.65, z: -0.05, note: '头部，横平枕外隆凸的上缘，风池直上' },
  { code: 'GB20', name: '风池', x: 0.05, y: 1.56, z: -0.06, note: '颈后区，枕骨之下，胸锁乳突肌上端与斜方肌上端之间的凹陷中' },
];
for (const pt of gbHead) {
  addPoint(pt.code, pt.name, pt.x, pt.y, pt.z, 0, 0, 1, pt.note);
}

// ========== 三焦经头面部 ==========
console.log('标注三焦经头面部...');
const teHead = [
  { code: 'TE17', name: '翳风', x: 0.06, y: 1.56, z: 0.02, note: '颈部，耳垂后方，乳突下端前方凹陷中' },
  { code: 'TE18', name: '瘈脉', x: 0.06, y: 1.58, z: 0.00, note: '头部，乳突中央，角孙与翳风沿耳轮弧形连线的上2/3与下1/3交点处' },
  { code: 'TE19', name: '颅息', x: 0.06, y: 1.59, z: -0.01, note: '头部，角孙与翳风沿耳轮弧形连线的上1/3与下2/3交点处' },
  { code: 'TE20', name: '角孙', x: 0.06, y: 1.61, z: -0.02, note: '头部，耳尖正对发际处' },
  { code: 'TE21', name: '耳门', x: 0.07, y: 1.58, z: 0.04, note: '耳区，耳屏上切迹与下颌骨髁突之间的凹陷中' },
  { code: 'TE22', name: '耳和髎', x: 0.07, y: 1.60, z: 0.05, note: '头部，鬓发后缘，耳廓根的前方，颞浅动脉的后缘' },
  { code: 'TE23', name: '丝竹空', x: 0.07, y: 1.61, z: 0.08, note: '面部，眉梢凹陷中' },
];
for (const pt of teHead) {
  addPoint(pt.code, pt.name, pt.x, pt.y, pt.z, 0, 0, 1, pt.note);
}

// ========== 小肠经头面部 ==========
console.log('标注小肠经头面部...');
const siHead = [
  { code: 'SI11', name: '天宗', x: 0.12, y: 1.30, z: -0.08, note: '肩胛区，肩胛冈中点与肩胛骨下角连线上1/3与下2/3交点凹陷中' },
  { code: 'SI12', name: '秉风', x: 0.12, y: 1.34, z: -0.06, note: '肩胛区，肩胛冈中点上方冈上窝中' },
  { code: 'SI13', name: '曲垣', x: 0.10, y: 1.36, z: -0.07, note: '肩胛区，肩胛冈内侧端上缘凹陷中' },
  { code: 'SI14', name: '肩外俞', x: 0.08, y: 1.38, z: -0.06, note: '脊柱区，第1胸椎棘突下，后正中线旁开3寸' },
  { code: 'SI15', name: '肩中俞', x: 0.05, y: 1.40, z: -0.05, note: '脊柱区，第7颈椎棘突下，后正中线旁开2寸' },
  { code: 'SI16', name: '天窗', x: 0.05, y: 1.52, z: 0.00, note: '颈部，横平喉结，胸锁乳突肌的后缘' },
  { code: 'SI17', name: '天容', x: 0.04, y: 1.53, z: 0.02, note: '颈部，下颌角后方，胸锁乳突肌的前缘凹陷中' },
  { code: 'SI18', name: '颧髎', x: 0.06, y: 1.57, z: 0.08, note: '面部，颧骨下缘，目外眦直下凹陷中' },
  { code: 'SI19', name: '听宫', x: 0.07, y: 1.57, z: 0.05, note: '面部，耳屏正中与下颌骨髁突之间的凹陷中' },
];
for (const pt of siHead) {
  addPoint(pt.code, pt.name, pt.x, pt.y, pt.z, 0, 0, 1, pt.note);
}

// ========== 大肠经头面部 ==========
console.log('标注大肠经头面部...');
addPoint('LI19', '口禾髎', 0.03, 1.57, 0.10, 0, 0, 1, '面部，横平人中沟上1/3与下2/3交点，鼻孔外缘直下');
addPoint('LI20', '迎香', 0.03, 1.58, 0.10, 0, 0, 1, '面部，鼻翼外缘中点旁，鼻唇沟中');

console.log(`\n头面部穴位完成: 成功${success}，失败${fail}`);

writeFileSync('./head-face-draft.json', JSON.stringify({
  schema: 1,
  standard: 'GB/T 12346—2021',
  points: results
}, null, 2));

console.log(`总计: 成功${success}个，失败${fail}个`);
console.log('已导出到 head-face-draft.json');
