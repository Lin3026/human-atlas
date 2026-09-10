// 查找第7颈椎和第1胸椎的位置，修正大椎(GV14)
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const atlas = JSON.parse(readFileSync('./public/models/atlas.json', 'utf8'));

function loadPart(partId) {
  const part = atlas.parts.find(p => p.id === partId);
  if (!part) { console.log('未找到部件:', partId); return null; }
  
  const chunk = atlas.chunks[part.chunk];
  const gzBuffer = readFileSync('./public/' + chunk.gzip);
  const buffer = gunzipSync(gzBuffer);
  
  const positions = new Float32Array(buffer.buffer, buffer.byteOffset + part.positions, part.vertexCount * 3);
  const indices = new Uint32Array(buffer.buffer, buffer.byteOffset + part.indices, part.indexCount);
  
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  geometry.setIndex(new T.BufferAttribute(indices, 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  
  return { part, geometry };
}

// 加载第7颈椎和第1胸椎
const c7 = loadPart('FJ3172'); // Seventh cervical vertebra
const t1 = loadPart('FJ3158'); // First thoracic vertebra

if (c7 && t1) {
  console.log('=== 第7颈椎 (C7) ===');
  console.log('  名称:', c7.part.name);
  console.log('  Bounding box:');
  console.log('    X:', c7.geometry.boundingBox.min.x.toFixed(4), '~', c7.geometry.boundingBox.max.x.toFixed(4));
  console.log('    Y:', c7.geometry.boundingBox.min.y.toFixed(4), '~', c7.geometry.boundingBox.max.y.toFixed(4));
  console.log('    Z:', c7.geometry.boundingBox.min.z.toFixed(4), '~', c7.geometry.boundingBox.max.z.toFixed(4));
  console.log('  棘突尖(最靠后): Z=', c7.geometry.boundingBox.min.z.toFixed(4));
  console.log('  最下端: Y=', c7.geometry.boundingBox.min.y.toFixed(4));
  
  console.log('\n=== 第1胸椎 (T1) ===');
  console.log('  名称:', t1.part.name);
  console.log('  Bounding box:');
  console.log('    X:', t1.geometry.boundingBox.min.x.toFixed(4), '~', t1.geometry.boundingBox.max.x.toFixed(4));
  console.log('    Y:', t1.geometry.boundingBox.min.y.toFixed(4), '~', t1.geometry.boundingBox.max.y.toFixed(4));
  console.log('    Z:', t1.geometry.boundingBox.min.z.toFixed(4), '~', t1.geometry.boundingBox.max.z.toFixed(4));
  console.log('  最上端: Y=', t1.geometry.boundingBox.max.y.toFixed(4));
  
  // 大椎在第7颈椎棘突下凹陷中
  // Y坐标：C7最下端和T1最上端之间
  const dazhuiY = (c7.geometry.boundingBox.min.y + t1.geometry.boundingBox.max.y) / 2;
  console.log('\n=== 大椎(GV14)估算位置 ===');
  console.log('  C7最下端 Y=', c7.geometry.boundingBox.min.y.toFixed(4));
  console.log('  T1最上端 Y=', t1.geometry.boundingBox.max.y.toFixed(4));
  console.log('  大椎Y(中点)=', dazhuiY.toFixed(4));
  console.log('  棘突后方Z≈', (c7.geometry.boundingBox.min.z - 0.01).toFixed(4), '(皮肤表面)');
  console.log('  当前标注的大椎Y=1.365（需要修正）');
  
  // 也看看其他关键椎骨的位置，用于修正整个督脉
  console.log('\n=== 其他关键椎骨位置参考 ===');
  const keyVertebrae = [
    ['FJ3161', 'C3 第3颈椎'],
    ['FJ3164', 'C4 第4颈椎'],
    ['FJ3167', 'C5 第5颈椎'],
    ['FJ3170', 'C6 第6颈椎'],
    ['FJ3158', 'T1 第1胸椎'],
    ['FJ3160', 'T2 第2胸椎'],
    ['FJ3163', 'T3 第3胸椎'],
    ['FJ3166', 'T4 第4胸椎'],
    ['FJ3169', 'T5 第5胸椎'],
    ['FJ3171', 'T6 第6胸椎'],
    ['FJ3173', 'T7 第7胸椎'],
    ['FJ3174', 'T8 第8胸椎'],
    ['FJ3175', 'T9 第9胸椎'],
    ['FJ3154', 'T10 第10胸椎'],
    ['FJ3155', 'T11 第11胸椎'],
    ['FJ3156', 'T12 第12胸椎'],
    ['FJ3157', 'L1 第1腰椎'],
    ['FJ3159', 'L2 第2腰椎'],
    ['FJ3162', 'L3 第3腰椎'],
    ['FJ3165', 'L4 第4腰椎'],
    ['FJ3168', 'L5 第5腰椎'],
    ['FJ3393', 'Sacrum 骶骨'],
  ];
  
  for (const [id, name] of keyVertebrae) {
    const v = loadPart(id);
    if (v) {
      console.log(`  ${name}: Y[${v.geometry.boundingBox.min.y.toFixed(3)}, ${v.geometry.boundingBox.max.y.toFixed(3)}] Zmin=${v.geometry.boundingBox.min.z.toFixed(3)}`);
    }
  }
}
