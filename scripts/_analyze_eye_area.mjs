// 精确获取眼眶周围皮肤顶点坐标，用于标注睛明、攒竹、眉冲
import * as T from 'three';
import {readFileSync, writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const atlas = JSON.parse(readFileSync('./public/models/atlas.json', 'utf8'));
const skinPart = atlas.parts.find(p => p.id === 'FJ2810');
const chunk = atlas.chunks[skinPart.chunk];
const gzBuffer = readFileSync('./public/' + chunk.gzip);
const buffer = gunzipSync(gzBuffer);
const positions = new Float32Array(buffer.buffer, buffer.byteOffset + skinPart.positions, skinPart.vertexCount * 3);

console.log('=== 眼眶周围皮肤顶点分析 ===\n');

// 收集面部区域的顶点（左侧，Y>1.5, Z>0.05, X>0）
const faceVertices = [];
for (let i = 0; i < positions.length; i += 3) {
  const x = positions[i];
  const y = positions[i + 1];
  const z = positions[i + 2];
  if (y > 1.50 && y < 1.68 && z > 0.04 && x > 0 && x < 0.12) {
    faceVertices.push({x, y, z, index: i / 3});
  }
}

console.log('面部区域顶点数: ' + faceVertices.length);

// 1. 找内眼角区域（眼眶内侧角）
// 内眼角大约在 X≈0.02-0.04, Y≈1.57-1.60, Z≈0.07-0.10
console.log('\n--- 内眼角区域（睛明）---');
const innerEye = faceVertices.filter(v => v.x > 0.015 && v.x < 0.045 && v.y > 1.570 && v.y < 1.605 && v.z > 0.065 && v.z < 0.105);
console.log('顶点数: ' + innerEye.length);
if (innerEye.length > 0) {
  const avgX = innerEye.reduce((s, v) => s + v.x, 0) / innerEye.length;
  const avgY = innerEye.reduce((s, v) => s + v.y, 0) / innerEye.length;
  const avgZ = innerEye.reduce((s, v) => s + v.z, 0) / innerEye.length;
  console.log('平均坐标: X=' + avgX.toFixed(4) + ' Y=' + avgY.toFixed(4) + ' Z=' + avgZ.toFixed(4));
  // 找最靠前的点（Z最大）
  const frontMost = innerEye.reduce((a, b) => a.z > b.z ? a : b);
  console.log('最前点: X=' + frontMost.x.toFixed(4) + ' Y=' + frontMost.y.toFixed(4) + ' Z=' + frontMost.z.toFixed(4) + ' (index=' + frontMost.index + ')');
  // 找最靠外的点（X最大）
  const outerMost = innerEye.reduce((a, b) => a.x > b.x ? a : b);
  console.log('最外点: X=' + outerMost.x.toFixed(4) + ' Y=' + outerMost.y.toFixed(4) + ' Z=' + outerMost.z.toFixed(4) + ' (index=' + outerMost.index + ')');
}

// 2. 找眉头区域（攒竹）
// 眉头大约在 X≈0.02-0.04, Y≈1.60-1.63, Z≈0.06-0.09
console.log('\n--- 眉头区域（攒竹）---');
const browInner = faceVertices.filter(v => v.x > 0.015 && v.x < 0.045 && v.y > 1.600 && v.y < 1.630 && v.z > 0.060 && v.z < 0.095);
console.log('顶点数: ' + browInner.length);
if (browInner.length > 0) {
  const avgX = browInner.reduce((s, v) => s + v.x, 0) / browInner.length;
  const avgY = browInner.reduce((s, v) => s + v.y, 0) / browInner.length;
  const avgZ = browInner.reduce((s, v) => s + v.z, 0) / browInner.length;
  console.log('平均坐标: X=' + avgX.toFixed(4) + ' Y=' + avgY.toFixed(4) + ' Z=' + avgZ.toFixed(4));
  // 找最靠上的点（Y最大）
  const topMost = browInner.reduce((a, b) => a.y > b.y ? a : b);
  console.log('最上点: X=' + topMost.x.toFixed(4) + ' Y=' + topMost.y.toFixed(4) + ' Z=' + topMost.z.toFixed(4) + ' (index=' + topMost.index + ')');
}

// 3. 找前发际区域（眉冲）
// 前发际大约在 X≈0.02-0.05, Y≈1.64-1.67, Z≈0.05-0.08
console.log('\n--- 前发际区域（眉冲）---');
const hairline = faceVertices.filter(v => v.x > 0.015 && v.x < 0.055 && v.y > 1.640 && v.y < 1.675 && v.z > 0.045 && v.z < 0.085);
console.log('顶点数: ' + hairline.length);
if (hairline.length > 0) {
  const avgX = hairline.reduce((s, v) => s + v.x, 0) / hairline.length;
  const avgY = hairline.reduce((s, v) => s + v.y, 0) / hairline.length;
  const avgZ = hairline.reduce((s, v) => s + v.z, 0) / hairline.length;
  console.log('平均坐标: X=' + avgX.toFixed(4) + ' Y=' + avgY.toFixed(4) + ' Z=' + avgZ.toFixed(4));
}

// 4. 输出眼眶周围的所有顶点，供人工判断
console.log('\n--- 眼眶周围顶点（按Y排序，前20个）---');
const eyeArea = faceVertices.filter(v => v.x > 0.010 && v.x < 0.060 && v.y > 1.560 && v.y < 1.650 && v.z > 0.050);
const sorted = eyeArea.sort((a, b) => b.y - a.y).slice(0, 20);
for (const v of sorted) {
  console.log('  index=' + v.index + ' X=' + v.x.toFixed(4) + ' Y=' + v.y.toFixed(4) + ' Z=' + v.z.toFixed(4));
}

// 保存分析结果
const result = {
  innerEye: innerEye.length > 0 ? {
    avg: [innerEye.reduce((s, v) => s + v.x, 0) / innerEye.length,
          innerEye.reduce((s, v) => s + v.y, 0) / innerEye.length,
          innerEye.reduce((s, v) => s + v.z, 0) / innerEye.length],
    frontMost: innerEye.length > 0 ? [innerEye.reduce((a, b) => a.z > b.z ? a : b).x, 
                                        innerEye.reduce((a, b) => a.z > b.z ? a : b).y,
                                        innerEye.reduce((a, b) => a.z > b.z ? a : b).z] : null
  } : null,
  browInner: browInner.length > 0 ? {
    avg: [browInner.reduce((s, v) => s + v.x, 0) / browInner.length,
          browInner.reduce((s, v) => s + v.y, 0) / browInner.length,
          browInner.reduce((s, v) => s + v.z, 0) / browInner.length]
  } : null,
  hairline: hairline.length > 0 ? {
    avg: [hairline.reduce((s, v) => s + v.x, 0) / hairline.length,
          hairline.reduce((s, v) => s + v.y, 0) / hairline.length,
          hairline.reduce((s, v) => s + v.z, 0) / hairline.length]
  } : null
};

writeFileSync('./eye-area-analysis.json', JSON.stringify(result, null, 2));
console.log('\n已保存分析结果到 eye-area-analysis.json');
