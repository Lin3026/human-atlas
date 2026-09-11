// 修复BL8-BL10（头部后面的穴位）
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
const skin = new T.Mesh(skinGeo, new T.MeshBasicMaterial());
skin.updateMatrixWorld(true);

const raycaster = new T.Raycaster();

function projectToSkin(originX, originY, originZ, dirX, dirY, dirZ) {
  const origin = new T.Vector3(originX, originY, originZ);
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
      meshId: 'FJ2810',
      method: 'regional-projection',
      status: 'pending-review'
    };
  }
  return null;
}

// 读取已有的bladder-face-fixed.json
const existing = JSON.parse(readFileSync('./bladder-face-fixed.json', 'utf8'));

// BL8 络却：通天后1.5寸，头部后面
const bl8 = projectToSkin(0.055, 1.610, -0.15, 0, 0, 1);
if (bl8) {
  existing.points['BL8'] = bl8;
  console.log('BL8: X=' + bl8.position[0].toFixed(4) + ' Y=' + bl8.position[1].toFixed(4) + ' Z=' + bl8.position[2].toFixed(4));
}

// BL9 玉枕：后发际正中直上2.5寸，旁开1.3寸
const bl9 = projectToSkin(0.045, 1.580, -0.15, 0, 0, 1);
if (bl9) {
  existing.points['BL9'] = bl9;
  console.log('BL9: X=' + bl9.position[0].toFixed(4) + ' Y=' + bl9.position[1].toFixed(4) + ' Z=' + bl9.position[2].toFixed(4));
}

// BL10 天柱：后发际正中直上0.5寸，旁开1.3寸
const bl10 = projectToSkin(0.040, 1.520, -0.15, 0, 0, 1);
if (bl10) {
  existing.points['BL10'] = bl10;
  console.log('BL10: X=' + bl10.position[0].toFixed(4) + ' Y=' + bl10.position[1].toFixed(4) + ' Z=' + bl10.position[2].toFixed(4));
}

writeFileSync('./bladder-face-fixed.json', JSON.stringify(existing, null, 2));
console.log('\n已更新 bladder-face-fixed.json，当前穴位数: ' + Object.keys(existing.points).length);
