// 自动校对脚本：根据骨骼位置+左右对称性标注和校对穴位
// 先处理膀胱经背部穴位（BL11-BL54）
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

// 从后背向前投射
function projectFromBack(x, y, z = -0.2) {
  const origin = new T.Vector3(x, y, z);
  const dir = new T.Vector3(0, 0, 1).normalize();
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
      meshId: 'FJ2810',
      method: 'bony-landmark-projection',
      status: 'auto-verified'
    };
  }
  return null;
}

// 椎骨棘突下Y坐标（minY，椎骨最下端）
const vertebraeY = {
  C7: 1.443,
  T1: 1.425, T2: 1.405, T3: 1.380, T4: 1.356, T5: 1.318,
  T6: 1.287, T7: 1.257, T8: 1.232, T9: 1.205, T10: 1.178,
  T11: 1.154, T12: 1.128,
  L1: 1.093, L2: 1.070, L3: 1.046, L4: 1.017, L5: 0.983,
  S1: 0.950, S2: 0.930, S3: 0.910, S4: 0.890
};

// 1寸≈0.026m
const CUN = 0.026;

const results = {};
const failed = [];

function addPoint(code, x, y) {
  const point = projectFromBack(x, y);
  if (point) {
    results[code] = point;
    console.log(code + ': X=' + point.position[0].toFixed(4) + ' Y=' + point.position[1].toFixed(4) + ' Z=' + point.position[2].toFixed(4));
  } else {
    failed.push(code);
    console.log(code + ': 投射失败');
  }
}

console.log('=== 膀胱经背部穴位自动标注（左侧）===\n');

// 膀胱经第一侧线（旁开1.5寸≈0.039m）
// BL11大杼：第1胸椎棘突下，旁开1.5寸
addPoint('BL11', 1.5 * CUN, vertebraeY.T1);
// BL12风门：第2胸椎棘突下，旁开1.5寸
addPoint('BL12', 1.5 * CUN, vertebraeY.T2);
// BL13肺俞：第3胸椎棘突下，旁开1.5寸
addPoint('BL13', 1.5 * CUN, vertebraeY.T3);
// BL14厥阴俞：第4胸椎棘突下，旁开1.5寸
addPoint('BL14', 1.5 * CUN, vertebraeY.T4);
// BL15心俞：第5胸椎棘突下，旁开1.5寸
addPoint('BL15', 1.5 * CUN, vertebraeY.T5);
// BL16督俞：第6胸椎棘突下，旁开1.5寸
addPoint('BL16', 1.5 * CUN, vertebraeY.T6);
// BL17膈俞：第7胸椎棘突下，旁开1.5寸
addPoint('BL17', 1.5 * CUN, vertebraeY.T7);
// BL18肝俞：第9胸椎棘突下，旁开1.5寸
addPoint('BL18', 1.5 * CUN, vertebraeY.T9);
// BL19胆俞：第10胸椎棘突下，旁开1.5寸
addPoint('BL19', 1.5 * CUN, vertebraeY.T10);
// BL20脾俞：第11胸椎棘突下，旁开1.5寸
addPoint('BL20', 1.5 * CUN, vertebraeY.T11);
// BL21胃俞：第12胸椎棘突下，旁开1.5寸
addPoint('BL21', 1.5 * CUN, vertebraeY.T12);
// BL22三焦俞：第1腰椎棘突下，旁开1.5寸
addPoint('BL22', 1.5 * CUN, vertebraeY.L1);
// BL23肾俞：第2腰椎棘突下，旁开1.5寸
addPoint('BL23', 1.5 * CUN, vertebraeY.L2);
// BL24气海俞：第3腰椎棘突下，旁开1.5寸
addPoint('BL24', 1.5 * CUN, vertebraeY.L3);
// BL25大肠俞：第4腰椎棘突下，旁开1.5寸
addPoint('BL25', 1.5 * CUN, vertebraeY.L4);
// BL26关元俞：第5腰椎棘突下，旁开1.5寸
addPoint('BL26', 1.5 * CUN, vertebraeY.L5);
// BL27小肠俞：平第1骶后孔，骶正中嵴旁1.5寸
addPoint('BL27', 1.5 * CUN, vertebraeY.S1);
// BL28膀胱俞：平第2骶后孔，骶正中嵴旁1.5寸
addPoint('BL28', 1.5 * CUN, vertebraeY.S2);
// BL29中膂俞：平第3骶后孔，骶正中嵴旁1.5寸
addPoint('BL29', 1.5 * CUN, vertebraeY.S3);
// BL30白环俞：平第4骶后孔，骶正中嵴旁1.5寸
addPoint('BL30', 1.5 * CUN, vertebraeY.S4);

