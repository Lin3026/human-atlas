// 批量标注手部穴位
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
      meshId: 'FJ2810',
      method: 'regional-projection',
      status: 'pending-review'
    };
  }
  return null;
}

// 从外部向中心投射
function projectFromOutside(x, y, z) {
  return projectToSkin(x * 1.5, y, z * 1.5, -x, 0, -z);
}

const results = {};
const failed = [];

function addPoint(code, x, y, z) {
  const r = projectFromOutside(x, y, z);
  if (r) {
    results[code] = r;
  } else {
    failed.push(code);
  }
}

// ========== 手部穴位（左侧）==========
// 手部Y坐标范围约0.80-0.90，X约0.20-0.35，Z约-0.05到0.10

// LI1 商阳：食指末节桡侧，指甲根角旁0.1寸
addPoint('LI1', 0.320, 0.810, 0.020);
// LI2 二间：食指本节前桡侧凹陷处
addPoint('LI2', 0.310, 0.825, 0.025);
// LI3 三间：食指本节后桡侧凹陷处
addPoint('LI3', 0.300, 0.840, 0.030);
// LI4 合谷：手背第1、2掌骨间，第2掌骨桡侧中点处
addPoint('LI4', 0.280, 0.855, 0.020);
// LI5 阳溪：腕背横纹桡侧，拇短伸肌腱与拇长伸肌腱之间凹陷处
addPoint('LI5', 0.260, 0.875, 0.015);
// LI6 偏历：腕背横纹上3寸，阳溪与曲池连线上
addPoint('LI6', 0.240, 0.920, 0.010);

// TE1 关冲：无名指末节尺侧，指甲根角旁0.1寸
addPoint('TE1', 0.300, 0.805, -0.010);
// TE2 液门：手背第4、5指间，指蹼缘后方赤白肉际处
addPoint('TE2', 0.290, 0.820, -0.005);
// TE3 中渚：手背第4、5掌骨间凹陷处
addPoint('TE3', 0.275, 0.840, -0.005);
// TE4 阳池：腕背横纹中，指总伸肌腱尺侧缘凹陷处
addPoint('TE4', 0.255, 0.870, -0.010);
// TE5 外关：腕背横纹上2寸，尺骨与桡骨之间
addPoint('TE5', 0.240, 0.900, -0.015);
// TE6 支沟：腕背横纹上3寸，尺骨与桡骨之间
addPoint('TE6', 0.235, 0.920, -0.015);
// TE7 会宗：腕背横纹上3寸，支沟尺侧，尺骨桡侧缘
addPoint('TE7', 0.225, 0.920, -0.025);
// TE8 三阳络：腕背横纹上4寸，尺骨与桡骨之间
addPoint('TE8', 0.230, 0.940, -0.015);
// TE9 四渎：肘尖下5寸，尺骨与桡骨之间
addPoint('TE9', 0.220, 0.990, -0.015);

// LU5 尺泽：肘横纹中，肱二头肌腱桡侧凹陷处
addPoint('LU5', 0.200, 1.080, 0.060);
// LU6 孔最：腕掌侧远端横纹上7寸，尺泽与太渊连线上
addPoint('LU6', 0.210, 0.980, 0.050);

// SI7 支正：腕背横纹上5寸，尺骨尺侧与尺侧腕屈肌之间
addPoint('SI7', 0.220, 0.950, -0.030);
// SI8 小海：尺骨鹰嘴与肱骨内上髁之间凹陷处
addPoint('SI8', 0.195, 1.075, -0.040);

// 导出结果
const output = {
  schema: 1,
  modelKey: 'BodyParts3D_4-0_man',
  standard: 'GB/T 12346—2021',
  anchors: {},
  points: results
};

writeFileSync('./hand-draft.json', JSON.stringify(output, null, 2));
console.log('手部穴位标注完成：成功' + Object.keys(results).length + '个，失败' + failed.length + '个');
if (failed.length > 0) console.log('失败: ' + failed.join(', '));
console.log('已导出到 hand-draft.json');
