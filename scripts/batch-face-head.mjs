// 批量标注面部和头颈部穴位（使用atlas.json加载模型）
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
      meshId: 'FJ2810',
      method: 'regional-projection',
      status: 'pending-review'
    };
  }
  return null;
}

// 从外部向中心投射
function projectFromOutside(x, y, z) {
  return projectToSkin(x * 2, y, z * 2, -x, 0, -z);
}

const results = {};
const failed = [];

function addPoint(code, x, y, z) {
  const r = projectFromOutside(x, y, z);
  if (r) {
    results[code] = r;
  } else {
    failed.push(code);
  }
}

// ========== 面部穴位 ==========
// BL1 睛明：目内眦角稍上方凹陷处
addPoint('BL1', 0.015, 1.585, 0.085);
// BL2 攒竹：眉头凹陷中
addPoint('BL2', 0.025, 1.605, 0.080);
// ST1 承泣：瞳孔直下，眶下缘
addPoint('ST1', 0.035, 1.578, 0.092);
// ST2 四白：眶下孔
addPoint('ST2', 0.035, 1.565, 0.090);
// ST3 巨髎：平鼻翼下缘
addPoint('ST3', 0.035, 1.552, 0.085);
// ST4 地仓：口角旁
addPoint('ST4', 0.045, 1.535, 0.080);
// ST5 大迎：下颌角前上方
addPoint('ST5', 0.065, 1.518, 0.060);
// ST6 颊车：咬肌隆起处
addPoint('ST6', 0.060, 1.525, 0.055);
// ST7 下关：颧弓下缘
addPoint('ST7', 0.055, 1.558, 0.055);
// ST8 头维：额角发际
addPoint('ST8', 0.085, 1.645, 0.050);
// GB1 瞳子髎：目外眦旁
addPoint('GB1', 0.070, 1.588, 0.080);
// GB2 听会：耳屏间切迹前
addPoint('GB2', 0.078, 1.552, 0.035);
// GB3 上关：颧弓上缘
addPoint('GB3', 0.055, 1.570, 0.050);
// GB4 颔厌
addPoint('GB4', 0.080, 1.630, 0.035);
// GB5 悬颅
addPoint('GB5', 0.075, 1.615, 0.020);
// GB6 悬厘
addPoint('GB6', 0.070, 1.600, 0.010);
// GB7 曲鬓：耳前鬓角
addPoint('GB7', 0.065, 1.585, 0.000);
// TE21 耳门：耳屏上切迹前
addPoint('TE21', 0.078, 1.565, 0.030);
// TE22 耳和髎：鬓发后缘
addPoint('TE22', 0.070, 1.575, 0.020);
// TE23 丝竹空：眉梢凹陷处
addPoint('TE23', 0.065, 1.600, 0.075);
// LI19 口禾髎：鼻孔外缘直下
addPoint('LI19', 0.025, 1.550, 0.088);
// LI20 迎香：鼻翼外缘中点
addPoint('LI20', 0.030, 1.555, 0.085);
// CV24 承浆：颏唇沟正中
addPoint('CV24', 0.000, 1.525, 0.075);
// ST10 水突：颈部
addPoint('ST10', 0.040, 1.485, 0.050);
// LI16 巨骨：肩峰端
addPoint('LI16', 0.120, 1.400, -0.020);
// LI17 天鼎：颈外侧
addPoint('LI17', 0.055, 1.470, 0.020);
// LI18 扶突：结喉旁3寸
addPoint('LI18', 0.050, 1.490, 0.030);
// SI18 颧髎：颧骨下缘
addPoint('SI18', 0.055, 1.565, 0.060);
// SI19 听宫：耳屏前
addPoint('SI19', 0.078, 1.558, 0.032);
// GB14 阳白：眉上1寸
addPoint('GB14', 0.035, 1.615, 0.075);
// GB15 头临泣：入发际0.5寸
addPoint('GB15', 0.040, 1.655, 0.055);
// GB21 肩井：大椎与肩峰连线中点
addPoint('GB21', 0.080, 1.425, -0.030);
// TE16 天牖：乳突后下方
addPoint('TE16', 0.050, 1.500, -0.030);

// 导出结果
const output = {
  schema: 1,
  modelKey: 'BodyParts3D_4-0_man',
  standard: 'GB/T 12346—2021',
  anchors: {},
  points: results
};

writeFileSync('./face-head-draft.json', JSON.stringify(output, null, 2));
console.log('面部和头颈部穴位标注完成：成功' + Object.keys(results).length + '个，失败' + failed.length + '个');
if (failed.length > 0) console.log('失败: ' + failed.join(', '));
console.log('已导出到 face-head-draft.json');
