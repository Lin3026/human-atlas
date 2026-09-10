const fs = require('fs');
let c = fs.readFileSync('./app/scene.tsx', 'utf8');
const normalized = c.replace(/\r\n/g, '\n');

const oldMaterial = `  const materialFor=(system:string)=>{
   const m=new T.MeshStandardMaterial({color:SYSTEMS.find(s=>s.id===system)?.color??'#aebbb8',metalness:.08,roughness:.53,side:T.DoubleSide,transparent:false,opacity:1,depthWrite:true});`;

const newMaterial = `  const materialFor=(system:string)=>{
   const isSkin=system==='integumentary';
   const m=new T.MeshStandardMaterial({color:SYSTEMS.find(s=>s.id===system)?.color??'#aebbb8',metalness:.08,roughness:.53,side:T.DoubleSide,transparent:isSkin,opacity:isSkin?.85:1,depthWrite:!isSkin});`;

if (normalized.includes(oldMaterial)) {
  c = normalized.replace(oldMaterial, newMaterial);
  fs.writeFileSync('./app/scene.tsx', c.replace(/\n/g, '\r\n'));
  console.log('皮肤透明度已改为85%');
} else {
  console.log('未找到materialFor块');
  const idx = normalized.indexOf('materialFor');
  console.log('位置:', idx);
  console.log('上下文:', JSON.stringify(normalized.substring(idx, idx+200)));
}
