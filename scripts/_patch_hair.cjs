const fs = require('fs');
let content = fs.readFileSync('./app/scene.tsx', 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

// 1. 在visibleParts过滤前添加HIDDEN_BY_DEFAULT常量，并修改过滤逻辑
const oldFilter = `    const visible=new Set(s.visible),selection=new Set(s.selected);
    const visibleParts=atlas.parts.filter(p=>s.isolate?selection.has(p.id):visible.has(p.system)||selection.has(p.id));`;

const newFilter = `    const visible=new Set(s.visible),selection=new Set(s.selected);
    const HIDDEN_BY_DEFAULT=new Set(['FJ2813','FJ2815']);
    const visibleParts=atlas.parts.filter(p=>{
      if(s.isolate)return selection.has(p.id);
      if(HIDDEN_BY_DEFAULT.has(p.id))return selection.has(p.id);
      return visible.has(p.system)||selection.has(p.id);
    });`;

if (normalized.includes(oldFilter)) {
  content = normalized.replace(oldFilter, newFilter);
  console.log('1. visibleParts过滤逻辑修改成功');
} else {
  console.log('1. 未找到visibleParts过滤块');
}

// 2. 修改data.set里的可见性判断
const oldData = `     const selected=selection.has(p.id);data.set([dx,dy,dz,(s.isolate?selected:visible.has(p.system)||selected)?1:0],i*4);selectedData[i*4]=selected?255:0;`;

const newData = `     const selected=selection.has(p.id);const partVisible=s.isolate?selected:(HIDDEN_BY_DEFAULT.has(p.id)?selected:visible.has(p.system)||selected);data.set([dx,dy,dz,partVisible?1:0],i*4);selectedData[i*4]=selected?255:0;`;

if (content.includes(oldData)) {
  content = content.replace(oldData, newData);
  console.log('2. data.set可见性判断修改成功');
} else {
  console.log('2. 未找到data.set块');
  const idx = content.indexOf('const selected=selection.has(p.id)');
  console.log('   位置:', idx);
  console.log('   上下文:', JSON.stringify(content.substring(idx, idx+150)));
}

fs.writeFileSync('./app/scene.tsx', content.replace(/\n/g, '\r\n'));
console.log('\nscene.tsx 已保存');
