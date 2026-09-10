// 批量标注腰臀部和下肢穴位
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

// 从后背向前投射
function projectFromBack(x, y, z) {
  return projectToSkin(x, y, -0.2, 0, 0, 1);
}

// 从前面向后投射
function projectFromFront(x, y, z) {
  return projectToSkin(x, y, 0.2, 0, 0, -1);
}

// 从左侧向右投射
function projectFromLeft(x, y, z) {
  return projectToSkin(0.3, y, z, -1, 0, 0);
}

const results = {};
const failed = [];

function addPoint(code, fn) {
  const r = fn();
  if (r) {
    results[code] = r;
  } else {
    failed.push(code);
  }
}

// ========== 膀胱经腰骶部（从后背投射）==========
// L1:1.093, L2:1.070, L3:1.046, L4:1.017, L5:0.983, 骶骨:0.861
// 旁开1.5寸≈0.039m，旁开3寸≈0.078m

addPoint('BL24', () => projectFromBack(0.039, 1.046, 0)); // 气海俞 L3
addPoint('BL25', () => projectFromBack(0.039, 1.017, 0)); // 大肠俞 L4
addPoint('BL26', () => projectFromBack(0.039, 0.983, 0)); // 关元俞 L5
addPoint('BL27', () => projectFromBack(0.039, 0.950, 0)); // 小肠俞 骶1
addPoint('BL28', () => projectFromBack(0.039, 0.930, 0)); // 膀胱俞 骶2
addPoint('BL29', () => projectFromBack(0.039, 0.910, 0)); // 中膂俞 骶3
addPoint('BL30', () => projectFromBack(0.039, 0.890, 0)); // 白环俞 骶4
addPoint('BL31', () => projectFromBack(0.025, 0.955, 0)); // 上髎 骶1后孔
addPoint('BL32', () => projectFromBack(0.025, 0.935, 0)); // 次髎 骶2后孔
addPoint('BL33', () => projectFromBack(0.025, 0.915, 0)); // 中髎 骶3后孔
addPoint('BL34', () => projectFromBack(0.025, 0.895, 0)); // 下髎 骶4后孔
addPoint('BL35', () => projectFromBack(0.015, 0.865, 0)); // 会阳 尾骨旁

// 膀胱经背部外侧（旁开3寸）
addPoint('BL53', () => projectFromBack(0.078, 0.930, 0)); // 胞肓 骶2旁3寸
addPoint('BL54', () => projectFromBack(0.078, 1.070, 0)); // 志室 L2旁3寸

// BL59 附阳：外踝后，昆仑直上3寸
addPoint('BL59', () => projectFromLeft(0, 0.140, -0.040));

// ========== 胆经侧胸腹部（从左侧投射）==========
addPoint('GB22', () => projectFromLeft(0, 1.320, 0.020)); // 渊腋 腋下3寸
addPoint('GB23', () => projectFromLeft(0, 1.320, 0.045)); // 辄筋 渊腋前1寸
addPoint('GB24', () => projectFromFront(0.090, 1.240, 0)); // 日月 乳头直下第7肋
addPoint('GB25', () => projectFromLeft(0, 1.120, 0.030)); // 京门 第12肋游离端
addPoint('GB26', () => projectFromLeft(0, 1.050, 0.050)); // 带脉 第11肋直下平脐
addPoint('GB27', () => projectFromLeft(0, 0.970, 0.060)); // 五枢 髂前上棘前
addPoint('GB28', () => projectFromLeft(0, 0.940, 0.055)); // 维道 髂前上棘前下
addPoint('GB29', () => projectFromLeft(0, 0.900, 0.020)); // 居髎 髂前上棘与大转子中点

// ========== 胃经下肢（从前面投射）==========
addPoint('ST33', () => projectFromFront(0.090, 0.540, 0)); // 阴市 髌底上3寸
addPoint('ST34', () => projectFromFront(0.090, 0.515, 0)); // 梁丘 髌底上2寸
addPoint('ST39', () => projectFromFront(0.080, 0.280, 0)); // 下巨虚 犊鼻下9寸
addPoint('ST40', () => projectFromFront(0.100, 0.260, 0)); // 丰隆 外踝上8寸

// ========== 胆经下肢（从左侧投射）==========
addPoint('GB35', () => projectFromLeft(0, 0.280, -0.030)); // 阳交 外踝上7寸
addPoint('GB36', () => projectFromLeft(0, 0.280, -0.015)); // 外丘 外踝上7寸腓骨前
addPoint('GB37', () => projectFromLeft(0, 0.220, -0.015)); // 光明 外踝上5寸
addPoint('GB38', () => projectFromLeft(0, 0.190, -0.015)); // 阳辅 外踝上4寸
addPoint('GB39', () => projectFromLeft(0, 0.160, -0.015)); // 悬钟 外踝上3寸

// ========== 肾经下肢（从内侧投射）==========
addPoint('KI6', () => projectToSkin(0.050, 0.070, 0.020, 1, 0, 0)); // 照海 内踝下1寸
addPoint('KI7', () => projectToSkin(0.050, 0.120, 0.000, 1, 0, 0)); // 复溜 内踝上2寸

// ========== 其他 ==========
addPoint('SP21', () => projectFromLeft(0, 1.300, 0.010)); // 大包 腋中线第6肋
addPoint('CV1', () => projectToSkin(0, 0.850, 0.020, 0, -1, 0)); // 会阴

// 导出结果
const output = {
  schema: 1,
  modelKey: 'BodyParts3D_4-0_man',
  standard: 'GB/T 12346—2021',
  anchors: {},
  points: results
};

writeFileSync('./hip-leg-draft.json', JSON.stringify(output, null, 2));
console.log('腰臀部和下肢穴位标注完成：成功' + Object.keys(results).length + '个，失败' + failed.length + '个');
if (failed.length > 0) console.log('失败: ' + failed.join(', '));
console.log('已导出到 hip-leg-draft.json');
