// 批量标注下肢穴位
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

// 下肢骨性标志Y坐标
const femur = { minY: 0.446, maxY: 0.912 }; // 股骨
const patella = { minY: 0.440, maxY: 0.479 }; // 髌骨
const tibia = { minY: 0.072, maxY: 0.452 }; // 胫骨
const fibula = { minY: 0.053, maxY: 0.437 }; // 腓骨

const hipY = 0.91; // 股骨大转子Y
const kneeY = 0.45; // 膝横纹Y（髌骨下缘）
const ankleY = 0.07; // 踝横纹Y

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

// ========== 胃经下肢（ST31-ST45） ==========
console.log('标注胃经下肢穴位...');
const stLower = [
  { code: 'ST31', name: '髀关', y: hipY - 1 * CUN, x: 0.15, note: '大腿前面，髂前上棘与髌底外侧端连线上，屈股时平会阴' },
  { code: 'ST32', name: '伏兔', y: hipY - 4 * CUN, x: 0.15, note: '大腿前面，髂前上棘与髌底外侧端连线上，髌底上6寸' },
  { code: 'ST33', name: '阴市', y: kneeY + 3 * CUN, x: 0.15, note: '大腿前面，髂前上棘与髌底外侧端连线上，髌底上3寸' },
  { code: 'ST34', name: '梁丘', y: kneeY + 2 * CUN, x: 0.15, note: '大腿前面，髂前上棘与髌底外侧端连线上，髌底上2寸' },
  { code: 'ST35', name: '犊鼻', y: kneeY, x: 0.12, note: '膝部，髌韧带外侧凹陷中' },
  { code: 'ST36', name: '足三里', y: kneeY - 3 * CUN, x: 0.12, note: '小腿外侧，犊鼻下3寸，犊鼻与解溪连线上' },
  { code: 'ST37', name: '上巨虚', y: kneeY - 6 * CUN, x: 0.12, note: '小腿外侧，犊鼻下6寸，犊鼻与解溪连线上' },
  { code: 'ST38', name: '条口', y: kneeY - 8 * CUN, x: 0.12, note: '小腿外侧，犊鼻下8寸，犊鼻与解溪连线上' },
  { code: 'ST39', name: '下巨虚', y: kneeY - 9 * CUN, x: 0.12, note: '小腿外侧，犊鼻下9寸，犊鼻与解溪连线上' },
  { code: 'ST40', name: '丰隆', y: kneeY - 8 * CUN, x: 0.14, note: '小腿外侧，外踝尖上8寸，胫骨前肌外缘' },
  { code: 'ST41', name: '解溪', y: ankleY, x: 0.1, note: '踝区，踝关节前面中央凹陷中，拇长伸肌腱与趾长伸肌腱之间' },
  { code: 'ST42', name: '冲阳', y: ankleY - 1 * CUN, x: 0.1, note: '足背，第2跖骨基底部与中间楔骨关节处' },
  { code: 'ST43', name: '陷谷', y: ankleY - 2 * CUN, x: 0.08, note: '足背，第2、3跖骨间，第2跖趾关节近端凹陷中' },
  { code: 'ST44', name: '内庭', y: ankleY - 2.5 * CUN, x: 0.06, note: '足背，第2、3趾间，趾蹼缘后方赤白肉际处' },
  { code: 'ST45', name: '厉兑', y: ankleY - 3 * CUN, x: 0.05, note: '足第2趾末节外侧，距趾甲角0.1寸' },
];
for (const pt of stLower) {
  addPoint(pt.code, pt.name, pt.x, pt.y, 0.15, 0, 0, -1, pt.note);
}

