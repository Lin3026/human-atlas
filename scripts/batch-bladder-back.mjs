// 批量标注膀胱经背部穴位（背俞穴）
// 第一侧线：旁开督脉1.5寸，第二侧线：旁开督脉3寸
import * as T from 'three';
import {readFileSync, writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const atlas = JSON.parse(readFileSync('./public/models/atlas.json', 'utf8'));
const skinPart = atlas.parts.find(p => p.id === 'FJ2810');

// 加载皮肤
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
      barycentric: [hit.uv?.x || 0.33, hit.uv?.y || 0.33, 0.34],
      meshId: 'FJ2810'
    };
  }
  return null;
}

// 椎骨棘突下Y坐标（从骨性标志获取）
const vertebraY = {
  C7: 1.443,  // C7最下端
  T1: 1.425, T2: 1.405, T3: 1.380, T4: 1.356, T5: 1.318,
  T6: 1.287, T7: 1.257, T8: 1.232, T9: 1.205, T10: 1.178,
  T11: 1.154, T12: 1.128,
  L1: 1.093, L2: 1.070, L3: 1.046, L4: 1.017, L5: 0.983,
  Sacrum: 0.861
};

// 棘突下Y = (当前椎骨最下端 + 下一椎骨最上端) / 2
// 简化：用当前椎骨最下端Y
function getSpinousProcessY(vertebra) {
  return vertebraY[vertebra];
}

// 1寸≈0.026m（模型单位米）
const CUN = 0.026;

// 膀胱经背部穴位定义
// 第一侧线（旁开1.5寸）：BL11-BL23
// 第二侧线（旁开3寸）：BL41-BL52
const bladderBackPoints = [
  // 第一侧线
  { code: 'BL11', name: '大杼', vertebra: 'T1', side: 1.5 },
  { code: 'BL12', name: '风门', vertebra: 'T2', side: 1.5 },
  { code: 'BL13', name: '肺俞', vertebra: 'T3', side: 1.5 },
  { code: 'BL14', name: '厥阴俞', vertebra: 'T4', side: 1.5 },
  { code: 'BL15', name: '心俞', vertebra: 'T5', side: 1.5 },
  { code: 'BL16', name: '督俞', vertebra: 'T6', side: 1.5 },
  { code: 'BL17', name: '膈俞', vertebra: 'T7', side: 1.5 },
  { code: 'BL18', name: '肝俞', vertebra: 'T9', side: 1.5 },
  { code: 'BL19', name: '胆俞', vertebra: 'T10', side: 1.5 },
  { code: 'BL20', name: '脾俞', vertebra: 'T11', side: 1.5 },
  { code: 'BL21', name: '胃俞', vertebra: 'T12', side: 1.5 },
  { code: 'BL22', name: '三焦俞', vertebra: 'L1', side: 1.5 },
  { code: 'BL23', name: '肾俞', vertebra: 'L2', side: 1.5 },
  // 第二侧线
  { code: 'BL41', name: '附分', vertebra: 'T2', side: 3.0 },
  { code: 'BL42', name: '魄户', vertebra: 'T3', side: 3.0 },
  { code: 'BL43', name: '膏肓', vertebra: 'T4', side: 3.0 },
  { code: 'BL44', name: '神堂', vertebra: 'T5', side: 3.0 },
  { code: 'BL45', name: '譩譆', vertebra: 'T6', side: 3.0 },
  { code: 'BL46', name: '膈关', vertebra: 'T7', side: 3.0 },
  { code: 'BL47', name: '魂门', vertebra: 'T9', side: 3.0 },
  { code: 'BL48', name: '阳纲', vertebra: 'T10', side: 3.0 },
  { code: 'BL49', name: '意舍', vertebra: 'T11', side: 3.0 },
  { code: 'BL50', name: '胃仓', vertebra: 'T12', side: 3.0 },
  { code: 'BL51', name: '肓门', vertebra: 'L1', side: 3.0 },
  { code: 'BL52', name: '志室', vertebra: 'L2', side: 3.0 },
];

const results = {};
let success = 0, fail = 0;

for (const pt of bladderBackPoints) {
  const y = getSpinousProcessY(pt.vertebra);
  const xOffset = pt.side * CUN;
  
  // 左侧穴位（X正方向）
  const hit = projectToSkin(xOffset, y, 0.2, 0, 0, -1);
  if (hit) {
    results[pt.code] = {
      name: pt.name,
      ...hit,
      status: 'pending-review',
      note: `旁开督脉${pt.side}寸，${pt.vertebra}棘突下`
    };
    success++;
  } else {
    console.log(`失败: ${pt.code} ${pt.name}`);
    fail++;
  }
}

console.log(`\n膀胱经背部穴位: 成功${success}个，失败${fail}个`);

// 导出JSON
writeFileSync('./bladder-back-draft.json', JSON.stringify({
  schema: 1,
  standard: 'GB/T 12346—2021',
  points: results
}, null, 2));

console.log('已导出到 bladder-back-draft.json');
