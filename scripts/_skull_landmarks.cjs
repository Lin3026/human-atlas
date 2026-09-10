// 获取颅骨标志点坐标
const a = require('../public/models/atlas.json');

function getCenter(part) {
  const b = part.bounds;
  return {
    x: (b[0][0] + b[1][0]) / 2,
    y: (b[0][1] + b[1][1]) / 2,
    z: (b[0][2] + b[1][2]) / 2,
    min: { x: b[0][0], y: b[0][1], z: b[0][2] },
    max: { x: b[1][0], y: b[1][1], z: b[1][2] }
  };
}

const skeletal = a.parts.filter(p => p.system === 'skeletal');

// 颅骨相关部件
const skullParts = [
  { name: '额骨', pattern: /^frontal bone$/i },
  { name: '顶骨(左)', pattern: /^left parietal bone$/i },
  { name: '顶骨(右)', pattern: /^right parietal bone$/i },
  { name: '枕骨', pattern: /^occipital bone$/i },
  { name: '颞骨(左)', pattern: /^left temporal bone$/i },
  { name: '颞骨(右)', pattern: /^right temporal bone$/i },
  { name: '蝶骨', pattern: /^sphenoid bone$/i },
  { name: '筛骨', pattern: /^ethmoid bone$/i },
  { name: '上颌骨(左)', pattern: /^left maxilla$/i },
  { name: '下颌骨', pattern: /^mandible$/i },
  { name: '鼻骨(左)', pattern: /^left nasal bone$/i },
  { name: '颧骨(左)', pattern: /^left zygomatic bone$/i },
  { name: '泪骨(左)', pattern: /^left lacrimal bone$/i },
  { name: '腭骨(左)', pattern: /^left palatine bone$/i },
  { name: '犁骨', pattern: /^vomer$/i },
  { name: '舌骨', pattern: /^hyoid bone$/i },
];

console.log('=== 颅骨标志点坐标 ===');
for (const sp of skullParts) {
  const part = skeletal.find(p => sp.pattern.test(p.name));
  if (part) {
    const c = getCenter(part);
    console.log(sp.name + ': center=[' + 
      c.x.toFixed(3) + ',' + c.y.toFixed(3) + ',' + c.z.toFixed(3) + '] ' +
      'Y[' + c.min.y.toFixed(3) + ',' + c.max.y.toFixed(3) + '] ' +
      'Z[' + c.min.z.toFixed(3) + ',' + c.max.z.toFixed(3) + ']');
  } else {
    console.log(sp.name + ': 未找到');
  }
}

// 找最高点（百会位置参考）
let maxY = 0, maxYPart = null;
for (const p of skeletal) {
  if (p.bounds[1][1] > maxY) {
    maxY = p.bounds[1][1];
    maxYPart = p;
  }
}
console.log('\n骨骼最高点: Y=' + maxY.toFixed(3) + ' (' + maxYPart.name + ')');

// 找最前点（印堂/素髎位置参考）
let maxZ = -999, maxZPart = null;
for (const p of skeletal) {
  if (p.bounds[1][2] > maxZ) {
    maxZ = p.bounds[1][2];
    maxZPart = p;
  }
}
console.log('骨骼最前点: Z=' + maxZ.toFixed(3) + ' (' + maxZPart.name + ')');