// ========== 脾经下肢（SP1-SP11） ==========
console.log('标注脾经下肢穴位...');
const spLower = [
  { code: 'SP1', name: '隐白', y: ankleY - 3 * CUN, x: 0.03, note: '足大趾末节内侧，距趾甲角0.1寸' },
  { code: 'SP2', name: '大都', y: ankleY - 2.5 * CUN, x: 0.04, note: '足内侧，第1跖趾关节远端赤白肉际凹陷中' },
  { code: 'SP3', name: '太白', y: ankleY - 2 * CUN, x: 0.05, note: '足内侧，第1跖趾关节近端赤白肉际凹陷中' },
  { code: 'SP4', name: '公孙', y: ankleY - 1.5 * CUN, x: 0.06, note: '足内侧，第1跖骨底的前下缘赤白肉际处' },
  { code: 'SP5', name: '商丘', y: ankleY, x: 0.05, note: '踝区，内踝前下方，舟骨粗隆与内踝尖连线中点凹陷中' },
  { code: 'SP6', name: '三阴交', y: ankleY + 3 * CUN, x: 0.06, note: '小腿内侧，内踝尖上3寸，胫骨内侧缘后际' },
  { code: 'SP7', name: '漏谷', y: ankleY + 6 * CUN, x: 0.06, note: '小腿内侧，内踝尖上6寸，胫骨内侧缘后际' },
  { code: 'SP8', name: '地机', y: ankleY + 8 * CUN, x: 0.06, note: '小腿内侧，阴陵泉下3寸，胫骨内侧缘后际' },
  { code: 'SP9', name: '阴陵泉', y: kneeY - 1 * CUN, x: 0.07, note: '小腿内侧，胫骨内侧髁下缘与胫骨内侧缘之间的凹陷中' },
  { code: 'SP10', name: '血海', y: kneeY + 2 * CUN, x: 0.08, note: '股前区，髌底内侧端上2寸，股内侧肌隆起处' },
  { code: 'SP11', name: '箕门', y: kneeY + 5 * CUN, x: 0.08, note: '股前区，髌底内侧端与冲门连线上1/3与下2/3交点' },
];
for (const pt of spLower) {
  addPoint(pt.code, pt.name, pt.x, pt.y, 0.1, 0, 0, -1, pt.note);
}

// ========== 肝经下肢（LR1-LR12） ==========
console.log('标注肝经下肢穴位...');
const lrLower = [
  { code: 'LR1', name: '大敦', y: ankleY - 3 * CUN, x: 0.02, note: '足大趾末节外侧，距趾甲角0.1寸' },
  { code: 'LR2', name: '行间', y: ankleY - 2.5 * CUN, x: 0.04, note: '足背，第1、2趾间，趾蹼缘后方赤白肉际处' },
  { code: 'LR3', name: '太冲', y: ankleY - 2 * CUN, x: 0.05, note: '足背，第1、2跖骨间，跖骨底结合部前方凹陷中' },
  { code: 'LR4', name: '中封', y: ankleY, x: 0.04, note: '踝区，内踝前，胫骨前肌肌腱的内侧缘凹陷中' },
  { code: 'LR5', name: '蠡沟', y: ankleY + 5 * CUN, x: 0.05, note: '小腿内侧，内踝尖上5寸，胫骨内侧面的中央' },
  { code: 'LR6', name: '中都', y: ankleY + 7 * CUN, x: 0.05, note: '小腿内侧，内踝尖上7寸，胫骨内侧面的中央' },
  { code: 'LR7', name: '膝关', y: kneeY - 1 * CUN, x: 0.06, note: '膝部，胫骨内侧髁的下方，阴陵泉后1寸' },
  { code: 'LR8', name: '曲泉', y: kneeY, x: 0.05, note: '膝部，腘横纹内侧端，半腱肌肌腱内缘凹陷中' },
  { code: 'LR9', name: '阴包', y: kneeY + 4 * CUN, x: 0.06, note: '股前区，髌底上4寸，股内肌与缝匠肌之间' },
  { code: 'LR10', name: '足五里', y: hipY - 2 * CUN, x: 0.07, note: '股前区，气冲直下3寸，动脉搏动处' },
  { code: 'LR11', name: '阴廉', y: hipY - 1 * CUN, x: 0.07, note: '股前区，气冲直下2寸' },
  { code: 'LR12', name: '急脉', y: hipY, x: 0.06, note: '腹股沟区，横平耻骨联合上缘，前正中线旁开2.5寸' },
];
for (const pt of lrLower) {
  addPoint(pt.code, pt.name, pt.x, pt.y, 0.1, 0, 0, -1, pt.note);
}

