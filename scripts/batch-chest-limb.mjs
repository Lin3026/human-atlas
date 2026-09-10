// 综合批量标注：胸部+上肢+下肢+头面部穴位
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

const CUN = 0.026; // 1寸≈0.026m

// 肋骨Y坐标（最下端）
const ribMinY = {
  1: 1.388, 2: 1.352, 3: 1.322, 4: 1.289, 5: 1.250,
  6: 1.216, 7: 1.183, 8: 1.153, 9: 1.128, 10: 1.101, 11: 1.086
};
// 肋间隙Y = (上肋最下端 + 下肋最上端)/2，简化用肋中点
function getIntercostalY(n) {
  return (ribMinY[n] + ribMinY[n+1]) / 2;
}

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

// ========== 胸部穴位 ==========
console.log('标注胸部穴位...');

// 胃经胸部（ST12-ST18，旁开正中线4寸）
const stChest = [
  { code: 'ST12', name: '缺盆', rib: 1, x: 4 * CUN, note: '锁骨上窝中央' },
  { code: 'ST13', name: '气户', rib: 1, x: 4 * CUN, note: '锁骨下缘' },
  { code: 'ST14', name: '库房', rib: 1, x: 4 * CUN, note: '第1肋间隙' },
  { code: 'ST15', name: '屋翳', rib: 2, x: 4 * CUN, note: '第2肋间隙' },
  { code: 'ST16', name: '膺窗', rib: 3, x: 4 * CUN, note: '第3肋间隙' },
  { code: 'ST17', name: '乳中', rib: 4, x: 4 * CUN, note: '乳头中央' },
  { code: 'ST18', name: '乳根', rib: 5, x: 4 * CUN, note: '第5肋间隙' },
];
for (const pt of stChest) {
  const y = getIntercostalY(pt.rib);
  addPoint(pt.code, pt.name, pt.x, y, 0.2, 0, 0, -1, pt.note);
}

// 肾经胸部（KI1-KI10，旁开正中线2寸）
const kiChest = [
  { code: 'KI1', name: '涌泉', note: '足底（特殊定位）' }, // 跳过，下肢标注
  { code: 'KI2', name: '然谷', note: '足内侧（特殊定位）' }, // 跳过
  { code: 'KI3', name: '太溪', note: '内踝后（特殊定位）' }, // 跳过
  { code: 'KI4', name: '大钟', note: '内踝后下方' }, // 跳过
  { code: 'KI5', name: '水泉', note: '内踝后下方' }, // 跳过
  { code: 'KI6', name: '照海', note: '内踝尖下' }, // 跳过
  { code: 'KI7', name: '复溜', note: '内踝尖上2寸' }, // 跳过
  { code: 'KI8', name: '交信', note: '内踝尖上2寸' }, // 跳过
  { code: 'KI9', name: '筑宾', note: '内踝尖上5寸' }, // 跳过
  { code: 'KI10', name: '阴谷', note: '腘窝内侧' }, // 跳过
  { code: 'KI11', name: '横骨', rib: 12, x: 0.5 * CUN, note: '脐下5寸，旁开0.5寸' },
  { code: 'KI12', name: '大赫', rib: 12, x: 0.5 * CUN, note: '脐下4寸，旁开0.5寸' },
  { code: 'KI13', name: '气穴', rib: 12, x: 0.5 * CUN, note: '脐下3寸，旁开0.5寸' },
  { code: 'KI14', name: '四满', rib: 12, x: 0.5 * CUN, note: '脐下2寸，旁开0.5寸' },
  { code: 'KI15', name: '中注', rib: 12, x: 0.5 * CUN, note: '脐下1寸，旁开0.5寸' },
  { code: 'KI16', name: '肓俞', rib: 12, x: 0.5 * CUN, note: '脐中旁开0.5寸' },
  { code: 'KI17', name: '商曲', rib: 12, x: 0.5 * CUN, note: '脐上2寸，旁开0.5寸' },
  { code: 'KI18', name: '石关', rib: 12, x: 0.5 * CUN, note: '脐上3寸，旁开0.5寸' },
  { code: 'KI19', name: '阴都', rib: 12, x: 0.5 * CUN, note: '脐上4寸，旁开0.5寸' },
  { code: 'KI20', name: '腹通谷', rib: 12, x: 0.5 * CUN, note: '脐上5寸，旁开0.5寸' },
  { code: 'KI21', name: '幽门', rib: 12, x: 0.5 * CUN, note: '脐上6寸，旁开0.5寸' },
  { code: 'KI22', name: '步廊', rib: 5, x: 2 * CUN, note: '第5肋间隙，旁开2寸' },
  { code: 'KI23', name: '神封', rib: 4, x: 2 * CUN, note: '第4肋间隙，旁开2寸' },
  { code: 'KI24', name: '灵墟', rib: 3, x: 2 * CUN, note: '第3肋间隙，旁开2寸' },
  { code: 'KI25', name: '神藏', rib: 2, x: 2 * CUN, note: '第2肋间隙，旁开2寸' },
  { code: 'KI26', name: '彧中', rib: 1, x: 2 * CUN, note: '第1肋间隙，旁开2寸' },
  { code: 'KI27', name: '俞府', rib: 1, x: 2 * CUN, note: '锁骨下缘，旁开2寸' },
];
// KI11-KI21已经在腹部四经里标注过了，这里只标注KI22-KI27
for (const pt of kiChest.filter(p => parseInt(p.code.slice(2)) >= 22)) {
  const y = getIntercostalY(pt.rib);
  addPoint(pt.code, pt.name, pt.x, y, 0.2, 0, 0, -1, pt.note);
}

