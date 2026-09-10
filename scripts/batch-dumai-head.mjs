// 标注督脉头部穴位 GV17-GV29（含百会）
// 头顶穴位从上方(+Y)向下投射，面部穴位从前方(+Z)向后投射
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
skinGeo.computeBoundingBox();
const skin = new T.Mesh(skinGeo, new T.MeshBasicMaterial());
skin.updateMatrixWorld(true);

const raycaster = new T.Raycaster();

function projectFromDirection(x, y, z, dir) {
  let origin, direction;
  if (dir === 'top') {
    // 从头顶上方向下投射
    origin = new T.Vector3(x, skinGeo.boundingBox.max.y + 0.25, z);
    direction = new T.Vector3(0, -1, 0);
  } else if (dir === 'front') {
    // 从身体前方向后投射
    origin = new T.Vector3(x, y, skinGeo.boundingBox.max.z + 0.25);
    direction = new T.Vector3(0, 0, -1);
  } else {
    // 从后方向前投射
    origin = new T.Vector3(x, y, skinGeo.boundingBox.min.z - 0.25);
    direction = new T.Vector3(0, 0, 1);
  }
  
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
    method: 'head-landmark-projection',
    status: 'pending-review'
  };
}

// 督脉头部穴位定义
// 头顶穴位(dir=top)：指定大致X,Z，从上方投射找到Y
// 面部穴位(dir=front)：指定大致X,Y，从前方投射找到Z
const headPoints = [
  // 头顶穴位：从上方投射
  { code: 'GV17', name: '脑户',   x: 0.001, z: -0.075, dir: 'top', note: '枕外隆凸上缘，风府上1.5寸' },
  { code: 'GV18', name: '强间',   x: 0.001, z: -0.050, dir: 'top', note: '百会后3寸' },
  { code: 'GV19', name: '后顶',   x: 0.001, z: -0.035, dir: 'top', note: '百会后1.5寸' },
  { code: 'GV20', name: '百会',   x: 0.001, z: -0.020, dir: 'top', note: '头顶最高点，两耳尖连线中点' },
  { code: 'GV21', name: '前顶',   x: 0.001, z: 0.000, dir: 'top', note: '百会前1.5寸' },
  { code: 'GV22', name: '囟会',   x: 0.001, z: 0.020, dir: 'top', note: '百会前3寸' },
  { code: 'GV23', name: '上星',   x: 0.001, z: 0.045, dir: 'top', note: '前发际正中直上1寸' },
  { code: 'GV24', name: '神庭',   x: 0.001, z: 0.055, dir: 'top', note: '前发际正中直上0.5寸' },
  // 面部穴位：从前方投射
  { code: 'GV29', name: '印堂',   x: 0.001, y: 1.605, dir: 'front', note: '两眉头连线中点' },
  { code: 'GV25', name: '素髎',   x: 0.001, y: 1.566, dir: 'front', note: '鼻尖中央' },
  { code: 'GV26', name: '水沟',   x: 0.001, y: 1.540, dir: 'front', note: '人中沟上1/3' },
  { code: 'GV27', name: '兑端',   x: 0.001, y: 1.520, dir: 'front', note: '上唇尖端' },
  // GV28龈交在口腔内，暂不标注
];

const results = {};
const modelKey = JSON.stringify([
  atlas.version, skinPart.id,
  skinPart.vertexCount, skinPart.indexCount, skinPart.bounds
]);

console.log('=== 生成督脉头部穴位 ===\n');
for (const pt of headPoints) {
  console.log(`${pt.code} ${pt.name}: ${pt.note}`);
  let surface;
  if (pt.dir === 'top') {
    surface = projectFromDirection(pt.x, 0, pt.z, 'top');
  } else {
    surface = projectFromDirection(pt.x, pt.y, 0, 'front');
  }
  
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
    region: 'GV17-GV27,GV29 督脉头部面部',
    method: 'skull-landmark-estimation-then-directional-raycast',
    description: '头顶穴位从上方(+Y)向下投射，面部穴位从前方(+Z)向后投射',
    limitation: 'GV28龈交在口腔内未标注；所有头部穴位为估算，需人工核验'
  },
  count: Object.keys(results).length
};

writeFileSync('./dumai-head-GV17-GV29-draft.json', JSON.stringify(output, null, 2));
console.log(`\n=== 完成：生成 ${Object.keys(results).length}/${headPoints.length} 个头部穴位 → dumai-head-GV17-GV29-draft.json ===`);