// ========== 胆经下肢（GB30-GB44） ==========
console.log('标注胆经下肢穴位...');
const gbLower = [
  { code: 'GB30', name: '环跳', y: hipY - 1 * CUN, x: 0.12, note: '臀区，股骨大转子最凸点与骶管裂孔连线的外1/3与内2/3交点处' },
  { code: 'GB31', name: '风市', y: hipY - 5 * CUN, x: 0.14, note: '股部，髌底上7寸，髂胫束与股外侧肌之间' },
  { code: 'GB32', name: '中渎', y: hipY - 6 * CUN, x: 0.14, note: '股部，腘横纹上5寸，髂胫束与股外侧肌之间' },
  { code: 'GB33', name: '膝阳关', y: kneeY, x: 0.13, note: '膝部，股骨外上髁后上缘，股二头肌腱与髂胫束之间的凹陷中' },
  { code: 'GB34', name: '阳陵泉', y: kneeY - 1 * CUN, x: 0.13, note: '小腿外侧，腓骨头前下方凹陷中' },
  { code: 'GB35', name: '阳交', y: ankleY + 7 * CUN, x: 0.14, note: '小腿外侧，外踝尖上7寸，腓骨后缘' },
  { code: 'GB36', name: '外丘', y: ankleY + 7 * CUN, x: 0.13, note: '小腿外侧，外踝尖上7寸，腓骨前缘' },
  { code: 'GB37', name: '光明', y: ankleY + 5 * CUN, x: 0.13, note: '小腿外侧，外踝尖上5寸，腓骨前缘' },
  { code: 'GB38', name: '阳辅', y: ankleY + 4 * CUN, x: 0.13, note: '小腿外侧，外踝尖上4寸，腓骨前缘' },
  { code: 'GB39', name: '悬钟', y: ankleY + 3 * CUN, x: 0.13, note: '小腿外侧，外踝尖上3寸，腓骨前缘' },
  { code: 'GB40', name: '丘墟', y: ankleY, x: 0.12, note: '踝区，外踝的前下方，趾长伸肌腱的外侧凹陷中' },
  { code: 'GB41', name: '足临泣', y: ankleY - 1.5 * CUN, x: 0.1, note: '足背，第4、5跖骨底结合部的前方，第5趾长伸肌腱外侧凹陷中' },
  { code: 'GB42', name: '地五会', y: ankleY - 2 * CUN, x: 0.09, note: '足背，第4、5跖骨间，第4跖趾关节近端凹陷中' },
  { code: 'GB43', name: '侠溪', y: ankleY - 2.5 * CUN, x: 0.08, note: '足背，第4、5趾间，趾蹼缘后方赤白肉际处' },
  { code: 'GB44', name: '足窍阴', y: ankleY - 3 * CUN, x: 0.07, note: '足第4趾末节外侧，距趾甲角0.1寸' },
];
for (const pt of gbLower) {
  addPoint(pt.code, pt.name, pt.x, pt.y, -0.1, 0, 0, 1, pt.note);
}

