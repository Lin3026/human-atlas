// 批量标注腹部四经穴位：胃经(ST)、肾经(KI)、脾经(SP)、肝经(LR)
// 腹部穴位旁开前正中线固定距离，Y坐标参考任脉对应穴位
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
const direction = new T.Vector3(0, 0, -1);

function projectFront(x, y) {
  const origin = new T.Vector3(x, y, skinGeo.boundingBox.max.z + 0.25);
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
    method: 'abdomen-parallel-projection',
    status: 'pending-review'
  };
}

// 1寸 ≈ 0.026m（从任脉穴位Y坐标差计算得出）
const CUN = 0.026;

// 腹部四经穴位定义（左侧，X为正）
// Y坐标参考任脉：脐上6寸=1.195, 5寸=1.169, 4寸=1.143, 3寸=1.117, 2寸=1.091, 1寸=1.065, 脐=1.039, 下1寸=1.013, 下2寸=0.987, 下3寸=0.961, 下4寸=0.935, 下5寸=0.909
const abdomenPoints = [
  // 胃经 ST：旁开2寸 = 0.052m
  { code: 'ST19', name: '不容',   x: 2*CUN, y: 1.195, meridian: 'ST' },
  { code: 'ST20', name: '承满',   x: 2*CUN, y: 1.169, meridian: 'ST' },
  { code: 'ST21', name: '梁门',   x: 2*CUN, y: 1.143, meridian: 'ST' },
  { code: 'ST22', name: '关门',   x: 2*CUN, y: 1.117, meridian: 'ST' },
  { code: 'ST23', name: '太乙',   x: 2*CUN, y: 1.091, meridian: 'ST' },
  { code: 'ST24', name: '滑肉门', x: 2*CUN, y: 1.065, meridian: 'ST' },
  { code: 'ST25', name: '天枢',   x: 2*CUN, y: 1.039, meridian: 'ST' },
  { code: 'ST26', name: '外陵',   x: 2*CUN, y: 1.013, meridian: 'ST' },
  { code: 'ST27', name: '大巨',   x: 2*CUN, y: 0.987, meridian: 'ST' },
  { code: 'ST28', name: '水道',   x: 2*CUN, y: 0.961, meridian: 'ST' },
  { code: 'ST29', name: '归来',   x: 2*CUN, y: 0.935, meridian: 'ST' },
  { code: 'ST30', name: '气冲',   x: 2*CUN, y: 0.909, meridian: 'ST' },
  
  // 肾经 KI：旁开0.5寸 = 0.013m
  { code: 'KI11', name: '横骨',   x: 0.5*CUN, y: 0.909, meridian: 'KI' },
  { code: 'KI12', name: '大赫',   x: 0.5*CUN, y: 0.935, meridian: 'KI' },
  { code: 'KI13', name: '气穴',   x: 0.5*CUN, y: 0.961, meridian: 'KI' },
  { code: 'KI14', name: '四满',   x: 0.5*CUN, y: 0.987, meridian: 'KI' },
  { code: 'KI15', name: '中注',   x: 0.5*CUN, y: 1.013, meridian: 'KI' },
  { code: 'KI16', name: '肓俞',   x: 0.5*CUN, y: 1.039, meridian: 'KI' },
  { code: 'KI17', name: '商曲',   x: 0.5*CUN, y: 1.091, meridian: 'KI' },
  { code: 'KI18', name: '石关',   x: 0.5*CUN, y: 1.117, meridian: 'KI' },
  { code: 'KI19', name: '阴都',   x: 0.5*CUN, y: 1.143, meridian: 'KI' },
  { code: 'KI20', name: '腹通谷', x: 0.5*CUN, y: 1.169, meridian: 'KI' },
  { code: 'KI21', name: '幽门',   x: 0.5*CUN, y: 1.195, meridian: 'KI' },
  
  // 脾经 SP：旁开4寸 = 0.104m
  { code: 'SP12', name: '冲门',   x: 4*CUN, y: 0.895, meridian: 'SP' },
  { code: 'SP13', name: '府舍',   x: 4*CUN, y: 0.935, meridian: 'SP' },
  { code: 'SP14', name: '腹结',   x: 4*CUN, y: 1.005, meridian: 'SP' },
  { code: 'SP15', name: '大横',   x: 4*CUN, y: 1.039, meridian: 'SP' },
  { code: 'SP16', name: '腹哀',   x: 4*CUN, y: 1.117, meridian: 'SP' },
  
  // 肝经 LR：章门（侧腹）、期门（胸部）
  { code: 'LR13', name: '章门',   x: 0.18, y: 1.15, meridian: 'LR' },
  { code: 'LR14', name: '期门',   x: 0.10, y: 1.27, meridian: 'LR' },
];

const results = {};
const modelKey = JSON.stringify([
  atlas.version, skinPart.id,
  skinPart.vertexCount, skinPart.indexCount, skinPart.bounds
]);

console.log('=== 生成腹部四经穴位（左侧）===\n');
let hit = 0, miss = 0;
for (const pt of abdomenPoints) {
  const surface = projectFront(pt.x, pt.y);
  if (surface) {
    results[pt.code] = surface;
    hit++;
    console.log(`  ✓ ${pt.code} ${pt.name}: pos=(${surface.position.map(v=>v.toFixed(3)).join(', ')})`);
  } else {
    miss++;
    console.log(`  ✗ ${pt.code} ${pt.name}: 未命中皮肤`);
  }
}

const output = {
  schema: 1,
  modelKey,
  standard: 'GB/T 12346—2021',
  points: results,
  exportedAt: new Date().toISOString(),
  algorithm: {
    region: 'ST19-ST30, KI11-KI21, SP12-SP16, LR13-LR14 腹部四经（左侧）',
    method: 'abdomen-parallel-front-raycast',
    description: '旁开前正中线固定距离（胃经2寸、肾经0.5寸、脾经4寸），Y参考任脉对应穴位，从前方射线投射到皮肤',
    limitation: '仅标注左侧，右侧需镜像；1寸=0.026m为估算值；章门/期门为估算位置，需人工核验'
  },
  count: Object.keys(results).length
};

writeFileSync('./abdomen-4meridians-draft.json', JSON.stringify(output, null, 2));
console.log(`\n=== 完成：命中 ${hit}，未命中 ${miss}，总计 ${hit+miss} → abdomen-4meridians-draft.json ===`);
