// 计算模型身高和骨度分寸单位
import * as T from 'three';
import {readFileSync, writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const atlas = JSON.parse(readFileSync('./public/models/atlas.json', 'utf8'));
const skinPart = atlas.parts.find(p => p.id === 'FJ2810');
const chunk = atlas.chunks[skinPart.chunk];
const gzBuffer = readFileSync('./public/' + chunk.gzip);
const buffer = gunzipSync(gzBuffer);
const positions = new Float32Array(buffer.buffer, buffer.byteOffset + skinPart.positions, skinPart.vertexCount * 3);

// 计算bounding box
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let minZ = Infinity, maxZ = -Infinity;

for (let i = 0; i < positions.length; i += 3) {
  minX = Math.min(minX, positions[i]);
  maxX = Math.max(maxX, positions[i]);
  minY = Math.min(minY, positions[i + 1]);
  maxY = Math.max(maxY, positions[i + 1]);
  minZ = Math.min(minZ, positions[i + 2]);
  maxZ = Math.max(maxZ, positions[i + 2]);
}

const heightMeters = maxY - minY;
const heightCm = heightMeters * 100;

console.log('=== 模型尺寸 ===');
console.log('X范围: ' + minX.toFixed(4) + ' ~ ' + maxX.toFixed(4) + ' m (' + ((maxX-minX)*100).toFixed(1) + ' cm)');
console.log('Y范围: ' + minY.toFixed(4) + ' ~ ' + maxY.toFixed(4) + ' m');
console.log('Z范围: ' + minZ.toFixed(4) + ' ~ ' + maxZ.toFixed(4) + ' m (' + ((maxZ-minZ)*100).toFixed(1) + ' cm)');
console.log('身高: ' + heightMeters.toFixed(4) + ' m = ' + heightCm.toFixed(1) + ' cm');

// 骨度分寸法参考（标准成年人，身高约170cm）
// 上肢：肘横纹至腕横纹 = 12寸
// 下肢：腘横纹至外踝尖 = 16寸
// 躯干：胸剑联合至脐中 = 8寸

// 先获取关键骨性标志的Y坐标
console.log('\n=== 关键骨性标志Y坐标 ===');

// 肩峰（肩）Y≈1.41
// 肘横纹 Y≈1.11
// 腕横纹 Y≈0.885
// 股骨大转子 Y≈0.90
// 腘横纹（膝后）Y≈0.45
// 外踝尖 Y≈0.08
// 胸骨上窝 Y≈1.45
// 胸剑联合（剑突）Y≈1.15
// 脐 Y≈1.04
// 耻骨联合上缘 Y≈0.88

const landmarks = {
  '肩峰': 1.41,
  '肘横纹': 1.11,
  '腕横纹': 0.885,
  '股骨大转子': 0.90,
  '腘横纹': 0.45,
  '外踝尖': 0.08,
  '胸骨上窝': 1.45,
  '胸剑联合': 1.15,
  '脐': 1.04,
  '耻骨联合上缘': 0.88
};

for (const [name, y] of Object.entries(landmarks)) {
  console.log(name + ': Y=' + y.toFixed(3) + ' m (' + (y*100).toFixed(1) + ' cm)');
}

// 计算各部位的骨度分寸
console.log('\n=== 骨度分寸计算 ===');

// 上肢：肘横纹至腕横纹 = 12寸
const upperArmLength = landmarks['肘横纹'] - landmarks['腕横纹'];
const upperArmCun = upperArmLength / 12;
console.log('上肢（肘→腕）: ' + (upperArmLength*100).toFixed(1) + ' cm = 12寸');
console.log('  1寸 = ' + (upperArmCun*100).toFixed(2) + ' cm = ' + upperArmCun.toFixed(4) + ' m');

// 下肢：腘横纹至外踝尖 = 16寸
const lowerLegLength = landmarks['腘横纹'] - landmarks['外踝尖'];
const lowerLegCun = lowerLegLength / 16;
console.log('下肢（腘→外踝）: ' + (lowerLegLength*100).toFixed(1) + ' cm = 16寸');
console.log('  1寸 = ' + (lowerLegCun*100).toFixed(2) + ' cm = ' + lowerLegCun.toFixed(4) + ' m');

// 躯干：胸剑联合至脐中 = 8寸
const trunkLength = landmarks['胸剑联合'] - landmarks['脐'];
const trunkCun = trunkLength / 8;
console.log('躯干（剑突→脐）: ' + (trunkLength*100).toFixed(1) + ' cm = 8寸');
console.log('  1寸 = ' + (trunkCun*100).toFixed(2) + ' cm = ' + trunkCun.toFixed(4) + ' m');

// 躯干：脐至耻骨联合上缘 = 5寸
const lowerTrunkLength = landmarks['脐'] - landmarks['耻骨联合上缘'];
const lowerTrunkCun = lowerTrunkLength / 5;
console.log('下腹（脐→耻骨）: ' + (lowerTrunkLength*100).toFixed(1) + ' cm = 5寸');
console.log('  1寸 = ' + (lowerTrunkCun*100).toFixed(2) + ' cm = ' + lowerTrunkCun.toFixed(4) + ' m');

// 平均1寸长度
const avgCun = (upperArmCun + lowerLegCun + trunkCun + lowerTrunkCun) / 4;
console.log('\n平均1寸 = ' + (avgCun*100).toFixed(2) + ' cm = ' + avgCun.toFixed(4) + ' m');

// 按身高比例计算（标准成年人身高170cm，1寸≈2.5cm）
const standardCun = heightCm / 68; // 170cm / 68寸 ≈ 2.5cm
console.log('按身高比例（170cm=68寸）: 1寸 = ' + standardCun.toFixed(2) + ' cm = ' + (standardCun/100).toFixed(4) + ' m');

// 输出参考值
const result = {
  heightCm: heightCm,
  heightMeters: heightMeters,
  cunCm: avgCun * 100,
  cunMeters: avgCun,
  upperArmCunMeters: upperArmCun,
  lowerLegCunMeters: lowerLegCun,
  trunkCunMeters: trunkCun,
  lowerTrunkCunMeters: lowerTrunkCun,
  landmarks: landmarks
};

writeFileSync('./bone-measurements.json', JSON.stringify(result, null, 2));
console.log('\n已导出到 bone-measurements.json');
