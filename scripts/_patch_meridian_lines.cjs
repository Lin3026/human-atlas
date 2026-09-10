const fs = require('fs');
let c = fs.readFileSync('./app/acupoint-editor.ts', 'utf8');
const normalized = c.replace(/\r\n/g, '\n');

// 1. 在surfaceLineGroup后面添加meridianLineGroup
const oldGroup = `  const surfaceLineGroup = new T.Group();
  surfaceLineGroup.name = 'CV2-CV8-surface-guide-not-full-meridian';
  scene.add(surfaceLineGroup);`;

const newGroup = `  const surfaceLineGroup = new T.Group();
  surfaceLineGroup.name = 'CV2-CV8-surface-guide-not-full-meridian';
  scene.add(surfaceLineGroup);

  // 经络连线：把同一条经脉的穴位按顺序连接
  const meridianLineGroup = new T.Group();
  meridianLineGroup.name = 'meridian-connection-lines';
  scene.add(meridianLineGroup);
  let meridianLinesVisible = true;

  const MERIDIAN_COLORS: Record<string, string> = {
    LU: '#E8E8E8', LI: '#D4A574', ST: '#E8C84A', SP: '#A0522D',
    HT: '#DC143C', SI: '#F0A0A0', BL: '#4169E1', KI: '#6A5ACD',
    PC: '#B22222', TE: '#DDA0DD', GB: '#2E8B57', LR: '#3CB371',
    GV: '#DAA520', CV: '#708090'
  };`;

if (normalized.includes(oldGroup)) {
  c = normalized.replace(oldGroup, newGroup);
  console.log('1. meridianLineGroup已添加');
} else {
  console.log('1. 未找到surfaceLineGroup');
}

// 2. 在rebuildSurfaceLine函数后面添加rebuildMeridianLines函数
const oldRebuildEnd = `    surfaceLineGroup.updateMatrixWorld(true);
  }

  const pickable: T.Mesh[] = [];`;

const newRebuildEnd = `    surfaceLineGroup.updateMatrixWorld(true);
  }

  function clearMeridianLines() {
    for (const child of [...meridianLineGroup.children]) {
      if (child instanceof T.Line) child.geometry.dispose();
    }
    meridianLineGroup.clear();
  }

  function rebuildMeridianLines() {
    clearMeridianLines();
    meridianLineGroup.visible = available && meridianLinesVisible && markerGroup.visible;
    if (!meridianLineGroup.visible) return;

    // 按经脉分组
    const byMeridian: Record<string, string[]> = {};
    for (const code of Object.keys(points)) {
      const m = code.replace(/[0-9]/g, '');
      if (!byMeridian[m]) byMeridian[m] = [];
      byMeridian[m].push(code);
    }

    // 每条经脉按穴位编号排序后连线
    for (const [meridian, codes] of Object.entries(byMeridian)) {
      if (codes.length < 2) continue;
      // 按数字排序
      codes.sort((a, b) => {
        const na = parseInt(a.replace(/[^0-9]/g, ''));
        const nb = parseInt(b.replace(/[^0-9]/g, ''));
        return na - nb;
      });

      const color = MERIDIAN_COLORS[meridian] || '#888888';
      const material = new T.LineBasicMaterial({
        color: new T.Color(color),
        transparent: true,
        opacity: 0.7,
        linewidth: 2
      });

      const positions: number[] = [];
      for (const code of codes) {
        const p = points[code];
        if (p) {
          positions.push(p.position[0], p.position[1], p.position[2]);
        }
      }
      if (positions.length >= 6) {
        const geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
        const line = new T.Line(geometry, material);
        line.userData.meridian = meridian;
        meridianLineGroup.add(line);
      }
    }
    meridianLineGroup.updateMatrixWorld(true);
  }

  const pickable: T.Mesh[] = [];`;

if (c.includes(oldRebuildEnd)) {
  c = c.replace(oldRebuildEnd, newRebuildEnd);
  console.log('2. rebuildMeridianLines函数已添加');
} else {
  console.log('2. 未找到rebuildSurfaceLine结尾');
  const idx = c.indexOf('surfaceLineGroup.updateMatrixWorld(true);');
  console.log('   位置:', idx);
}

// 3. 在调用rebuildSurfaceLine的地方也调用rebuildMeridianLines
c = c.replace(/rebuildSurfaceLine\(\);/g, 'rebuildSurfaceLine();\n    rebuildMeridianLines();');
console.log('3. 已在rebuildSurfaceLine调用处添加rebuildMeridianLines');

// 4. 在dispose时清理meridianLineGroup
const oldDispose = `      clearSurfaceLine();
      scene.remove(surfaceLineGroup);
      surfaceLineMaterial.dispose();`;

const newDispose = `      clearSurfaceLine();
      scene.remove(surfaceLineGroup);
      surfaceLineMaterial.dispose();
      clearMeridianLines();
      scene.remove(meridianLineGroup);`;

if (c.includes(oldDispose)) {
  c = c.replace(oldDispose, newDispose);
  console.log('4. dispose清理已添加');
} else {
  console.log('4. 未找到dispose块');
}

fs.writeFileSync('./app/acupoint-editor.ts', c.replace(/\n/g, '\r\n'));
console.log('\nacupoint-editor.ts 已保存');