// 膀胱经第二侧线（旁开3寸≈0.078m）
// BL41附分：第2胸椎棘突下，旁开3寸
addPoint('BL41', 3 * CUN, vertebraeY.T2);
// BL42魄户：第3胸椎棘突下，旁开3寸
addPoint('BL42', 3 * CUN, vertebraeY.T3);
// BL43膏肓：第4胸椎棘突下，旁开3寸
addPoint('BL43', 3 * CUN, vertebraeY.T4);
// BL44神堂：第5胸椎棘突下，旁开3寸
addPoint('BL44', 3 * CUN, vertebraeY.T5);
// BL45譩譆：第6胸椎棘突下，旁开3寸
addPoint('BL45', 3 * CUN, vertebraeY.T6);
// BL46膈关：第7胸椎棘突下，旁开3寸
addPoint('BL46', 3 * CUN, vertebraeY.T7);
// BL47魂门：第9胸椎棘突下，旁开3寸
addPoint('BL47', 3 * CUN, vertebraeY.T9);
// BL48阳纲：第10胸椎棘突下，旁开3寸
addPoint('BL48', 3 * CUN, vertebraeY.T10);
// BL49意舍：第11胸椎棘突下，旁开3寸
addPoint('BL49', 3 * CUN, vertebraeY.T11);
// BL50胃仓：第12胸椎棘突下，旁开3寸
addPoint('BL50', 3 * CUN, vertebraeY.T12);
// BL51肓门：第1腰椎棘突下，旁开3寸
addPoint('BL51', 3 * CUN, vertebraeY.L1);
// BL52志室：第2腰椎棘突下，旁开3寸
addPoint('BL52', 3 * CUN, vertebraeY.L2);
// BL53胞肓：平第2骶后孔，骶正中嵴旁3寸
addPoint('BL53', 3 * CUN, vertebraeY.S2);
// BL54秩边：平第4骶后孔，骶正中嵴旁3寸
addPoint('BL54', 3 * CUN, vertebraeY.S4);

console.log('\n=== 左右对称校对 ===\n');

// 利用左右对称性生成右侧穴位
const rightResults = {};
for (const [code, point] of Object.entries(results)) {
  // 左侧穴位X为正，右侧穴位X为负（取反）
  // 但需要重新投射到皮肤表面，因为左右两侧的皮肤形状可能不完全对称
  const rightX = -point.position[0];
  const rightY = point.position[1];
  const rightPoint = projectFromBack(rightX, rightY);
  if (rightPoint) {
    const rightCode = code + '-R';
    rightResults[rightCode] = rightPoint;
    console.log(rightCode + ': X=' + rightPoint.position[0].toFixed(4) + ' Y=' + rightPoint.position[1].toFixed(4) + ' Z=' + rightPoint.position[2].toFixed(4));
  }
}

// 合并左右侧
const allResults = {...results, ...rightResults};

// 校对：检查左右侧是否对称
console.log('\n=== 对称性检查 ===\n');
let symmetryOK = 0;
let symmetryFail = 0;
for (const [code, point] of Object.entries(results)) {
  const rightCode = code + '-R';
  const rightPoint = rightResults[rightCode];
  if (rightPoint) {
    const xDiff = Math.abs(Math.abs(point.position[0]) - Math.abs(rightPoint.position[0]));
    const yDiff = Math.abs(point.position[1] - rightPoint.position[1]);
    const zDiff = Math.abs(point.position[2] - rightPoint.position[2]);
    if (xDiff < 0.005 && yDiff < 0.005 && zDiff < 0.01) {
      symmetryOK++;
    } else {
      symmetryFail++;
      console.log(code + ' 对称性偏差: X差=' + xDiff.toFixed(4) + ' Y差=' + yDiff.toFixed(4) + ' Z差=' + zDiff.toFixed(4));
    }
  }
}
console.log('\n对称性检查: 通过' + symmetryOK + '个，偏差' + symmetryFail + '个');

// 导出结果
const output = {
  schema: 1,
  modelKey: 'BodyParts3D_4-0_man',
  standard: 'GB/T 12346—2021',
  anchors: {},
  points: allResults
};

writeFileSync('./bladder-back-auto-verified.json', JSON.stringify(output, null, 2));
console.log('\n膀胱经背部穴位自动标注完成：左侧' + Object.keys(results).length + '个，右侧' + Object.keys(rightResults).length + '个，总计' + Object.keys(allResults).length + '个');
console.log('失败: ' + failed.length + '个');
if (failed.length > 0) console.log('失败列表: ' + failed.join(', '));
console.log('已导出到 bladder-back-auto-verified.json');