// 脾经胸部（SP17-SP20，旁开正中线6寸）
const spChest = [
  { code: 'SP17', name: '食窦', rib: 5, x: 6 * CUN, note: '第5肋间隙，旁开6寸' },
  { code: 'SP18', name: '天溪', rib: 4, x: 6 * CUN, note: '第4肋间隙，旁开6寸' },
  { code: 'SP19', name: '胸乡', rib: 3, x: 6 * CUN, note: '第3肋间隙，旁开6寸' },
  { code: 'SP20', name: '周荣', rib: 2, x: 6 * CUN, note: '第2肋间隙，旁开6寸' },
];
for (const pt of spChest) {
  const y = getIntercostalY(pt.rib);
  addPoint(pt.code, pt.name, pt.x, y, 0.2, 0, 0, -1, pt.note);
}

// 肺经胸部（LU1-LU2）
addPoint('LU1', '中府', 3.5 * CUN, getIntercostalY(1), 0.2, 0, 0, -1, '胸前壁外上方，前正中线旁开6寸，平第1肋间隙');
addPoint('LU2', '云门', 3.5 * CUN, getIntercostalY(1) + 0.02, 0.2, 0, 0, -1, '胸前壁外上方，肩胛骨喙突上方，锁骨下窝凹陷处');

// 心包经胸部（PC1）
addPoint('PC1', '天池', 2 * CUN, getIntercostalY(4), 0.2, 0, 0, -1, '胸部，第4肋间隙，前正中线旁开5寸（乳头外1寸）');

console.log(`胸部穴位完成: 成功${success}，失败${fail}`);

// ========== 上肢穴位 ==========
console.log('\n标注上肢穴位...');

// 骨性标志Y坐标
const humerus = { minY: 1.107, maxY: 1.415 }; // 肱骨
const radius = { minY: 0.884, maxY: 1.113 }; // 桡骨
const elbowY = 1.11; // 肘横纹Y
const wristY = 0.885; // 腕横纹Y
const shoulderY = 1.41; // 肩Y

// 肺经上肢（LU3-LU11）
const luUpper = [
  { code: 'LU3', name: '天府', y: shoulderY - 3 * CUN, note: '臂内侧面，腋前纹头下3寸' },
  { code: 'LU4', name: '侠白', y: shoulderY - 4 * CUN, note: '臂内侧面，腋前纹头下4寸' },
  { code: 'LU5', name: '尺泽', y: elbowY, note: '肘横纹中，肱二头肌腱桡侧凹陷处' },
  { code: 'LU6', name: '孔最', y: elbowY - 3 * CUN, note: '前臂掌面桡侧，腕横纹上7寸' },
  { code: 'LU7', name: '列缺', y: wristY + 1.5 * CUN, note: '前臂桡侧缘，腕横纹上1.5寸' },
  { code: 'LU8', name: '经渠', y: wristY + 1 * CUN, note: '前臂掌面桡侧，腕横纹上1寸' },
  { code: 'LU9', name: '太渊', y: wristY, note: '腕掌侧横纹桡侧，桡动脉搏动处' },
  { code: 'LU10', name: '鱼际', y: wristY - 0.5 * CUN, note: '手拇指本节后凹陷处' },
  { code: 'LU11', name: '少商', y: wristY - 1 * CUN, note: '手拇指末节桡侧，距指甲角0.1寸' },
];
for (const pt of luUpper) {
  addPoint(pt.code, pt.name, 0.15, pt.y, 0.1, 0, 0, -1, pt.note);
}

