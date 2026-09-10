// 查找颅骨关键标志点，用于标注督脉头部穴位
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const atlas = JSON.parse(readFileSync('./public/models/atlas.json', 'utf8'));

function loadPart(partId) {
  const part = atlas.parts.find(p => p.id === partId);
  if (!part) return null;
  const c = atlas.chunks[part.chunk];
  const gz = readFileSync('./public/' + c.gzip);
  const buf = gunzipSync(gz);
  const pos = new Float32Array(buf.buffer, buf.byteOffset + part.positions, part.vertexCount * 3);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.computeBoundingBox();
  return { part, geo, box: geo.boundingBox };
}

// 加载颅骨主要部件
const skullParts = {
  occipital: loadPart('FJ3309'),  // 枕骨
  frontal: loadPart('FJ3200'),    // 额骨
  parietalL: loadPart('FJ3274'),  // 左顶骨
  parietalR: loadPart('FJ3380'),  // 右顶骨
  temporalL: loadPart('FJ3281'),  // 左颞骨
  nasalL: loadPart('FJ3272'),     // 左鼻骨
  maxillaL: loadPart('FJ3269'),   // 左上颌骨
  mandible: loadPart('FJ3289'),   // 下颌骨
  skin: loadPart('FJ2810'),       // 皮肤
};

console.log('=== 颅骨关键标志点 ===\n');

for (const [name, p] of Object.entries(skullParts)) {
  if (p) {
    console.log(`${name} (${p.part.name}):`);
    console.log(`  X: [${p.box.min.x.toFixed(3)}, ${p.box.max.x.toFixed(3)}]`);
    console.log(`  Y: [${p.box.min.y.toFixed(3)}, ${p.box.max.y.toFixed(3)}]`);
    console.log(`  Z: [${p.box.min.z.toFixed(3)}, ${p.box.max.z.toFixed(3)}]`);
    console.log(`  最高点: Y=${p.box.max.y.toFixed(3)}, Z=${((p.box.min.z+p.box.max.z)/2).toFixed(3)}`);
    console.log(`  最前点: Z=${p.box.max.z.toFixed(3)}, Y=${((p.box.min.y+p.box.max.y)/2).toFixed(3)}`);
    console.log();
  }
}

// 找皮肤的头顶最高点（百会附近）
if (skullParts.skin) {
  const skin = skullParts.skin;
  // 遍历顶点找最高点
  const posAttr = skin.geo.getAttribute('position');
  let highestY = -Infinity, highestPoint = null;
  let frontMostZ = -Infinity, frontPoint = null;
  let backMostZ = Infinity, backPoint = null;
  
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
    // 只考虑头部区域（Y>1.4，X在中间）
    if (y > 1.4 && Math.abs(x) < 0.1) {
      if (y > highestY) { highestY = y; highestPoint = [x, y, z]; }
      if (z > frontMostZ) { frontMostZ = z; frontPoint = [x, y, z]; }
      if (z < backMostZ) { backMostZ = z; backPoint = [x, y, z]; }
    }
  }
  
  console.log('=== 皮肤头部关键点 ===');
  console.log('  头顶最高点(百会附近):', highestPoint?.map(v=>v.toFixed(4)));
  console.log('  头部最前点(前额/鼻):', frontPoint?.map(v=>v.toFixed(4)));
  console.log('  头部最后点(枕部):', backPoint?.map(v=>v.toFixed(4)));
  
  // 找鼻尖区域（Y在1.5-1.6，Z最大）
  let noseZ = -Infinity, nosePoint = null;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
    if (y > 1.48 && y < 1.58 && Math.abs(x) < 0.03 && z > 0.10) {
      if (z > noseZ) { noseZ = z; nosePoint = [x, y, z]; }
    }
  }
  console.log('  鼻尖区域(素髎附近):', nosePoint?.map(v=>v.toFixed(4)));
  
  // 找人中区域（Y在1.45-1.52，Z较大）
  let philtrumZ = -Infinity, philtrumPoint = null;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
    if (y > 1.43 && y < 1.50 && Math.abs(x) < 0.02 && z > 0.11) {
      if (z > philtrumZ) { philtrumZ = z; philtrumPoint = [x, y, z]; }
    }
  }
  console.log('  人中区域(水沟附近):', philtrumPoint?.map(v=>v.toFixed(4)));
}