// ========== 膀胱经下肢（BL36-BL67） ==========
console.log('标注膀胱经下肢穴位...');
const blLower = [
  { code: 'BL36', name: '承扶', y: hipY - 1 * CUN, x: 0.1, note: '股后区，臀沟的中点' },
  { code: 'BL37', name: '殷门', y: hipY - 4 * CUN, x: 0.1, note: '股后区，臀沟下6寸，股二头肌与半腱肌之间' },
  { code: 'BL38', name: '浮郄', y: kneeY + 1 * CUN, x: 0.1, note: '膝后区，腘横纹上1寸，股二头肌腱的内侧缘' },
  { code: 'BL39', name: '委阳', y: kneeY, x: 0.11, note: '膝部，腘横纹上，股二头肌腱的内侧缘' },
  { code: 'BL40', name: '委中', y: kneeY, x: 0.09, note: '膝后区，腘横纹中点' },
  { code: 'BL55', name: '合阳', y: kneeY - 2 * CUN, x: 0.09, note: '小腿后区，腘横纹下2寸，腓肠肌内、外侧头之间' },
  { code: 'BL56', name: '承筋', y: kneeY - 4 * CUN, x: 0.09, note: '小腿后区，腘横纹下5寸，腓肠肌两肌腹之间' },
  { code: 'BL57', name: '承山', y: kneeY - 7 * CUN, x: 0.09, note: '小腿后区，腓肠肌两肌腹与肌腱交角处' },
  { code: 'BL58', name: '飞扬', y: kneeY - 8 * CUN, x: 0.11, note: '小腿后区，昆仑直上7寸，腓肠肌外下缘与跟腱移行处' },
  { code: 'BL59', name: '跗阳', y: ankleY + 3 * CUN, x: 0.11, note: '小腿后区，昆仑直上3寸，腓骨与跟腱之间' },
  { code: 'BL60', name: '昆仑', y: ankleY, x: 0.1, note: '踝区，外踝尖与跟腱之间的凹陷中' },
  { code: 'BL61', name: '仆参', y: ankleY - 0.5 * CUN, x: 0.11, note: '跟区，昆仑直下，跟骨外侧，赤白肉际处' },
  { code: 'BL62', name: '申脉', y: ankleY, x: 0.12, note: '踝区，外踝尖直下，外踝下缘与跟骨之间凹陷中' },
  { code: 'BL63', name: '金门', y: ankleY + 0.5 * CUN, x: 0.12, note: '足背，外踝前缘直下，第5跖骨粗隆后方，骰骨下缘凹陷中' },
  { code: 'BL64', name: '京骨', y: ankleY - 1 * CUN, x: 0.11, note: '跖区，第5跖骨粗隆前下方，赤白肉际处' },
  { code: 'BL65', name: '束骨', y: ankleY - 1.5 * CUN, x: 0.1, note: '跖区，第5跖趾关节的近端，赤白肉际处' },
  { code: 'BL66', name: '足通谷', y: ankleY - 2 * CUN, x: 0.09, note: '跖区，第5跖趾关节的远端，赤白肉际处' },
  { code: 'BL67', name: '至阴', y: ankleY - 2.5 * CUN, x: 0.08, note: '足小趾末节外侧，距趾甲角0.1寸' },
];
for (const pt of blLower) {
  addPoint(pt.code, pt.name, pt.x, pt.y, -0.1, 0, 0, 1, pt.note);
}

// ========== 肾经下肢（KI1-KI10） ==========
console.log('标注肾经下肢穴位...');
const kiLower = [
  { code: 'KI1', name: '涌泉', y: ankleY - 2 * CUN, x: 0.05, note: '足底，屈足卷趾时足心最凹陷中' },
  { code: 'KI2', name: '然谷', y: ankleY - 0.5 * CUN, x: 0.04, note: '足内侧，足舟骨粗隆下方，赤白肉际处' },
  { code: 'KI3', name: '太溪', y: ankleY, x: 0.04, note: '踝区，内踝尖与跟腱之间的凹陷中' },
  { code: 'KI4', name: '大钟', y: ankleY + 0.5 * CUN, x: 0.04, note: '踝区，内踝后下方，跟骨上缘，跟腱附着部前缘凹陷中' },
  { code: 'KI5', name: '水泉', y: ankleY + 1 * CUN, x: 0.04, note: '踝区，太溪直下1寸，跟骨结节内侧凹陷中' },
  { code: 'KI6', name: '照海', y: ankleY, x: 0.03, note: '踝区，内踝尖下1寸，内踝下缘边际凹陷中' },
  { code: 'KI7', name: '复溜', y: ankleY + 2 * CUN, x: 0.04, note: '小腿内侧，内踝尖上2寸，跟腱的前缘' },
  { code: 'KI8', name: '交信', y: ankleY + 2 * CUN, x: 0.05, note: '小腿内侧，内踝尖上2寸，胫骨内侧缘后际凹陷中' },
  { code: 'KI9', name: '筑宾', y: ankleY + 5 * CUN, x: 0.05, note: '小腿内侧，太溪直上5寸，比目鱼肌与跟腱之间' },
  { code: 'KI10', name: '阴谷', y: kneeY, x: 0.05, note: '膝后区，腘横纹上，半腱肌肌腱与半膜肌肌腱之间' },
];
for (const pt of kiLower) {
  addPoint(pt.code, pt.name, pt.x, pt.y, 0.08, 0, 0, -1, pt.note);
}

console.log(`\n下肢穴位完成: 成功${success}，失败${fail}`);

writeFileSync('./lower-limb-draft.json', JSON.stringify({
  schema: 1,
  standard: 'GB/T 12346—2021',
  points: results
}, null, 2));

console.log(`总计: 成功${success}个，失败${fail}个`);
console.log('已导出到 lower-limb-draft.json');