// 大肠经上肢（LI1-LI15）
const liUpper = [
  { code: 'LI1', name: '商阳', y: wristY - 1 * CUN, note: '手食指末节桡侧，距指甲角0.1寸' },
  { code: 'LI2', name: '二间', y: wristY - 0.8 * CUN, note: '手食指本节前桡侧凹陷处' },
  { code: 'LI3', name: '三间', y: wristY - 0.5 * CUN, note: '手食指本节后桡侧凹陷处' },
  { code: 'LI4', name: '合谷', y: wristY - 0.3 * CUN, note: '手背，第1、2掌骨间，第2掌骨桡侧中点处' },
  { code: 'LI5', name: '阳溪', y: wristY, note: '腕背横纹桡侧，手拇指向上翘起时凹陷处' },
  { code: 'LI6', name: '偏历', y: wristY + 3 * CUN, note: '前臂背面桡侧，腕横纹上3寸' },
  { code: 'LI7', name: '温溜', y: wristY + 5 * CUN, note: '前臂背面桡侧，腕横纹上5寸' },
  { code: 'LI8', name: '下廉', y: wristY + 7 * CUN, note: '前臂背面桡侧，肘横纹下4寸' },
  { code: 'LI9', name: '上廉', y: wristY + 8 * CUN, note: '前臂背面桡侧，肘横纹下3寸' },
  { code: 'LI10', name: '手三里', y: wristY + 9 * CUN, note: '前臂背面桡侧，肘横纹下2寸' },
  { code: 'LI11', name: '曲池', y: elbowY, note: '肘横纹外侧端，屈肘时尺泽与肱骨外上髁连线中点' },
  { code: 'LI12', name: '肘髎', y: elbowY + 0.5 * CUN, note: '臂外侧，屈肘时曲池上方1寸' },
  { code: 'LI13', name: '手五里', y: elbowY + 2 * CUN, note: '臂外侧，曲池与肩髃连线上，曲池上3寸' },
  { code: 'LI14', name: '臂臑', y: elbowY + 4 * CUN, note: '臂外侧，曲池与肩髃连线上，曲池上7寸' },
  { code: 'LI15', name: '肩髃', y: shoulderY, note: '肩部，三角肌上，臂外展时肩峰前下方凹陷处' },
];
for (const pt of liUpper) {
  addPoint(pt.code, pt.name, 0.2, pt.y, -0.1, 0, 0, 1, pt.note);
}

// 心包经上肢（PC2-PC9）
const pcUpper = [
  { code: 'PC2', name: '天泉', y: shoulderY - 2 * CUN, note: '臂内侧，腋前纹头下2寸' },
  { code: 'PC3', name: '曲泽', y: elbowY, note: '肘横纹中，肱二头肌腱尺侧缘' },
  { code: 'PC4', name: '郄门', y: wristY + 5 * CUN, note: '前臂掌侧，腕横纹上5寸' },
  { code: 'PC5', name: '间使', y: wristY + 3 * CUN, note: '前臂掌侧，腕横纹上3寸' },
  { code: 'PC6', name: '内关', y: wristY + 2 * CUN, note: '前臂掌侧，腕横纹上2寸' },
  { code: 'PC7', name: '大陵', y: wristY, note: '腕掌横纹中点，掌长肌腱与桡侧腕屈肌腱之间' },
  { code: 'PC8', name: '劳宫', y: wristY - 0.5 * CUN, note: '手掌心，第2、3掌骨间偏第3掌骨' },
  { code: 'PC9', name: '中冲', y: wristY - 1 * CUN, note: '手中指末节尖端中央' },
];
for (const pt of pcUpper) {
  addPoint(pt.code, pt.name, 0.12, pt.y, 0.1, 0, 0, -1, pt.note);
}

// 三焦经上肢（TE1-TE15）
const teUpper = [
  { code: 'TE1', name: '关冲', y: wristY - 1 * CUN, note: '手环指末节尺侧，距指甲角0.1寸' },
  { code: 'TE2', name: '液门', y: wristY - 0.8 * CUN, note: '手背部，第4、5指间，指蹼缘后方赤白肉际处' },
  { code: 'TE3', name: '中渚', y: wristY - 0.5 * CUN, note: '手背部，第4、5掌骨间凹陷处' },
  { code: 'TE4', name: '阳池', y: wristY, note: '腕背横纹中，指总伸肌腱尺侧缘凹陷处' },
  { code: 'TE5', name: '外关', y: wristY + 2 * CUN, note: '前臂背侧，腕背横纹上2寸' },
  { code: 'TE6', name: '支沟', y: wristY + 3 * CUN, note: '前臂背侧，腕背横纹上3寸' },
  { code: 'TE7', name: '会宗', y: wristY + 3 * CUN, note: '前臂背侧，腕背横纹上3寸，支沟尺侧' },
  { code: 'TE8', name: '三阳络', y: wristY + 4 * CUN, note: '前臂背侧，腕背横纹上4寸' },
  { code: 'TE9', name: '四渎', y: wristY + 6 * CUN, note: '前臂背侧，肘尖下5寸' },
  { code: 'TE10', name: '天井', y: elbowY, note: '臂外侧，屈肘时肘尖直上1寸凹陷处' },
  { code: 'TE11', name: '清冷渊', y: elbowY + 1 * CUN, note: '臂外侧，屈肘时肘尖直上2寸' },
  { code: 'TE12', name: '消泺', y: elbowY + 3 * CUN, note: '臂外侧，清冷渊与臑会连线中点' },
  { code: 'TE13', name: '臑会', y: elbowY + 5 * CUN, note: '臂外侧，肘尖与肩髎连线上，肩髎下3寸' },
  { code: 'TE14', name: '肩髎', y: shoulderY, note: '肩部，肩髃后方，臂外展时肩峰后下方凹陷处' },
  { code: 'TE15', name: '天髎', y: shoulderY + 0.5 * CUN, note: '肩胛部，肩井与曲垣中间，肩胛骨上角处' },
];
for (const pt of teUpper) {
  addPoint(pt.code, pt.name, 0.18, pt.y, -0.1, 0, 0, 1, pt.note);
}

