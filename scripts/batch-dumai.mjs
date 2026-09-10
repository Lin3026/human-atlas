// 批量标注督脉穴位（GV1-GV16 背部+颈部）
// 方法：基准点Y坐标插值 + 后方向射线投射到皮肤
import * as T from 'three';
import {readFileSync, writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

// 读取atlas.json
const atlas = JSON.parse(readFileSync('./public/models/atlas.json', 'utf8'));
const skinPart = atlas.parts.find(p => p.id === 'FJ2810');

// 读取chunk 10
const chunk = atlas.chunks[skinPart.chunk];
const gzBuffer = readFileSync('./public/' + chunk.gzip);
const buffer = gunzipSync(gzBuffer);

// 提取皮肤几何体
const positions = new Float32Array(buffer.buffer, buffer.byteOffset + skinPart.positions, skinPart.vertexCount * 3);
const normals = new Int16Array(buffer.buffer, buffer.byteOffset + skinPart.normals, skinPart.vertexCount * 3);
const indices = new Uint32Array(buffer.buffer, buffer.byteOffset + skinPart.indices, skinPart.indexCount);

const geometry = new T.BufferGeometry();
geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
geometry.setAttribute('normal', new T.BufferAttribute(normals, 3, true));
geometry.setIndex(new T.BufferAttribute(indices, 1));
geometry.computeBoundingBox();

const skin = new T.Mesh(geometry, new T.MeshBasicMaterial());
skin.updateMatrixWorld(true);

console.log('模型bounding box:');
console.log('  X:', geometry.boundingBox.min.x.toFixed(3), '~', geometry.boundingBox.max.x.toFixed(3));
console.log('  Y:', geometry.boundingBox.min.y.toFixed(3), '~', geometry.boundingBox.max.y.toFixed(3));
console.log('  Z:', geometry.boundingBox.min.z.toFixed(3), '~', geometry.boundingBox.max.z.toFixed(3));

// 督脉穴位定义（背部+颈部，GV1-GV16）
// 用Y坐标估算，从尾骨到后颈
const gvPoints = [
  { code: 'GV1',  name: '长强',   yEst: 0.815, region: 'coccyx' },
  { code: 'GV2',  name: '腰俞',   yEst: 0.845, region: 'sacrum' },
  { code: 'GV3',  name: '腰阳关', yEst: 0.895, region: 'lumbar' },
  { code: 'GV4',  name: '命门',   yEst: 0.945, region: 'lumbar' },
  { code: 'GV5',  name: '悬枢',   yEst: 0.975, region: 'lumbar' },
  { code: 'GV6',  name: '脊中',   yEst: 1.045, region: 'thoracic' },
  { code: 'GV7',  name: '中枢',   yEst: 1.075, region: 'thoracic' },
  { code: 'GV8',  name: '筋缩',   yEst: 1.105, region: 'thoracic' },
  { code: 'GV9',  name: '至阳',   yEst: 1.155, region: 'thoracic' },
  { code: 'GV10', name: '灵台',   yEst: 1.185, region: 'thoracic' },
  { code: 'GV11', name: '神道',   yEst: 1.215, region: 'thoracic' },
  { code: 'GV12', name: '身柱',   yEst: 1.265, region: 'thoracic' },
  { code: 'GV13', name: '陶道',   yEst: 1.315, region: 'thoracic' },
  { code: 'GV14', name: '大椎',   yEst: 1.365, region: 'cervical' },
  { code: 'GV15', name: '哑门',   yEst: 1.415, region: 'cervical' },
  { code: 'GV16', name: '风府',   yEst: 1.455, region: 'occipital' },
];

// 射线投射：从后往前（+Z方向）
const raycaster = new T.Raycaster();
const direction = new T.Vector3(0, 0, 1); // 从后往前

function projectToSkinBack(x, y) {
  // 从模型后方0.25米处向前投射
  const origin = new T.Vector3(x, y, skinPart.bounds[0][2] - 0.25);
  raycaster.set(origin, direction);
  raycaster.near = 0;
  raycaster.far = 1;
  
  const hits = raycaster.intersectObject(skin, false);
  if (!hits.length) return null;
  
  const hit = hits[0];
  if (!hit.face || hit.faceIndex == null) return null;
  
  const { a, b, c } = hit.face;
  const posAttr = geometry.getAttribute('position');
  const va = new T.Vector3().fromBufferAttribute(posAttr, a);
  const vb = new T.Vector3().fromBufferAttribute(posAttr, b);
  const vc = new T.Vector3().fromBufferAttribute(posAttr, c);
  const localPoint = skin.worldToLocal(hit.point.clone());
  
  const barycentric = new T.Vector3();
  T.Triangle.getBarycoord(localPoint, va, vb, vc, barycentric);
  
  const normal = hit.face.normal.clone().applyNormalMatrix(
    new T.Matrix3().getNormalMatrix(skin.matrixWorld)
  ).normalize();
  // 法线应该朝后（-Z方向），如果朝前就翻转
  if (normal.dot(direction) > 0) normal.negate();
  
  return {
    position: [hit.point.x, hit.point.y, hit.point.z],
    displayNormal: [normal.x, normal.y, normal.z],
    faceIndex: hit.faceIndex,
    vertexIndices: [a, b, c],
    barycentric: [barycentric.x, barycentric.y, barycentric.z],
    meshId: 'FJ2810',
    method: 'regional-projection',
    status: 'pending-review'
  };
}

// 批量生成
const results = {};
const modelKey = JSON.stringify([
  atlas.version, skinPart.id,
  skinPart.vertexCount, skinPart.indexCount, skinPart.bounds
]);

let success = 0;
let failed = [];

for (const pt of gvPoints) {
  console.log(`\n${pt.code} ${pt.name}: yEst=${pt.yEst}`);
  
  // 后正中线X坐标接近0，略微偏移
  const x = 0.001;
  
  const surface = projectToSkinBack(x, pt.yEst);
  if (surface) {
    results[pt.code] = surface;
    success++;
    console.log(`  ✓ 命中: pos=(${surface.position.map(v=>v.toFixed(4)).join(', ')}) face=${surface.faceIndex}`);
  } else {
    failed.push(pt.code);
    console.log(`  ✗ 未命中皮肤`);
  }
}

// 输出
const output = {
  schema: 1,
  modelKey,
  standard: 'GB/T 12346—2021',
  anchors: {
    coccyx: { note: '估算基准-尾骨端 Y≈0.815' },
    dazhui: { note: '估算基准-大椎(第7颈椎) Y≈1.365' }
  },
  points: results,
  exportedAt: new Date().toISOString(),
  coordinateSystem: {
    units: 'meter',
    positiveX: 'subject-left',
    positiveY: 'superior',
    positiveZ: 'anterior'
  },
  algorithm: {
    region: 'GV1-GV16 督脉背部颈部',
    method: 'estimated-Y-then-back-skin-raycast',
    limitation: 'Y坐标为估算值，所有穴位需人工核验，特别是棘突下定位'
  },
  count: Object.keys(results).length,
  failed
};

writeFileSync('./dumai-GV1-GV16-draft.json', JSON.stringify(output, null, 2));
console.log(`\n=== 完成：生成 ${success}/${gvPoints.length} 个穴位 → dumai-GV1-GV16-draft.json ===`);
if (failed.length) console.log('未命中:', failed.join(', '));
