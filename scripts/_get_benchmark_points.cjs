// 获取已标注的基准点坐标，用于骨度分寸法
const fs = require('fs');

// 读取acupoint-seed.ts
let seedContent = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');
const jsonStart = seedContent.indexOf('{');
const jsonStr = seedContent.substring(jsonStart).trim().replace(/;$/, '');
const seedData = JSON.parse(jsonStr);

console.log('=== 已标注的基准点 ===\n');

// 关键基准点
const keyPoints = [
  'CV8',   // 神阙（脐中）
  'CV15',  // 鸠尾（剑突下，胸剑联合）
  'CV2',   // 曲骨（耻骨联合上缘）
  'CV17',  // 膻中（两乳头连线中点）
  'CV22',  // 天突（胸骨上窝）
  'LU9',   // 太渊（腕横纹）
  'PC3',   // 曲泽（肘横纹）
  'BL40',  // 委中（腘横纹）
  'GB34',  // 阳陵泉（腓骨小头前下方）
  'ST36',  // 足三里（犊鼻下3寸）
  'GV14',  // 大椎（第7颈椎棘突下）
  'GV4',   // 命门（第2腰椎棘突下）
];

for (const code of keyPoints) {
  const point = seedData.points[code];
  if (point) {
    console.log(code + ': X=' + point.position[0].toFixed(4) + 
      ' Y=' + point.position[1].toFixed(4) + 
      ' Z=' + point.position[2].toFixed(4) +
      ' (' + (point.position[1]*100).toFixed(1) + 'cm高)');
  } else {
    console.log(code + ': 未标注');
  }
}

// 计算骨度分寸
console.log('\n=== 骨度分寸计算 ===\n');

const cv8 = seedData.points['CV8'];   // 神阙
const cv15 = seedData.points['CV15']; // 鸠尾（剑突下）
const cv2 = seedData.points['CV2'];   // 曲骨（耻骨联合上缘）
const cv17 = seedData.points['CV17']; // 膻中
const cv22 = seedData.points['CV22']; // 天突

if (cv8 && cv15) {
  const dist = Math.abs(cv15.position[1] - cv8.position[1]);
  console.log('剑突下(CV15) → 脐中(CV8): ' + (dist*100).toFixed(1) + ' cm = 8寸');
  console.log('  1寸 = ' + (dist/8*100).toFixed(2) + ' cm = ' + (dist/8).toFixed(4) + ' m');
}

if (cv8 && cv2) {
  const dist = Math.abs(cv8.position[1] - cv2.position[1]);
  console.log('脐中(CV8) → 耻骨联合上缘(CV2): ' + (dist*100).toFixed(1) + ' cm = 5寸');
  console.log('  1寸 = ' + (dist/5*100).toFixed(2) + ' cm = ' + (dist/5).toFixed(4) + ' m');
}

if (cv22 && cv15) {
  const dist = Math.abs(cv22.position[1] - cv15.position[1]);
  console.log('胸骨上窝(CV22) → 剑突下(CV15): ' + (dist*100).toFixed(1) + ' cm = 9寸');
  console.log('  1寸 = ' + (dist/9*100).toFixed(2) + ' cm = ' + (dist/9).toFixed(4) + ' m');
}

// 输出基准点供后续使用
const result = {
  CV8: cv8 ? cv8.position : null,
  CV15: cv15 ? cv15.position : null,
  CV2: cv2 ? cv2.position : null,
  CV17: cv17 ? cv17.position : null,
  CV22: cv22 ? cv22.position : null
};

fs.writeFileSync('./benchmark-points.json', JSON.stringify(result, null, 2));
console.log('\n已导出基准点到 benchmark-points.json');