// 心经上肢（HT1-HT9）
const htUpper = [
  { code: 'HT1', name: '极泉', y: shoulderY - 1 * CUN, note: '腋窝顶点，腋动脉搏动处' },
  { code: 'HT2', name: '青灵', y: shoulderY - 3 * CUN, note: '臂内侧，极泉与少海连线上，肘横纹上3寸' },
  { code: 'HT3', name: '少海', y: elbowY, note: '肘横纹内侧端与肱骨内上髁连线中点凹陷处' },
  { code: 'HT4', name: '灵道', y: wristY + 1.5 * CUN, note: '前臂掌侧，腕横纹上1.5寸' },
  { code: 'HT5', name: '通里', y: wristY + 1 * CUN, note: '前臂掌侧，腕横纹上1寸' },
  { code: 'HT6', name: '阴郄', y: wristY + 0.5 * CUN, note: '前臂掌侧，腕横纹上0.5寸' },
  { code: 'HT7', name: '神门', y: wristY, note: '腕部，腕掌侧横纹尺侧端，尺侧腕屈肌腱桡侧凹陷处' },
  { code: 'HT8', name: '少府', y: wristY - 0.5 * CUN, note: '手掌面，第4、5掌骨间' },
  { code: 'HT9', name: '少冲', y: wristY - 1 * CUN, note: '手小指末节桡侧，距指甲角0.1寸' },
];
for (const pt of htUpper) {
  addPoint(pt.code, pt.name, 0.1, pt.y, 0.1, 0, 0, -1, pt.note);
}

// 小肠经上肢（SI1-SI10）
const siUpper = [
  { code: 'SI1', name: '少泽', y: wristY - 1 * CUN, note: '手小指末节尺侧，距指甲角0.1寸' },
  { code: 'SI2', name: '前谷', y: wristY - 0.8 * CUN, note: '手掌尺侧，微握拳时小指本节前掌指横纹头赤白肉际' },
  { code: 'SI3', name: '后溪', y: wristY - 0.5 * CUN, note: '手掌尺侧，微握拳时小指本节后掌指横纹头赤白肉际' },
  { code: 'SI4', name: '腕骨', y: wristY, note: '手掌尺侧，第5掌骨基底与钩骨之间凹陷处' },
  { code: 'SI5', name: '阳谷', y: wristY, note: '手腕尺侧，尺骨茎突与三角骨之间凹陷处' },
  { code: 'SI6', name: '养老', y: wristY + 1 * CUN, note: '前臂背面尺侧，尺骨小头近端桡侧凹陷中' },
  { code: 'SI7', name: '支正', y: wristY + 4 * CUN, note: '前臂背面尺侧，腕背横纹上5寸' },
  { code: 'SI8', name: '小海', y: elbowY, note: '肘内侧，尺骨鹰嘴与肱骨内上髁之间凹陷处' },
  { code: 'SI9', name: '肩贞', y: shoulderY - 1 * CUN, note: '肩关节后下方，臂内收时腋后纹头上1寸' },
  { code: 'SI10', name: '臑俞', y: shoulderY, note: '肩部，腋后纹头直上，肩胛冈下缘凹陷中' },
];
for (const pt of siUpper) {
  addPoint(pt.code, pt.name, 0.16, pt.y, -0.1, 0, 0, 1, pt.note);
}

console.log(`上肢穴位完成: 成功${success}，失败${fail}`);

// ========== 导出 ==========
writeFileSync('./chest-limb-draft.json', JSON.stringify({
  schema: 1,
  standard: 'GB/T 12346—2021',
  points: results
}, null, 2));

console.log(`\n总计: 成功${success}个，失败${fail}个`);
console.log('已导出到 chest-limb-draft.json');
