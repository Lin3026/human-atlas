// 用准确的椎骨位置重新生成督脉穴位
// 每个穴位在对应椎骨棘突下凹陷中 = (当前椎骨最下端Y + 下一椎骨最上端Y) / 2
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

function loadPartBounds(partId) {
  const part = atlas.parts.find(p => p.id === partId);
  if (!part) return null;
  const c = atlas.chunks[part.chunk];
  const gz = readFileSync('./public/' + c.gzip);
  const buf = gunzipSync(gz);
  const pos = new Float32Array(buf.buffer, buf.byteOffset + part.positions, part.vertexCount * 3);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.computeBoundingBox();
  return {
    minY: geo.boundingBox.min.y,
    maxY: geo.boundingBox.max.y,
    minZ: geo.boundingBox.min.z,
    maxZ: geo.boundingBox.max.z
  };
}

// 加载所有关键椎骨的bounding box
const vertebrae = {
  C2: null, // 没有单独部件，估算
  C3: loadPartBounds('FJ3161'),
  C4: loadPartBounds('FJ3164'),
  C5: loadPartBounds('FJ3167'),
  C6: loadPartBounds('FJ3170'),
  C7: loadPartBounds('FJ3172'),
  T1: loadPartBounds('FJ3158'),
  T2: loadPartBounds('FJ3160'),
  T3: loadPartBounds('FJ3163'),
  T4: loadPartBounds('FJ3166'),
  T5: loadPartBounds('FJ3169'),
  T6: loadPartBounds('FJ3171'),
  T7: loadPartBounds('FJ3173'),
  T8: loadPartBounds('FJ3174'),
  T9: loadPartBounds('FJ3175'),
  T10: loadPartBounds('FJ3154'),
  T11: loadPartBounds('FJ3155'),
  T12: loadPartBounds('FJ3156'),
  L1: loadPartBounds('FJ3157'),
  L2: loadPartBounds('FJ3159'),
  L3: loadPartBounds('FJ3162'),
  L4: loadPartBounds('FJ3165'),
  L5: loadPartBounds('FJ3168'),
  Sacrum: loadPartBounds('FJ3393'),
};

// C2估算：C3最上端Y=1.524，C2大约在1.52-1.55
vertebrae.C2 = { minY: 1.515, maxY: 1.545, minZ: -0.055, maxZ: -0.01 };

console.log('椎骨位置:');
for (const [name, b] of Object.entries(vertebrae)) {
  if (b) console.log(`  ${name}: Y[${b.minY.toFixed(3)}, ${b.maxY.toFixed(3)}] Zmin=${b.minZ.toFixed(3)}`);
}

// 督脉穴位定义：穴位在哪个椎骨的棘突下
const gvPoints = [
  { code: 'GV1',  name: '长强',   yEst: 0.815, note: '尾骨端下' },
  { code: 'GV2',  name: '腰俞',   yEst: 0.875, note: '骶管裂孔' },
  { code: 'GV3',  name: '腰阳关', below: 'L4',  above: 'L5', note: '第4腰椎棘突下' },
  { code: 'GV4',  name: '命门',   below: 'L2',  above: 'L3', note: '第2腰椎棘突下' },
  { code: 'GV5',  name: '悬枢',   below: 'L1',  above: 'L2', note: '第1腰椎棘突下' },
  { code: 'GV6',  name: '脊中',   below: 'T11', above: 'T12', note: '第11胸椎棘突下' },
  { code: 'GV7',  name: '中枢',   below: 'T10', above: 'T11', note: '第10胸椎棘突下' },
  { code: 'GV8',  name: '筋缩',   below: 'T9',  above: 'T10', note: '第9胸椎棘突下' },
  { code: 'GV9',  name: '至阳',   below: 'T7',  above: 'T8', note: '第7胸椎棘突下' },
  { code: 'GV10', name: '灵台',   below: 'T6',  above: 'T7', note: '第6胸椎棘突下' },
  { code: 'GV11', name: '神道',   below: 'T5',  above: 'T6', note: '第5胸椎棘突下' },
  { code: 'GV12', name: '身柱',   below: 'T3',  above: 'T4', note: '第3胸椎棘突下' },
  { code: 'GV13', name: '陶道',   below: 'T1',  above: 'T2', note: '第1胸椎棘突下' },
  { code: 'GV14', name: '大椎',   below: 'C7',  above: 'T1', note: '第7颈椎棘突下' },
  { code: 'GV15', name: '哑门',   below: 'C2',  above: 'C3', note: '第2颈椎棘突下' },
  { code: 'GV16', name: '风府',   yEst: 1.545, note: '枕外隆凸直下' },
];

