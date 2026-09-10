// 生成右侧对称穴位（镜像左侧X坐标）
import * as T from 'three';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
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
const skin = new T.Mesh(skinGeo, new T.MeshBasicMaterial());
skin.updateMatrixWorld(true);

const raycaster = new T.Raycaster();

function projectToSkin(x, y, z, dirX, dirY, dirZ) {
  const origin = new T.Vector3(x, y, z);
  const dir = new T.Vector3(dirX, dirY, dirZ).normalize();
  raycaster.set(origin, dir);
  const hits = raycaster.intersectObject(skin);
  if (hits.length > 0) {
    const hit = hits[0];
    const face = hit.face;
    return {
      position: [hit.point.x, hit.point.y, hit.point.z],
      displayNormal: [face.normal.x, face.normal.y, face.normal.z],
      faceIndex: hit.faceIndex,
      vertexIndices: [face.a, face.b, face.c],
      barycentric: [0.33, 0.33, 0.34],
      meshId: 'FJ2810'
    };
  }
  return null;
}

// 读取所有draft文件，收集左侧穴位
const drafts = [
  './bladder-back-draft.json',
  './chest-limb-draft.json',
  './lower-limb-draft.json',
  './head-face-draft.json',
];

let leftPoints = {};
for (const draftPath of drafts) {
  if (existsSync(draftPath)) {
    const draft = JSON.parse(readFileSync(draftPath, 'utf8'));
    Object.assign(leftPoints, draft.points);
  }
}

// 不需要镜像的经脉（正中线）
const midlineMeridians = ['CV', 'GV'];

const results = {};
let success = 0, fail = 0, skipped = 0;

for (const [code, point] of Object.entries(leftPoints)) {
  const mer = code.match(/^([A-Z]+)/)[1];
  
  // 跳过正中线经脉
  if (midlineMeridians.includes(mer)) {
    skipped++;
    continue;
  }
  
  // 镜像X坐标
  const leftX = point.position[0];
  const rightX = -leftX;
  const y = point.position[1];
  const z = point.position[2];
  
  // 判断射线方向：如果Z>0（前面），从前面投射；如果Z<0（后面），从后面投射
  const dirZ = z > 0 ? -1 : 1;
  
  // 重新射线投射获取右侧表面点
  const hit = projectToSkin(rightX, y, z + dirZ * 0.1, 0, 0, dirZ);
  
  if (hit) {
    results[code + '-R'] = {
      name: point.name + '(右)',
      ...hit,
      status: 'pending-review',
      note: '右侧对称穴位，镜像自' + code
    };
    success++;
  } else {
    console.log(`失败: ${code}-R ${point.name}`);
    fail++;
  }
}

console.log(`\n右侧对称穴位: 成功${success}，失败${fail}，跳过正中线${skipped}`);

writeFileSync('./right-side-draft.json', JSON.stringify({
  schema: 1,
  standard: 'GB/T 12346—2021',
  points: results
}, null, 2));

console.log('已导出到 right-side-draft.json');
