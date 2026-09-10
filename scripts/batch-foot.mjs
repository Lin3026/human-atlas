// 批量标注足部穴位
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

function projectFromOutside(x, y, z) {
  return projectToSkin(x * 1.5, y, z * 1.5, -x, 0, -z);
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

// ========== 足部穴位（左侧）==========
// 足部Y坐标范围约0.02-0.12，X约0.08-0.18，Z约-0.10到0.10

// ST45 厉兑：第2趾末节外侧，指甲根角旁0.1寸
addPoint('ST45', 0.130, 0.025, 0.080);
// SP1 隐白：足大趾末节内侧，指甲根角旁0.1寸
addPoint('SP1', 0.090, 0.025, 0.075);
// SP2 大都：足大趾本节前下方赤白肉际凹陷处
addPoint('SP2', 0.095, 0.040, 0.070);
// LR1 大敦：足大趾末节外侧，指甲根角旁0.1寸
addPoint('LR1', 0.110, 0.025, 0.065);
// LR2 行间：足背第1、2趾间，趾蹼缘后方赤白肉际处
addPoint('LR2', 0.115, 0.040, 0.060);
// BL62 申脉：外踝直下方凹陷处
addPoint('BL62', 0.160, 0.060, -0.020);
// BL63 金门：外踝前缘直下，骰骨外侧凹陷处
addPoint('BL63', 0.155, 0.075, -0.015);
// GB40 丘墟：外踝前下方，趾长伸肌腱外侧凹陷处
addPoint('GB40', 0.150, 0.085, 0.000);
// GB44 足窍阴：第4趾末节外侧，指甲根角旁0.1寸
addPoint('GB44', 0.150, 0.025, 0.055);

// 导出结果
const output = {
  schema: 1,
  modelKey: 'BodyParts3D_4-0_man',
  standard: 'GB/T 12346—2021',
  anchors: {},
  points: results
};

writeFileSync('./foot-draft.json', JSON.stringify(output, null, 2));
console.log('足部穴位标注完成：成功' + Object.keys(results).length + '个，失败' + failed.length + '个');
if (failed.length > 0) console.log('失败: ' + failed.join(', '));
console.log('已导出到 foot-draft.json');