// 计算每个穴位的Y坐标
function getY(pt) {
  if (pt.yEst !== undefined) return pt.yEst;
  const below = vertebrae[pt.below];
  const above = vertebrae[pt.above];
  if (!below || !above) {
    console.log(`  警告: ${pt.code} 缺少椎骨数据，使用估算值`);
    return pt.yEst || 1.0;
  }
  // 棘突下凹陷 = 当前椎骨最下端和下一椎骨最上端的中点
  return (below.minY + above.maxY) / 2;
}

// 射线投射：从后往前
const raycaster = new T.Raycaster();
const direction = new T.Vector3(0, 0, 1);

function projectToSkinBack(x, y) {
  const origin = new T.Vector3(x, y, skinPart.bounds[0][2] - 0.25);
  raycaster.set(origin, direction);
  raycaster.near = 0;
  raycaster.far = 1;
  const hits = raycaster.intersectObject(skin, false);
  if (!hits.length) return null;
  const hit = hits[0];
  if (!hit.face || hit.faceIndex == null) return null;
  
  const { a, b, c } = hit.face;
  const posAttr = skinGeo.getAttribute('position');
  const va = new T.Vector3().fromBufferAttribute(posAttr, a);
  const vb = new T.Vector3().fromBufferAttribute(posAttr, b);
  const vc = new T.Vector3().fromBufferAttribute(posAttr, c);
  const localPoint = skin.worldToLocal(hit.point.clone());
  const barycentric = new T.Vector3();
  T.Triangle.getBarycoord(localPoint, va, vb, vc, barycentric);
  const normal = hit.face.normal.clone().applyNormalMatrix(
    new T.Matrix3().getNormalMatrix(skin.matrixWorld)
  ).normalize();
  if (normal.dot(direction) > 0) normal.negate();
  
  return {
    position: [hit.point.x, hit.point.y, hit.point.z],
    displayNormal: [normal.x, normal.y, normal.z],
    faceIndex: hit.faceIndex,
    vertexIndices: [a, b, c],
    barycentric: [barycentric.x, barycentric.y, barycentric.z],
    meshId: 'FJ2810',
    method: 'vertebra-spinous-process-projection',
    status: 'pending-review'
  };
}

// 批量生成
const results = {};
const modelKey = JSON.stringify([
  atlas.version, skinPart.id,
  skinPart.vertexCount, skinPart.indexCount, skinPart.bounds
]);

console.log('\n=== 生成督脉穴位 ===');
for (const pt of gvPoints) {
  const y = getY(pt);
  console.log(`\n${pt.code} ${pt.name}: ${pt.note}, targetY=${y.toFixed(4)}`);
  const surface = projectToSkinBack(0.001, y);
  if (surface) {
    results[pt.code] = surface;
    console.log(`  ✓ pos=(${surface.position.map(v=>v.toFixed(4)).join(', ')}) face=${surface.faceIndex}`);
  } else {
    console.log(`  ✗ 未命中皮肤`);
  }
}

const output = {
  schema: 1,
  modelKey,
  standard: 'GB/T 12346—2021',
  points: results,
  exportedAt: new Date().toISOString(),
  algorithm: {
    region: 'GV1-GV16 督脉背部颈部',
    method: 'vertebra-spinous-process-interpolation-then-back-skin-raycast',
    description: '每个穴位Y坐标=(当前椎骨最下端Y+下一椎骨最上端Y)/2，然后从后方向射线投射到皮肤',
    limitation: 'GV1长强、GV2腰俞、GV16风府为估算值，需人工核验'
  },
  count: Object.keys(results).length
};

writeFileSync('./dumai-GV1-GV16-v2-draft.json', JSON.stringify(output, null, 2));
console.log(`\n=== 完成：生成 ${Object.keys(results).length}/${gvPoints.length} 个穴位 → dumai-GV1-GV16-v2-draft.json ===`);
