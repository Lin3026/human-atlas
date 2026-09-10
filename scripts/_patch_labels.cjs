const fs = require('fs');
let content = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

// 1. 修改 labelResources 类型，增加 line 和 lineMaterial
const oldType = `  const labelResources: {
    texture: T.CanvasTexture;
    material: T.SpriteMaterial;
    sprite: T.Sprite;
  }[] = [];`;

const newType = `  const labelResources: {
    texture: T.CanvasTexture;
    material: T.SpriteMaterial;
    sprite: T.Sprite;
    line: T.Line;
    lineMaterial: T.LineBasicMaterial;
  }[] = [];`;

if (normalized.includes(oldType)) {
  content = normalized.replace(oldType, newType);
  console.log('1. labelResources类型修改成功');
} else {
  console.log('1. 未找到labelResources类型');
}

// 2. 修改 clearLabelResources，dispose line
const oldClear = `  function clearLabelResources() {
    for (const item of labelResources) {
      item.texture.dispose();
      item.material.dispose();
    }
    labelResources.length = 0;
  }`;

const newClear = `  function clearLabelResources() {
    for (const item of labelResources) {
      item.texture.dispose();
      item.material.dispose();
      item.line.geometry.dispose();
      item.lineMaterial.dispose();
    }
    labelResources.length = 0;
  }`;

if (content.includes(oldClear)) {
  content = content.replace(oldClear, newClear);
  console.log('2. clearLabelResources修改成功');
} else {
  console.log('2. 未找到clearLabelResources');
}

// 3. 修改 addLabel：增大偏移 + 添加引导线
const oldLabel = `    const sprite = new T.Sprite(material);

    // 标签是显示注释，不是穴位坐标。
    // 与红点错开，避免挡住皮肤上的实际标记。
    sprite.position.copy(position);
    sprite.position.x += .047;
    sprite.position.z += .008;
    sprite.scale.set(.074, .013875, 1);
    sprite.visible = labelsVisible;
    sprite.renderOrder = 12;

    markerGroup.add(sprite);
    labelResources.push({texture, material, sprite});
  }`;

const newLabel = `    const sprite = new T.Sprite(material);

    // 标签是显示注释，不是穴位坐标。
    // 拉远标签避免与身体重叠，用引导线指向穴位。
    sprite.position.copy(position);
    sprite.position.x += .092;
    sprite.position.z += .018;
    sprite.scale.set(.074, .013875, 1);
    sprite.visible = labelsVisible;
    sprite.renderOrder = 12;

    // 引导线：从穴位红点到标签框
    const lineGeometry = new T.BufferGeometry().setFromPoints([
      position.clone().addScaledVector(vector(value.displayNormal), .002),
      sprite.position.clone()
    ]);
    const lineMaterial = new T.LineBasicMaterial({
      color: code === selected ? '#cf861c' : '#b84b3a',
      transparent: true,
      opacity: .65,
      depthTest: true,
      depthWrite: false
    });
    const line = new T.Line(lineGeometry, lineMaterial);
    line.visible = labelsVisible;
    line.renderOrder = 11;

    markerGroup.add(line);
    markerGroup.add(sprite);
    labelResources.push({texture, material, sprite, line, lineMaterial});
  }`;

if (content.includes(oldLabel)) {
  content = content.replace(oldLabel, newLabel);
  console.log('3. addLabel修改成功');
} else {
  console.log('3. 未找到addLabel目标块');
  // 调试：查找sprite.position.x
  const idx = content.indexOf('sprite.position.x +=');
  console.log('   sprite.position.x位置:', idx);
  console.log('   上下文:', JSON.stringify(content.substring(idx-30, idx+150)));
}

// 恢复Windows换行符并写入
fs.writeFileSync('./app/acupoint-editor.ts', content.replace(/\n/g, '\r\n'));
console.log('\n文件已保存');
