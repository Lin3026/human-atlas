// 头面部穴位3D精确定位脚本
// 分析头面部解剖结构，找到关键标志点，然后精确定位穴位

import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';
import path from 'path';

const MODEL_PATH = 'D:/3drenti/human-atlas-main/public/models/bodyparts3d-male.glb';
const OUTPUT_PATH = 'D:/3drenti/human-atlas-main/face-acupoints-precise.json';

// 加载模型
const loader = new GLTFLoader();
loader.load(MODEL_PATH, (gltf) => {
  console.log('模型加载成功');
  
  // 找到皮肤网格
  let skinMesh = null;
  gltf.scene.traverse((child) => {
    if (child.isMesh && child.geometry) {
      // 皮肤部件ID是FJ2810，这里通过顶点数量判断
      if (child.geometry.attributes.position.count > 10000) {
        skinMesh = child;
        console.log('找到皮肤网格，顶点数:', child.geometry.attributes.position.count);
      }
    }
  });
  
  if (!skinMesh) {
    console.error('未找到皮肤网格');
    process.exit(1);
  }
  
  // 获取顶点数据
  const positions = skinMesh.geometry.attributes.position.array;
  const vertexCount = positions.length / 3;
  
  console.log('总顶点数:', vertexCount);
  
  // 分析头面部区域：Y > 1.3（头部），Z > 0（前面）
  const faceVertices = [];
  for (let i = 0; i < vertexCount; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    
    // 头面部区域
    if (y > 1.35 && y < 1.75 && Math.abs(x) < 0.2 && z > -0.05) {
      faceVertices.push({x, y, z, index: i});
    }
  }
  
  console.log('头面部顶点数:', faceVertices.length);
  
  // 找到关键标志点
  
  // 1. 找到头顶最高点（百会附近）
  const topVertex = faceVertices.reduce((max, v) => v.y > max.y ? v : max, faceVertices[0]);
  console.log('头顶最高点:', topVertex.x.toFixed(4), topVertex.y.toFixed(4), topVertex.z.toFixed(4));
  
  // 2. 找到前额最前点（神庭附近）
  const foreheadVertex = faceVertices.reduce((max, v) => (v.y > 1.5 && v.z > max.z) ? v : max, {z: -Infinity});
  console.log('前额最前点:', foreheadVertex.x.toFixed(4), foreheadVertex.y.toFixed(4), foreheadVertex.z.toFixed(4));
  
  // 3. 找到鼻尖（Y约1.55，Z最大）
  const noseVertices = faceVertices.filter(v => v.y > 1.48 && v.y < 1.6 && Math.abs(v.x) < 0.05);
  const noseTip = noseVertices.reduce((max, v) => v.z > max.z ? v : max, {z: -Infinity});
  console.log('鼻尖:', noseTip.x.toFixed(4), noseTip.y.toFixed(4), noseTip.z.toFixed(4));
  
  // 4. 找到左右内眼角（睛明穴位置）
  // 内眼角在鼻梁两侧，Y约1.55，X约±0.03
  const leftEyeInner = faceVertices.filter(v => 
    v.y > 1.52 && v.y < 1.58 && 
    v.x > 0.01 && v.x < 0.06 && 
    v.z > 0.05 && v.z < 0.12
  ).reduce((min, v) => Math.abs(v.x - 0.03) < Math.abs(min.x - 0.03) ? v : min, {x: Infinity});
  
  const rightEyeInner = faceVertices.filter(v => 
    v.y > 1.52 && v.y < 1.58 && 
    v.x < -0.01 && v.x > -0.06 && 
    v.z > 0.05 && v.z < 0.12
  ).reduce((min, v) => Math.abs(v.x + 0.03) < Math.abs(min.x + 0.03) ? v : min, {x: -Infinity});
  
  console.log('左内眼角:', leftEyeInner.x.toFixed(4), leftEyeInner.y.toFixed(4), leftEyeInner.z.toFixed(4));
  console.log('右内眼角:', rightEyeInner.x.toFixed(4), rightEyeInner.y.toFixed(4), rightEyeInner.z.toFixed(4));
  
  // 5. 找到左右外眼角（瞳子髎位置）
  const leftEyeOuter = faceVertices.filter(v => 
    v.y > 1.52 && v.y < 1.58 && 
    v.x > 0.08 && v.x < 0.15 && 
    v.z > 0.02 && v.z < 0.1
  ).reduce((max, v) => v.x > max.x ? v : max, {x: -Infinity});
  
  const rightEyeOuter = faceVertices.filter(v => 
    v.y > 1.52 && v.y < 1.58 && 
    v.x < -0.08 && v.x > -0.15 && 
    v.z > 0.02 && v.z < 0.1
  ).reduce((min, v) => v.x < min.x ? v : min, {x: Infinity});
  
  console.log('左外眼角:', leftEyeOuter.x.toFixed(4), leftEyeOuter.y.toFixed(4), leftEyeOuter.z.toFixed(4));
  console.log('右外眼角:', rightEyeOuter.x.toFixed(4), rightEyeOuter.y.toFixed(4), rightEyeOuter.z.toFixed(4));
  
  // 6. 找到眉头（攒竹位置）- 眉毛内侧端，在内眼角上方约0.02m
  const leftBrowInner = faceVertices.filter(v => 
    v.y > 1.57 && v.y < 1.62 && 
    v.x > 0.01 && v.x < 0.07 && 
    v.z > 0.06 && v.z < 0.13
  ).reduce((min, v) => Math.abs(v.y - 1.59) < Math.abs(min.y - 1.59) ? v : min, {y: Infinity});
  
  const rightBrowInner = faceVertices.filter(v => 
    v.y > 1.57 && v.y < 1.62 && 
    v.x < -0.01 && v.x > -0.07 && 
    v.z > 0.06 && v.z < 0.13
  ).reduce((min, v) => Math.abs(v.y - 1.59) < Math.abs(min.y - 1.59) ? v : min, {y: Infinity});
  
  console.log('左眉头:', leftBrowInner.x.toFixed(4), leftBrowInner.y.toFixed(4), leftBrowInner.z.toFixed(4));
  console.log('右眉头:', rightBrowInner.x.toFixed(4), rightBrowInner.y.toFixed(4), rightBrowInner.z.toFixed(4));
  
  // 7. 找到眉梢（丝竹空位置）- 眉毛外侧端
  const leftBrowOuter = faceVertices.filter(v => 
    v.y > 1.57 && v.y < 1.62 && 
    v.x > 0.1 && v.x < 0.17 && 
    v.z > 0.03 && v.z < 0.1
  ).reduce((max, v) => v.x > max.x ? v : max, {x: -Infinity});
  
  const rightBrowOuter = faceVertices.filter(v => 
    v.y > 1.57 && v.y < 1.62 && 
    v.x < -0.1 && v.x > -0.17 && 
    v.z > 0.03 && v.z < 0.1
  ).reduce((min, v) => v.x < min.x ? v : min, {x: Infinity});
  
  console.log('左眉梢:', leftBrowOuter.x.toFixed(4), leftBrowOuter.y.toFixed(4), leftBrowOuter.z.toFixed(4));
  console.log('右眉梢:', rightBrowOuter.x.toFixed(4), rightBrowOuter.y.toFixed(4), rightBrowOuter.z.toFixed(4));
  
  // 8. 找到嘴角（地仓位置）
  const mouthVertices = faceVertices.filter(v => v.y > 1.4 && v.y < 1.48 && Math.abs(x) < 0.1 && z > 0.05);
  const leftMouth = mouthVertices.filter(v => v.x > 0).reduce((max, v) => v.x > max.x ? v : max, {x: -Infinity});
  const rightMouth = mouthVertices.filter(v => v.x < 0).reduce((min, v) => v.x < min.x ? v : min, {x: Infinity});
  
  console.log('左嘴角:', leftMouth.x.toFixed(4), leftMouth.y.toFixed(4), leftMouth.z.toFixed(4));
  console.log('右嘴角:', rightMouth.x.toFixed(4), rightMouth.y.toFixed(4), rightMouth.z.toFixed(4));
  
  // 9. 找到鼻翼旁（迎香位置）
  const noseSideVertices = faceVertices.filter(v => v.y > 1.48 && v.y < 1.55 && Math.abs(v.x) > 0.02 && Math.abs(v.x) < 0.08 && v.z > 0.08);
  const leftNoseSide = noseSideVertices.filter(v => v.x > 0).reduce((max, v) => v.x > max.x ? v : max, {x: -Infinity});
  const rightNoseSide = noseSideVertices.filter(v => v.x < 0).reduce((min, v) => v.x < min.x ? v : min, {x: Infinity});
  
  console.log('左鼻翼旁:', leftNoseSide.x.toFixed(4), leftNoseSide.y.toFixed(4), leftNoseSide.z.toFixed(4));
  console.log('右鼻翼旁:', rightNoseSide.x.toFixed(4), rightNoseSide.y.toFixed(4), rightNoseSide.z.toFixed(4));
  
  // 精确定位头面部穴位
  const acupoints = [
    // 膀胱经
    {code: 'BL1', name: '睛明', side: 'left', position: leftEyeInner, description: '目内眦内上方眶内侧壁凹陷中'},
    {code: 'BL1', name: '睛明', side: 'right', position: rightEyeInner, description: '目内眦内上方眶内侧壁凹陷中'},
    {code: 'BL2', name: '攒竹', side: 'left', position: leftBrowInner, description: '眉头凹陷中，额切迹处'},
    {code: 'BL2', name: '攒竹', side: 'right', position: rightBrowInner, description: '眉头凹陷中，额切迹处'},
    
    // 胆经
    {code: 'GB1', name: '瞳子髎', side: 'left', position: leftEyeOuter, description: '目外眦旁，眶外侧缘处'},
    {code: 'GB1', name: '瞳子髎', side: 'right', position: rightEyeOuter, description: '目外眦旁，眶外侧缘处'},
    {code: 'TE23', name: '丝竹空', side: 'left', position: leftBrowOuter, description: '眉梢凹陷处'},
    {code: 'TE23', name: '丝竹空', side: 'right', position: rightBrowOuter, description: '眉梢凹陷处'},
    
    // 胃经
    {code: 'ST4', name: '地仓', side: 'left', position: leftMouth, description: '口角外侧，上直对瞳孔'},
    {code: 'ST4', name: '地仓', side: 'right', position: rightMouth, description: '口角外侧，上直对瞳孔'},
    
    // 大肠经
    {code: 'LI20', name: '迎香', side: 'left', position: leftNoseSide, description: '鼻翼外缘中点旁，鼻唇沟中'},
    {code: 'LI20', name: '迎香', side: 'right', position: rightNoseSide, description: '鼻翼外缘中点旁，鼻唇沟中'},
  ];
  
  // 输出结果
  const result = {
    landmarks: {
      topVertex,
      foreheadVertex,
      noseTip,
      leftEyeInner,
      rightEyeInner,
      leftEyeOuter,
      rightEyeOuter,
      leftBrowInner,
      rightBrowInner,
      leftBrowOuter,
      rightBrowOuter,
      leftMouth,
      rightMouth,
      leftNoseSide,
      rightNoseSide
    },
    acupoints: acupoints.map(p => ({
      code: p.code,
      name: p.name,
      side: p.side,
      x: Number(p.position.x.toFixed(4)),
      y: Number(p.position.y.toFixed(4)),
      z: Number(p.position.z.toFixed(4)),
      description: p.description
    }))
  };
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf8');
  console.log('\\n结果已保存到:', OUTPUT_PATH);
  console.log('精确定位穴位数量:', acupoints.length);
  
}, undefined, (error) => {
  console.error('模型加载失败:', error);
  process.exit(1);
});
