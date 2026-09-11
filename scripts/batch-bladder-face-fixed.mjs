// 重新精确标注膀胱经面部穴位（BL1-BL10）
// 直接使用皮肤顶点坐标，不使用射线投射
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

// 找最近的皮肤顶点
function findNearestVertex(targetX, targetY, targetZ, searchRadius = 0.05) {
  let nearest = null;
  let minDist = Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const dist = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2 + (z - targetZ) ** 2);
    if (dist < minDist && dist < searchRadius) {
      minDist = dist;
      nearest = {x, y, z, index: i / 3};
    }
  }
  return nearest;
}

// 射线投射到皮肤
function projectToSkin(originX, originY, originZ, dirX, dirY, dirZ) {
  const origin = new T.Vector3(originX, originY, originZ);
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

const results = {};
const failed = [];

function addPoint(code, targetX, targetY, targetZ, useProjection = false, projDir = [0, 0, -1]) {
  let point = null;
  if (useProjection) {
    // 从前方投射
    point = projectToSkin(targetX, targetY, 0.15, projDir[0], projDir[1], projDir[2]);
  } else {
    // 找最近的皮肤顶点
    const nearest = findNearestVertex(targetX, targetY, targetZ, 0.03);
    if (nearest) {
      point = {
        position: [nearest.x, nearest.y, nearest.z],
        displayNormal: [0, 0, 1],
        faceIndex: 0,
        vertexIndices: [nearest.index, nearest.index, nearest.index],
        barycentric: [0.33, 0.33, 0.34],
        meshId: 'FJ2810',
        method: 'regional-projection',
        status: 'pending-review'
      };
    }
  }
  if (point) {
    results[code] = point;
    console.log(code + ': X=' + point.position[0].toFixed(4) + ' Y=' + point.position[1].toFixed(4) + ' Z=' + point.position[2].toFixed(4));
  } else {
    failed.push(code);
    console.log(code + ': 失败');
  }
}

console.log('=== 膀胱经面部穴位重新标注 ===\n');

// BL1 睛明：目内眦角稍上方凹陷处
// 内眼角区域：X≈0.018, Y≈1.58, Z≈0.08
// 睛明应该在内眼角稍上方，更靠外一点
addPoint('BL1', 0.022, 1.588, 0.085, true, [0, 0, -1]);

// BL2 攒竹：眉头凹陷中，眶上切迹处
// 眉头区域：X≈0.027, Y≈1.613, Z≈0.074
addPoint('BL2', 0.028, 1.612, 0.078, true, [0, 0, -1]);

// BL3 眉冲：眉头直上入发际0.5寸
addPoint('BL3', 0.025, 1.640, 0.070, true, [0, 0, -1]);

// BL4 曲差：神庭旁1.5寸，入发际0.5寸
addPoint('BL4', 0.040, 1.645, 0.065, true, [0, 0, -1]);

// BL5 五处：曲差旁1.5寸，入发际1寸
addPoint('BL5', 0.055, 1.655, 0.055, true, [0, 0, -1]);

// BL6 承光：五处后1.5寸
addPoint('BL6', 0.060, 1.640, 0.030, true, [0, 0, -1]);

// BL7 通天：承光后1.5寸
addPoint('BL7', 0.060, 1.625, 0.000, true, [0, 0, -1]);

// BL8 络却：通天后1.5寸
addPoint('BL8', 0.055, 1.610, -0.030, true, [0, 0, 1]);

// BL9 玉枕：后发际正中直上2.5寸，旁开1.3寸
addPoint('BL9', 0.045, 1.580, -0.060, true, [0, 0, 1]);

// BL10 天柱：后发际正中直上0.5寸，旁开1.3寸，斜方肌外缘凹陷中
addPoint('BL10', 0.040, 1.520, -0.050, true, [0, 0, 1]);

// 导出结果
const output = {
  schema: 1,
  modelKey: 'BodyParts3D_4-0_man',
  standard: 'GB/T 12346—2021',
  anchors: {},
  points: results
};

writeFileSync('./bladder-face-fixed.json', JSON.stringify(output, null, 2));
console.log('\n膀胱经面部穴位重新标注完成：成功' + Object.keys(results).length + '个，失败' + failed.length + '个');
if (failed.length > 0) console.log('失败: ' + failed.join(', '));
console.log('已导出到 bladder-face-fixed.json');
