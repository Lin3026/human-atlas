const fs = require('fs');
let content = fs.readFileSync('./app/scene.tsx', 'utf8');

// 给ground、platform、ring、innerRing添加visible=false
const replacements = [
  {
    old: "ground.position.y=-.019;scene.add(ground);",
    new: "ground.position.y=-.019;ground.visible=false;scene.add(ground);"
  },
  {
    old: "platform.position.y=-.016;scene.add(platform);",
    new: "platform.position.y=-.016;platform.visible=false;scene.add(platform);"
  },
  {
    old: "ring.position.y=.001;scene.add(ring);",
    new: "ring.position.y=.001;ring.visible=false;scene.add(ring);"
  },
  {
    old: "innerRing.position.y=.001;scene.add(innerRing);",
    new: "innerRing.position.y=.001;innerRing.visible=false;scene.add(innerRing);"
  }
];

for (const r of replacements) {
  if (content.includes(r.old)) {
    content = content.replace(r.old, r.new);
    console.log('已修改: ' + r.old.substring(0, 30) + '...');
  } else {
    console.log('未找到: ' + r.old.substring(0, 30) + '...');
  }
}

fs.writeFileSync('./app/scene.tsx', content, 'utf8');
console.log('\nscene.tsx 已更新');
