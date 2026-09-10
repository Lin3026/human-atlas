// 批量标注任脉穴位（CV9-CV22）
// 方法：基准点Y坐标插值 + 前方向射线投射到皮肤
import * as T from 'three';
import {readFileSync, writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

// 读取atlas.json
const atlas = JSON.parse(readFileSync('./public/models/atlas.json', 'utf8'));
const skinPart = atlas.parts.find(p => p.id === 'FJ2810');
console.log('皮肤部件:', skinPart.id, '顶点:', skinPart.vertexCount, '索引:', skinPart.indexCount);

// 读取chunk 10（gzip压缩）
const chunk = atlas.chunks[skinPart.chunk];
console.log('读取chunk:', chunk.url, chunk.gzip);
const gzBuffer = readFileSync('./public/' + chunk.gzip);
const buffer = gunzipSync(gzBuffer);
console.log('解压后字节:', buffer.length);

// 提取皮肤几何体
const positions = new Float32Array(buffer.buffer, buffer.byteOffset + skinPart.positions, skinPart.vertexCount * 3);
const normals = new Int16Array(buffer.buffer, buffer.byteOffset + skinPart.normals, skinPart.vertexCount * 3);
const indices = new Uint32Array(buffer.buffer, buffer.byteOffset + skinPart.indices, skinPart.indexCount);

const geometry = new T.BufferGeometry();
geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
geometry.setAttribute('normal', new T.BufferAttribute(normals, 3, true));
geometry.setIndex(new T.BufferAttribute(indices, 1));
geometry.computeBoundingBox();
geometry.computeBoundingSphere();
console.log('几何体bounding box:', geometry.boundingBox.min.toArray(), geometry.boundingBox.max.toArray());

const skin = new T.Mesh(geometry, new T.MeshBasicMaterial());
skin.updateMatrixWorld(true);

// 基准点（从已有数据获取）
const navel = { x: -0.006010395916108746, y: 1.0392290787423628, z: 0.09837127455781508 }; // CV8 肚脐
// 估算：胸剑联合（CV16中庭附近），脐上8寸
const xiphoid = { x: -0.004, y: navel.y + 0.21, z: 0.115 }; // 约Y=1.249
// 估算：天突（胸骨柄上缘，CV22），胸剑联合上9寸
const tiantu = { x: -0.003, y: xiphoid.y + 0.17, z: 0.09 }; // 约Y=1.419

console.log('基准点:');
console.log('  CV8 肚脐 Y=', navel.y.toFixed(4));
console.log('  胸剑联合 Y=', xiphoid.y.toFixed(4));
console.log('  天突 Y=', tiantu.y.toFixed(4));

// 任脉穴位定义（CV9-CV22）
// 脐上寸数：从肚脐(CV8)往上
const cvPoints = [
  { code: 'CV9',  name: '水分',   upCun: 1,   region: 'abdomen' },
  { code: 'CV10', name: '下脘',   upCun: 2,   region: 'abdomen' },
  { code: 'CV11', name: '建里',   upCun: 3,   region: 'abdomen' },
  { code: 'CV12', name: '中脘',   upCun: 4,   region: 'abdomen' },
  { code: 'CV13', name: '上脘',   upCun: 5,   region: 'abdomen' },
  { code: 'CV14', name: '巨阙',   upCun: 6,   region: 'abdomen' },
  { code: 'CV15', name: '鸠尾',   upCun: 7,   region: 'abdomen' },
  // CV16中庭：胸剑联合下1.6寸（约脐上8-1.6=6.4寸？实际在剑胸结合下1.6寸）
  { code: 'CV16', name: '中庭',   upCun: 7.5, region: 'chest' },
  // CV17膻中：两乳头连线中点，平第4肋间（约胸剑联合上3.2寸？实际胸骨上）
  { code: 'CV17', name: '膻中',   upCun: 8.8, region: 'chest' },
  { code: 'CV18', name: '玉堂',   upCun: 9.6, region: 'chest' },
  { code: 'CV19', name: '紫宫',   upCun: 10.4, region: 'chest' },
  { code: 'CV20', name: '华盖',   upCun: 11.2, region: 'chest' },
  { code: 'CV21', name: '璇玑',   upCun: 11.8, region: 'chest' },
  { code: 'CV22', name: '天突',   upCun: 12.5, region: 'neck' },
];

// 计算目标Y坐标
// 脐到胸剑联合 = 8寸，对应Y差 = xiphoid.y - navel.y
// 胸剑联合到天突 = 4.5寸（胸骨部分，每寸更短），对应Y差 = tiantu.y - xiphoid.y
function targetY(upCun) {
  if (upCun <= 8) {
    // 腹部：脐上8寸到胸剑联合
    return navel.y + (upCun / 8) * (xiphoid.y - navel.y);
  } else {
    // 胸部：胸剑联合到天突约4.5寸
    const chestCun = upCun - 8;
    return xiphoid.y + (chestCun / 4.5) * (tiantu.y - xiphoid.y);
  }
}

// 射线投射
const raycaster = new T.Raycaster();
const direction = new T.Vector3(0, 0, -1); // 从前往后

function projectToSkin(x, y, expectedZ) {
  const origin = new T.Vector3(x, y, skinPart.bounds[1][2] + 0.25); // 从皮肤前方0.25米
  raycaster.set(origin, direction);
  raycaster.near = 0;
  raycaster.far = 1;
  
  const hits = raycaster.intersectObject(skin, false);
  if (!hits.length) return null;
  
  const hit = hits[0];
  if (!hit.face || hit.faceIndex == null) return null;
  
  // 检查深度差异
  if (Math.abs(hit.point.z - expectedZ) > 0.08) {
    console.log(`  警告: 命中深度异常 hit.z=${hit.point.z.toFixed(4)} expected.z=${expectedZ.toFixed(4)} diff=${Math.abs(hit.point.z - expectedZ).toFixed(4)}`);
  }
  
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

for (const pt of cvPoints) {
  const y = targetY(pt.upCun);
  const expectedZ = pt.region === 'abdomen' ? 0.10 : pt.region === 'chest' ? 0.11 : 0.09;
  
  // 前正中线X坐标：从肚脐X开始，往上略微变化
  const x = navel.x + (pt.upCun / 12.5) * (0.003 - navel.x); // 略微向中心靠拢
  
  console.log(`\n${pt.code} ${pt.name}: upCun=${pt.upCun}, targetY=${y.toFixed(4)}, x=${x.toFixed(4)}`);
  
  const surface = projectToSkin(x, y, expectedZ);
  if (surface) {
    results[pt.code] = surface;
    console.log(`  ✓ 命中: pos=(${surface.position.map(v=>v.toFixed(4)).join(', ')}) face=${surface.faceIndex}`);
  } else {
    console.log(`  ✗ 未命中皮肤`);
  }
}

// 输出
const output = {
  schema: 1,
  modelKey,
  standard: 'GB/T 12346—2021',
  anchors: {
    navel: {
      position: [navel.x, navel.y, navel.z],
      displayNormal: [0.4957717945158092, -0.27636365489384784, 0.8233064180584821],
      faceIndex: 21236,
      vertexIndices: [11177, 11176, 11147],
      barycentric: [0.7563416219248045, 0.22061018761475254, 0.02304819046044295],
      meshId: 'FJ2810'
    },
    xiphoid: { position: [xiphoid.x, xiphoid.y, xiphoid.z], note: '估算基准-胸剑联合' },
    tiantu: { position: [tiantu.x, tiantu.y, tiantu.z], note: '估算基准-天突' }
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
    region: 'CV9-CV22 任脉腹部胸部',
    method: 'anchor-Y-interpolation-then-front-skin-raycast',
    limitation: '基准点为估算值，正中线X坐标为近似，所有穴位需人工核验'
  },
  count: Object.keys(results).length
};

writeFileSync('./renmai-CV9-CV22-draft.json', JSON.stringify(output, null, 2));
console.log(`\n=== 完成：生成 ${Object.keys(results).length}/${cvPoints.length} 个穴位 → renmai-CV9-CV22-draft.json ===`);
