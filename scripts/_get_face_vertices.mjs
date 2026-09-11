// 获取面部关键区域的皮肤顶点坐标，用于精确标注穴位
import * as T from 'three';
import {readFileSync, writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const atlas = JSON.parse(readFileSync('./public/models/atlas.json', 'utf8'));
const skinPart = atlas.parts.find(p => p.id === 'FJ2810');
const chunk = atlas.chunks[skinPart.chunk];
const gzBuffer = readFileSync('./public/' + chunk.gzip);
const buffer = gunzipSync(gzBuffer);
const positions = new Float32Array(buffer.buffer, buffer.byteOffset + skinPart.positions, skinPart.vertexCount * 3);

// 收集面部区域的顶点（左侧，Y>1.5, Z>0.05, X>0）
const faceVertices = [];
for (let i = 0; i < positions.length; i += 3) {
  const x = positions[i];
  const y = positions[i + 1];
  const z = positions[i + 2];
  if (y > 1.50 && y < 1.65 && z > 0.05 && x > 0 && x < 0.10) {
    faceVertices.push({x, y, z});
  }
}

console.log('面部区域顶点数: ' + faceVertices.length);

// 找眼眶周围的顶点（内眼角区域）
// 内眼角大约在 X≈0.02-0.04, Y≈1.58-1.60, Z≈0.08-0.10
const innerEye = faceVertices.filter(v => v.x > 0.015 && v.x < 0.045 && v.y > 1.575 && v.y < 1.605 && v.z > 0.075 && v.z < 0.105);
console.log('\n内眼角区域顶点数: ' + innerEye.length);
if (innerEye.length > 0) {
  const avgX = innerEye.reduce((s, v) => s + v.x, 0) / innerEye.length;
  const avgY = innerEye.reduce((s, v) => s + v.y, 0) / innerEye.length;
  const avgZ = innerEye.reduce((s, v) => s + v.z, 0) / innerEye.length;
  console.log('内眼角平均坐标: X=' + avgX.toFixed(4) + ' Y=' + avgY.toFixed(4) + ' Z=' + avgZ.toFixed(4));
  // 找最靠前的点（Z最大）
  const frontMost = innerEye.reduce((a, b) => a.z > b.z ? a : b);
  console.log('内眼角最前点: X=' + frontMost.x.toFixed(4) + ' Y=' + frontMost.y.toFixed(4) + ' Z=' + frontMost.z.toFixed(4));
}

// 眉头区域（攒竹）
const browInner = faceVertices.filter(v => v.x > 0.015 && v.x < 0.040 && v.y > 1.595 && v.y < 1.620 && v.z > 0.070 && v.z < 0.095);
console.log('\n眉头区域顶点数: ' + browInner.length);
if (browInner.length > 0) {
  const avgX = browInner.reduce((s, v) => s + v.x, 0) / browInner.length;
  const avgY = browInner.reduce((s, v) => s + v.y, 0) / browInner.length;
  const avgZ = browInner.reduce((s, v) => s + v.z, 0) / browInner.length;
  console.log('眉头平均坐标: X=' + avgX.toFixed(4) + ' Y=' + avgY.toFixed(4) + ' Z=' + avgZ.toFixed(4));
}

// 外眼角区域（瞳子髎参考）
const outerEye = faceVertices.filter(v => v.x > 0.050 && v.x < 0.080 && v.y > 1.575 && v.y < 1.600 && v.z > 0.070 && v.z < 0.095);
console.log('\n外眼角区域顶点数: ' + outerEye.length);
if (outerEye.length > 0) {
  const avgX = outerEye.reduce((s, v) => s + v.x, 0) / outerEye.length;
  const avgY = outerEye.reduce((s, v) => s + v.y, 0) / outerEye.length;
  const avgZ = outerEye.reduce((s, v) => s + v.z, 0) / outerEye.length;
  console.log('外眼角平均坐标: X=' + avgX.toFixed(4) + ' Y=' + avgY.toFixed(4) + ' Z=' + avgZ.toFixed(4));
}

// 输出一些面部顶点供参考
console.log('\n面部顶点样本（按Y排序）:');
const sorted = faceVertices.sort((a, b) => b.y - a.y).slice(0, 20);
for (const v of sorted) {
  console.log('  X=' + v.x.toFixed(4) + ' Y=' + v.y.toFixed(4) + ' Z=' + v.z.toFixed(4));
}
