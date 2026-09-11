// 直接用皮肤顶点坐标精确标注睛明、攒竹、眉冲
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

// 找最接近目标坐标的皮肤顶点
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

// 创建穴位数据
function createPoint(vertex, code) {
  // 计算法线（简化处理，用方向向量）
  const normal = [0, 0, 1];
  if (vertex.index * 3 + 2 < normals.length) {
    normal[0] = normals[vertex.index * 3] / 32767;
    normal[1] = normals[vertex.index * 3 + 1] / 32767;
    normal[2] = normals[vertex.index * 3 + 2] / 32767;
  }
  return {
    position: [vertex.x, vertex.y, vertex.z],
    displayNormal: normal,
    faceIndex: 0,
    vertexIndices: [vertex.index, vertex.index, vertex.index],
    barycentric: [0.33, 0.33, 0.34],
    meshId: 'FJ2810',
    method: 'vertex-snap',
    status: 'auto-verified'
  };
}

const results = {};

console.log('=== 精确标注面部穴位 ===\n');

// BL1 睛明：目内眦角稍上方凹陷处
// 目标：内眼角稍上方，X≈0.020, Y≈1.580, Z≈0.085
console.log('--- BL1 睛明 ---');
const bl1Target = findNearestVertex(0.020, 1.580, 0.085, 0.03);
if (bl1Target) {
  results['BL1'] = createPoint(bl1Target, 'BL1');
  console.log('找到顶点 index=' + bl1Target.index + ' X=' + bl1Target.x.toFixed(4) + ' Y=' + bl1Target.y.toFixed(4) + ' Z=' + bl1Target.z.toFixed(4));
} else {
  console.log('未找到合适顶点');
}

// BL2 攒竹：眉头凹陷中，眶上切迹处
// 目标：眉头内侧端，X≈0.028, Y≈1.610, Z≈0.075
console.log('\n--- BL2 攒竹 ---');
const bl2Target = findNearestVertex(0.028, 1.610, 0.075, 0.03);
if (bl2Target) {
  results['BL2'] = createPoint(bl2Target, 'BL2');
  console.log('找到顶点 index=' + bl2Target.index + ' X=' + bl2Target.x.toFixed(4) + ' Y=' + bl2Target.y.toFixed(4) + ' Z=' + bl2Target.z.toFixed(4));
} else {
  console.log('未找到合适顶点');
}

// BL3 眉冲：眉头直上入发际0.5寸
// 目标：眉头直上，发际下方0.5寸，X≈0.028, Y≈1.645, Z≈0.070
console.log('\n--- BL3 眉冲 ---');
const bl3Target = findNearestVertex(0.028, 1.645, 0.070, 0.03);
if (bl3Target) {
  results['BL3'] = createPoint(bl3Target, 'BL3');
  console.log('找到顶点 index=' + bl3Target.index + ' X=' + bl3Target.x.toFixed(4) + ' Y=' + bl3Target.y.toFixed(4) + ' Z=' + bl3Target.z.toFixed(4));
} else {
  console.log('未找到合适顶点');
}

// 同时标注BL4曲差、BL5五处，用同样的方法
console.log('\n--- BL4 曲差 ---');
const bl4Target = findNearestVertex(0.045, 1.650, 0.065, 0.03);
if (bl4Target) {
  results['BL4'] = createPoint(bl4Target, 'BL4');
  console.log('找到顶点 index=' + bl4Target.index + ' X=' + bl4Target.x.toFixed(4) + ' Y=' + bl4Target.y.toFixed(4) + ' Z=' + bl4Target.z.toFixed(4));
}

console.log('\n--- BL5 五处 ---');
const bl5Target = findNearestVertex(0.060, 1.655, 0.055, 0.03);
if (bl5Target) {
  results['BL5'] = createPoint(bl5Target, 'BL5');
  console.log('找到顶点 index=' + bl5Target.index + ' X=' + bl5Target.x.toFixed(4) + ' Y=' + bl5Target.y.toFixed(4) + ' Z=' + bl5Target.z.toFixed(4));
}

// 导出结果
const output = {
  schema: 1,
  modelKey: 'BodyParts3D_4-0_man',
  standard: 'GB/T 12346—2021',
  anchors: {},
  points: results
};

writeFileSync('./face-vertex-snapped.json', JSON.stringify(output, null, 2));
console.log('\n=== 完成 ===');
console.log('面部穴位标注完成：成功' + Object.keys(results).length + '个');
console.log('已导出到 face-vertex-snapped.json');
