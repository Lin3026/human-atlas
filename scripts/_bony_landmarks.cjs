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

// 关键骨性标志
const landmarks = [
  // 脊柱
  { name: '第7颈椎(C7)', pattern: /seventh cervical vertebra/i },
  { name: '第1胸椎(T1)', pattern: /^first thoracic vertebra$/i },
  { name: '第2胸椎(T2)', pattern: /^second thoracic vertebra$/i },
  { name: '第3胸椎(T3)', pattern: /^third thoracic vertebra$/i },
  { name: '第4胸椎(T4)', pattern: /^fourth thoracic vertebra$/i },
  { name: '第5胸椎(T5)', pattern: /^fifth thoracic vertebra$/i },
  { name: '第6胸椎(T6)', pattern: /^sixth thoracic vertebra$/i },
  { name: '第7胸椎(T7)', pattern: /^seventh thoracic vertebra$/i },
  { name: '第8胸椎(T8)', pattern: /^eighth thoracic vertebra$/i },
  { name: '第9胸椎(T9)', pattern: /^ninth thoracic vertebra$/i },
  { name: '第10胸椎(T10)', pattern: /^tenth thoracic vertebra$/i },
  { name: '第11胸椎(T11)', pattern: /^eleventh thoracic vertebra$/i },
  { name: '第12胸椎(T12)', pattern: /^twelfth thoracic vertebra$/i },
  { name: '第1腰椎(L1)', pattern: /^first lumbar vertebra$/i },
  { name: '第2腰椎(L2)', pattern: /^second lumbar vertebra$/i },
  { name: '第3腰椎(L3)', pattern: /^third lumbar vertebra$/i },
  { name: '第4腰椎(L4)', pattern: /^fourth lumbar vertebra$/i },
  { name: '第5腰椎(L5)', pattern: /^fifth lumbar vertebra$/i },
  { name: '骶骨', pattern: /^sacrum$/i },
  // 胸廓
  { name: '胸骨柄', pattern: /^manubrium$/i },
  { name: '胸骨体', pattern: /^body of sternum$/i },
  { name: '剑突', pattern: /^xiphoid process$/i },
  // 上肢
  { name: '锁骨(左)', pattern: /^left clavicle$/i },
  { name: '肩胛骨(左)', pattern: /^left scapula$/i },
  { name: '肱骨(左)', pattern: /^left humerus$/i },
  { name: '桡骨(左)', pattern: /^left radius$/i },
  { name: '尺骨(左)', pattern: /^left ulna$/i },
  // 下肢
  { name: '髋骨(左)', pattern: /^left hip bone$/i },
  { name: '股骨(左)', pattern: /^left femur$/i },
  { name: '髌骨(左)', pattern: /^left patella$/i },
  { name: '胫骨(左)', pattern: /^left tibia$/i },
  { name: '腓骨(左)', pattern: /^left fibula$/i },
  // 肋骨
  { name: '第1肋(左)', pattern: /^left first rib$/i },
  { name: '第2肋(左)', pattern: /^left second rib$/i },
  { name: '第3肋(左)', pattern: /^left third rib$/i },
  { name: '第4肋(左)', pattern: /^left fourth rib$/i },
  { name: '第5肋(左)', pattern: /^left fifth rib$/i },
  { name: '第6肋(左)', pattern: /^left sixth rib$/i },
  { name: '第7肋(左)', pattern: /^left seventh rib$/i },
  { name: '第8肋(左)', pattern: /^left eighth rib$/i },
  { name: '第9肋(左)', pattern: /^left ninth rib$/i },
  { name: '第10肋(左)', pattern: /^left tenth rib$/i },
  { name: '第11肋(左)', pattern: /^left eleventh rib$/i },
  { name: '第12肋(左)', pattern: /^left twelfth rib$/i },
];

console.log('=== 关键骨性标志坐标 ===');
console.log('名称 | center(X,Y,Z) | minY | maxY | minZ | maxZ');
console.log('---|---|---|---|---|---');

for (const lm of landmarks) {
  const part = skeletal.find(p => lm.pattern.test(p.name));
  if (part) {
    const c = getCenter(part);
    console.log(lm.name + ' | [' + 
      c.x.toFixed(3) + ',' + c.y.toFixed(3) + ',' + c.z.toFixed(3) + '] | ' +
      c.min.y.toFixed(3) + ' | ' + c.max.y.toFixed(3) + ' | ' +
      c.min.z.toFixed(3) + ' | ' + c.max.z.toFixed(3));
  } else {
    console.log(lm.name + ' | 未找到');
  }
}

// 计算1寸的长度（从已知穴位距离推算）
console.log('\n=== 骨度分寸参考 ===');
const c7 = skeletal.find(p => /seventh cervical vertebra/i.test(p.name));
const t1 = skeletal.find(p => /^first thoracic vertebra$/i.test(p.name));
const t12 = skeletal.find(p => /^twelfth thoracic vertebra$/i.test(p.name));
const l5 = skeletal.find(p => /^fifth lumbar vertebra$/i.test(p.name));
const sacrum = skeletal.find(p => /^sacrum$/i.test(p.name));

if (c7 && t1) {
  const dist = Math.abs(getCenter(c7).y - getCenter(t1).y);
  console.log('C7-T1距离: ' + (dist * 1000).toFixed(1) + 'mm (1椎骨)');
}
if (t1 && t12) {
  const dist = Math.abs(getCenter(t1).y - getCenter(t12).y);
  console.log('T1-T12距离: ' + (dist * 1000).toFixed(1) + 'mm (11椎骨, 背部督脉长度)');
}
if (t12 && l5) {
  const dist = Math.abs(getCenter(t12).y - getCenter(l5).y);
  console.log('T12-L5距离: ' + (dist * 1000).toFixed(1) + 'mm (5椎骨)');
}

// 上肢骨度分寸
const humerus = skeletal.find(p => /^left humerus$/i.test(p.name));
const radius = skeletal.find(p => /^left radius$/i.test(p.name));
if (humerus) {
  const c = getCenter(humerus);
  console.log('肱骨长度: ' + ((c.max.y - c.min.y) * 1000).toFixed(1) + 'mm (上臂12寸)');
  console.log('  1寸≈' + (((c.max.y - c.min.y) / 12) * 1000).toFixed(1) + 'mm');
}
if (radius) {
  const c = getCenter(radius);
  console.log('桡骨长度: ' + ((c.max.y - c.min.y) * 1000).toFixed(1) + 'mm (前臂12寸)');
  console.log('  1寸≈' + (((c.max.y - c.min.y) / 12) * 1000).toFixed(1) + 'mm');
}

// 下肢骨度分寸
const femur = skeletal.find(p => /^left femur$/i.test(p.name));
const tibia = skeletal.find(p => /^left tibia$/i.test(p.name));
if (femur) {
  const c = getCenter(femur);
  console.log('股骨长度: ' + ((c.max.y - c.min.y) * 1000).toFixed(1) + 'mm (大腿19寸)');
  console.log('  1寸≈' + (((c.max.y - c.min.y) / 19) * 1000).toFixed(1) + 'mm');
}
if (tibia) {
  const c = getCenter(tibia);
  console.log('胫骨长度: ' + ((c.max.y - c.min.y) * 1000).toFixed(1) + 'mm (小腿13寸)');
  console.log('  1寸≈' + (((c.max.y - c.min.y) / 13) * 1000).toFixed(1) + 'mm');
}
