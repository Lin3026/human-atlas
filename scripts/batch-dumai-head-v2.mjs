// 修正督脉头部穴位：用指定Y坐标找最近皮肤点，而不是从上方投射
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
skinGeo.computeBoundingBox();
const skin = new T.Mesh(skinGeo, new T.MeshBasicMaterial());
skin.updateMatrixWorld(true);

const raycaster = new T.Raycaster();

// 方法1：从指定方向投射
function projectFromDirection(x, y, z, dir) {
  let origin, direction;
  if (dir === 'front') {
    origin = new T.Vector3(x, y, skinGeo.boundingBox.max.z + 0.25);
    direction = new T.Vector3(0, 0, -1);
  } else if (dir === 'back') {
    origin = new T.Vector3(x, y, skinGeo.boundingBox.min.z - 0.25);
    direction = new T.Vector3(0, 0, 1);
  } else {
    origin = new T.Vector3(x, skinGeo.boundingBox.max.y + 0.25, z);
    direction = new T.Vector3(0, -1, 0);
  }
  raycaster.set(origin, direction);
  raycaster.near = 0;
  raycaster.far = 1;
  const hits = raycaster.intersectObject(skin, false);
  return hits[0] || null;
}

// 方法2：在皮肤顶点中找最接近指定(Y, x≈0)的点，用于头顶弧线穴位
function findNearestOnHead(targetY, targetZ, xRange = 0.03) {
  const posAttr = skinGeo.getAttribute('position');
  let bestDist = Infinity, bestPoint = null, bestIndex = -1;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
    if (Math.abs(x) > xRange) continue;
    // 只考虑头部区域
    if (y < 1.50) continue;
    const dist = Math.pow(y - targetY, 2) * 4 + Math.pow(z - targetZ, 2);
    if (dist < bestDist) {
      bestDist = dist;
      bestPoint = [x, y, z];
      bestIndex = i;
    }
  }
  return bestPoint;
}

// 从命中点计算表面数据
function surfaceFromHit(hit, direction) {
  if (!hit?.face || hit.faceIndex == null) return null;
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
    method: 'head-landmark-projection',
    status: 'pending-review'
  };
}

// 从顶点位置计算表面数据（找包含该顶点的三角面）
function surfaceFromVertex(point) {
  // 从该点沿法线方向投射找皮肤面
  const dir = new T.Vector3(0, 0, point[2] > 0 ? -1 : 1);
  if (Math.abs(point[2]) < 0.02) dir.set(0, -1, 0); // 头顶区域从上往下
  const origin = new T.Vector3(point[0], point[1] + 0.02, point[2]);
  raycaster.set(origin, new T.Vector3(0, -1, 0));
  raycaster.near = 0;
  raycaster.far = 0.1;
  const hits = raycaster.intersectObject(skin, false);
  if (hits.length) return surfaceFromHit(hits[0], new T.Vector3(0, -1, 0));
  return null;
}

// 督脉头部穴位（修正版）
const headPoints = [
  // 头顶弧线穴位：用指定Y,Z找最近皮肤点
  { code: 'GV17', name: '脑户',   y: 1.590, z: -0.080, method: 'nearest', note: '枕外隆凸上缘' },
  { code: 'GV18', name: '强间',   y: 1.655, z: -0.055, method: 'nearest', note: '百会后3寸' },
  { code: 'GV19', name: '后顶',   y: 1.690, z: -0.038, method: 'nearest', note: '百会后1.5寸' },
  { code: 'GV20', name: '百会',   y: 1.719, z: -0.020, method: 'nearest', note: '头顶最高点' },
  { code: 'GV21', name: '前顶',   y: 1.700, z: 0.000, method: 'nearest', note: '百会前1.5寸' },
  { code: 'GV22', name: '囟会',   y: 1.680, z: 0.022, method: 'nearest', note: '百会前3寸' },
  { code: 'GV23', name: '上星',   y: 1.655, z: 0.048, method: 'nearest', note: '前发际上1寸' },
  { code: 'GV24', name: '神庭',   y: 1.640, z: 0.058, method: 'nearest', note: '前发际上0.5寸' },
  // 面部穴位：从前方投射
  { code: 'GV29', name: '印堂',   y: 1.605, dir: 'front', note: '两眉头连线中点' },
  { code: 'GV25', name: '素髎',   y: 1.566, dir: 'front', note: '鼻尖中央' },
  { code: 'GV26', name: '水沟',   y: 1.540, dir: 'front', note: '人中沟上1/3' },
  { code: 'GV27', name: '兑端',   y: 1.520, dir: 'front', note: '上唇尖端' },
];

const results = {};
const modelKey = JSON.stringify([
  atlas.version, skinPart.id,
  skinPart.vertexCount, skinPart.indexCount, skinPart.bounds
]);

console.log('=== 生成督脉头部穴位（修正版）===\n');
for (const pt of headPoints) {
  console.log(`${pt.code} ${pt.name}: ${pt.note}`);
  let surface = null;
  
  if (pt.method === 'nearest') {
    const point = findNearestOnHead(pt.y, pt.z);
    if (point) {
      surface = surfaceFromVertex(point);
      // 如果从上方投射失败，直接用顶点位置构造
      if (!surface) {
        surface = {
          position: point,
          displayNormal: [0, 1, 0],
          faceIndex: 0,
          vertexIndices: [0, 0, 0],
          barycentric: [0.33, 0.33, 0.34],
          meshId: 'FJ2810',
          method: 'head-vertex-nearest',
          status: 'pending-review'
        };
      }
    }
  } else if (pt.dir === 'front') {
    const hit = projectFromDirection(0.001, pt.y, 0, 'front');
    if (hit) surface = surfaceFromHit(hit, new T.Vector3(0, 0, -1));
  }
  
  if (surface) {
    results[pt.code] = surface;
    console.log(`  ✓ pos=(${surface.position.map(v=>v.toFixed(4)).join(', ')})`);
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
    region: 'GV17-GV27,GV29 督脉头部面部',
    method: 'skull-landmark-nearest-vertex + front-raycast',
    limitation: 'GV28龈交在口腔内未标注；头部穴位为估算，需人工核验'
  },
  count: Object.keys(results).length
};

writeFileSync('./dumai-head-v2-draft.json', JSON.stringify(output, null, 2));
console.log(`\n=== 完成：生成 ${Object.keys(results).length}/${headPoints.length} 个头部穴位 ===`);
