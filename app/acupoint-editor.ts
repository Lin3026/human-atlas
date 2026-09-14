// full-acupoint-catalog-v1
import {ACUPOINT_CATALOG,MERIDIAN_CATALOG} from './acupoint-catalog';
// acupoint-display-upgrade-v1
import {PROJECT_ACUPOINT_SEED} from './acupoint-seed';

import * as T from 'three';
import type {Atlas} from './anatomy';

type XYZ = [number, number, number];
type AnchorKey = 'navel' | 'pubic';

interface SurfacePoint {
  position: XYZ;
  displayNormal: XYZ;
  faceIndex: number;
  vertexIndices: XYZ;
  barycentric: XYZ;
  meshId: 'FJ2810';
}

interface StoredPoint extends SurfacePoint {
  method: 'manual-surface-pick' | 'regional-projection';
  status: 'pending-review';
}

interface SavedData {
  schema: 1;
  modelKey: string;
  standard: string;
  anchors: Partial<Record<AnchorKey, SurfacePoint>>;
  points: Record<string, StoredPoint>;
}

interface PointDefinition {
  code: string;
  name: string;
  downCun: number;
  clause: string;
  text: string;
}

const ABDOMINAL_DEFINITIONS: PointDefinition[] = [
  {
    code:'CV2', name:'曲骨', downCun:5, clause:'5.14.2',
    text:'在下腹部，耻骨联合上缘，前正中线上。'
  },
  {
    code:'CV3', name:'中极', downCun:4, clause:'5.14.3',
    text:'在下腹部，脐中下4寸，前正中线上。'
  },
  {
    code:'CV4', name:'关元', downCun:3, clause:'5.14.4',
    text:'在下腹部，脐中下3寸，前正中线上。'
  },
  {
    code:'CV5', name:'石门', downCun:2, clause:'5.14.5',
    text:'在下腹部，脐中下2寸，前正中线上。'
  },
  {
    code:'CV6', name:'气海', downCun:1.5, clause:'5.14.6',
    text:'在下腹部，脐中下1.5寸，前正中线上。'
  },
  {
    code:'CV7', name:'阴交', downCun:1, clause:'5.14.7',
    text:'在下腹部，脐中下1寸，前正中线上。'
  },
  {
    code:'CV8', name:'神阙', downCun:0, clause:'5.14.8',
    text:'在上腹部，脐中央。'
  }
];

const DEFINITIONS: PointDefinition[] = ACUPOINT_CATALOG.map(item => {
  const existing = ABDOMINAL_DEFINITIONS.find(p => p.code === item.code);
  return existing ?? {
    code: item.code,
    name: item.name,
    clause: item.clause,
    downCun: -1,
    text: '已收录标准名称与条款索引；本条定位正文尚未录入本面板，请查阅对应国标条款。'
  };
});

function vector(value: XYZ) {
  return new T.Vector3(...value);
}

function tuple(value: T.Vector3): XYZ {
  return [value.x, value.y, value.z];
}

/**
 * 独立的模型标注工具。
 * 不从包围盒中心推断穴位，不把自动结果设为“已复核”。
 */
export function createAcupointEditor(
  host: HTMLElement,
  scene: T.Scene,
  atlas: Atlas,
  getSkin: () => T.Mesh | undefined
) {
  const skinPart = atlas.parts.find(p => p.id === 'FJ2810');
  if (!skinPart) throw new Error('缺少皮肤部件 FJ2810，不能启动皮肤标注。');

  // 这是版本兼容标识，不是模型内容的密码学哈希。
  const modelKey = JSON.stringify([
    atlas.version, skinPart.id,
    skinPart.vertexCount, skinPart.indexCount, skinPart.bounds
  ]);
  const storageKey = 'human-atlas-acupoint-editor-v1';

  let anchors: Partial<Record<AnchorKey, SurfacePoint>> = {};
  let points: Record<string, StoredPoint> = {};
  let armed: string | null = null;
  let selected = 'CV8';
  let activeMeridian = 'CV';
  let available = false;
  let dirty = true;
  let disposed = false;

  const markerGroup = new T.Group();
  markerGroup.name = 'acupoint-drafts-pending-review';
  markerGroup.visible = true;
  // 尺子测量功能（变量必须在使用前定义）
  let rulerEnabled = false;
  let rulerPoint1: T.Vector3 | null = null;
  let rulerPoint2: T.Vector3 | null = null;
  const rulerGroup = new T.Group();
  const rulerLineMaterial = new T.LineBasicMaterial({ color: 0xff6b35, linewidth: 2, depthTest: false });
  const rulerPointMaterial = new T.MeshBasicMaterial({ color: 0xff6b35, depthTest: false });
  const rulerPointGeometry = new T.SphereGeometry(.006, 12, 8);
  scene.add(rulerGroup);
  scene.add(markerGroup);

  const pointGeometry = new T.SphereGeometry(.005, 14, 10);
  const anchorGeometry = new T.SphereGeometry(.005, 14, 10);

  const pointMaterial = new T.MeshBasicMaterial({
    color: '#d04435',
    depthTest: true,
    depthWrite: false
  });
  const selectedMaterial = new T.MeshBasicMaterial({
    color: '#f5a623',
    depthTest: true,
    depthWrite: false
  });
  const anchorMaterial = new T.MeshBasicMaterial({
    color: '#168c94',
    depthTest: true,
    depthWrite: false
  });

  let surfaceLineVisible = true;
  const surfaceLineGroup = new T.Group();
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
  };

  const surfaceLineMaterial = new T.LineBasicMaterial({
    color:'#bc5037',
    transparent:true,
    opacity:.9,
    depthTest:true,
    depthWrite:false
  });

  function clearRuler() {
    while (rulerGroup.children.length > 0) {
      const child = rulerGroup.children[0];
      rulerGroup.remove(child);
      if (child instanceof T.Mesh) {
        child.geometry.dispose();
      } else if (child instanceof T.Line) {
        child.geometry.dispose();
      }
    }
  }
  function updateRuler() {
    clearRuler();
    if (!rulerEnabled) return;
    const CM_PER_CUN = 2.19; // 1寸 = 2.19cm（基于身高171.9cm）
    if (rulerPoint1) {
      const p1 = new T.Mesh(rulerPointGeometry, rulerPointMaterial);
      p1.position.copy(rulerPoint1);
      p1.renderOrder = 100;
      rulerGroup.add(p1);
    }
    if (rulerPoint1 && rulerPoint2) {
      const p2 = new T.Mesh(rulerPointGeometry, rulerPointMaterial);
      p2.position.copy(rulerPoint2);
      p2.renderOrder = 100;
      rulerGroup.add(p2);
      // 连线
      const lineGeometry = new T.BufferGeometry().setFromPoints([rulerPoint1, rulerPoint2]);
      const line = new T.Line(lineGeometry, rulerLineMaterial);
      line.renderOrder = 99;
      rulerGroup.add(line);
      // 计算距离
      const distM = rulerPoint1.distanceTo(rulerPoint2);
      const distCm = distM * 100;
      const distCun = distCm / CM_PER_CUN;
      const direction = rulerPoint2.clone().sub(rulerPoint1).normalize();
      // 计算垂直于测量线的方向（用于数字标签错开）
      const up = new T.Vector3(0, 1, 0);
      const perpendicular = new T.Vector3().crossVectors(direction, up).normalize();
      // 添加1寸刻度标记（小球 + 数字标注，无背景方块）
      // 从起点开始，1寸位置是第一个刻度球（第二个球）
      const tickGeometry = new T.SphereGeometry(.004, 8, 6);
      const tickMaterial = new T.MeshBasicMaterial({ color: 0xffaa00, depthTest: false });
      const fullCun = Math.floor(distCun);
      for (let i = 1; i <= fullCun; i++) {
        const tickDist = (i * CM_PER_CUN) / 100; // 转换为米
        const tickPos = rulerPoint1.clone().add(direction.clone().multiplyScalar(tickDist));
        const tick = new T.Mesh(tickGeometry, tickMaterial);
        tick.position.copy(tickPos);
        tick.renderOrder = 100;
        rulerGroup.add(tick);
        // 刻度数字标签（无背景，黑色文字带白色描边）
        // 数字标签交替上下排列，避免重叠
        const labelOffset = (i % 2 === 0) ? 0.025 : -0.025;
        const labelPos = tickPos.clone().add(perpendicular.clone().multiplyScalar(labelOffset));
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 64; labelCanvas.height = 32;
        const labelCtx = labelCanvas.getContext('2d')!;
        labelCtx.clearRect(0, 0, 64, 32);
        labelCtx.font = 'bold 18px "Microsoft YaHei", sans-serif';
        labelCtx.textAlign = 'center';
        labelCtx.textBaseline = 'middle';
        // 黑色描边
        labelCtx.strokeStyle = '#000';
        labelCtx.lineWidth = 3;
        labelCtx.strokeText(i + '寸', 32, 16);
        // 白色文字
        labelCtx.fillStyle = '#fff';
        labelCtx.fillText(i + '寸', 32, 16);
        const labelTexture = new T.CanvasTexture(labelCanvas);
        const labelSpriteMaterial = new T.SpriteMaterial({ map: labelTexture, depthTest: false, transparent: true });
        const labelSprite = new T.Sprite(labelSpriteMaterial);
        labelSprite.position.copy(labelPos);
        labelSprite.scale.set(0.04, 0.02, 1);
        labelSprite.renderOrder = 101;
        rulerGroup.add(labelSprite);
      }
      // 在第一个球（起点）旁边显示总距离（无背景，白色文字带黑色描边）
      const canvas = document.createElement('canvas');
      canvas.width = 220; canvas.height = 48;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 220, 48);
      ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // 黑色描边
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('总距离：' + distCun.toFixed(2) + '寸 (' + distCm.toFixed(1) + 'cm)', 110, 24);
      // 白色文字
      ctx.fillStyle = '#fff';
      ctx.fillText('总距离：' + distCun.toFixed(2) + '寸 (' + distCm.toFixed(1) + 'cm)', 110, 24);
      const texture = new T.CanvasTexture(canvas);
      const spriteMaterial = new T.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
      const sprite = new T.Sprite(spriteMaterial);
      // 放在第一个球（起点）的上方，稍微偏移一点避免重叠
      sprite.position.copy(rulerPoint1);
      sprite.position.y += 0.06;
      sprite.position.z += 0.02;
      sprite.scale.set(0.14, 0.03, 1);
      sprite.renderOrder = 102;
      rulerGroup.add(sprite);
    }
  }
  function clearSurfaceLine() {
    for (const child of [...surfaceLineGroup.children]) {
      if (child instanceof T.Line) child.geometry.dispose();
    }
    surfaceLineGroup.clear();
  }

  function rebuildSurfaceLine() {
    clearSurfaceLine();
    surfaceLineGroup.visible =
      available && surfaceLineVisible && activeMeridian === 'CV';

    const skin = getSkin();
    if (!skin || !surfaceLineGroup.visible) return;
    skin.updateMatrixWorld(true);

    // 明确限定：只连接已标注的下腹部七穴。
    // 缺少端点就不跨过去补线。
    const order = ['CV2','CV3','CV4','CV5','CV6','CV7','CV8'];
    const ray = new T.Raycaster();
    const direction = new T.Vector3(0,0,-1);

    for (let index = 0; index < order.length - 1; index++) {
      const from = points[order[index]];
      const to = points[order[index + 1]];
      if (!from || !to) continue;

      const start = vector(from.position);
      const end = vector(to.position);
      const samples = Math.max(
        8, Math.ceil(start.distanceTo(end) / .002)
      );
      let strip: T.Vector3[] = [];

      const flushStrip = () => {
        if (strip.length > 1) {
          const geometry = new T.BufferGeometry().setFromPoints(strip);
          const line = new T.Line(geometry, surfaceLineMaterial);
          surfaceLineGroup.add(line);
        }
        strip = [];
      };

      for (let sample = 0; sample <= samples; sample++) {
        const target = start.clone().lerp(end, sample / samples);
        ray.set(
          new T.Vector3(target.x,target.y,skinPart!.bounds[1][2]+.2),
          direction
        );
        ray.near = 0;
        ray.far = 1;

        const hit = ray.intersectObject(skin,false)[0];

        // 不跨越未命中处，避免穿洞连到背面或其他前突结构。
        if (!hit?.face || Math.abs(hit.point.z-target.z) > .025) {
          flushStrip();
          continue;
        }

        const normal = hit.face.normal.clone().applyNormalMatrix(
          new T.Matrix3().getNormalMatrix(skin.matrixWorld)
        ).normalize();
        if (normal.dot(direction) > 0) normal.negate();

        const displayed = hit.point.clone().addScaledVector(normal,.001);

        const previous = strip[strip.length-1];
        if (previous && previous.distanceTo(displayed) > .012) {
          flushStrip();
        }
        strip.push(displayed);
      }
      flushStrip();
    }
    surfaceLineGroup.updateMatrixWorld(true);
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

        // 只显示当前选中经脉的连线
    for (const [meridian, codes] of Object.entries(byMeridian)) {
      if (meridian !== activeMeridian) continue;
      if (codes.length < 2) continue;
      // 按数字排序
      codes.sort((a, b) => {
        const na = parseInt(a.replace(/[^0-9]/g, ''));
        const nb = parseInt(b.replace(/[^0-9]/g, ''));
        return na - nb;
      });

      const color = MERIDIAN_COLORS[meridian] || '#888888';
      const material = new T.MeshStandardMaterial({
        color: new T.Color(color),
        emissive: new T.Color(color),
        emissiveIntensity: 0.7,
        metalness: 0.1,
        roughness: 0.35,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        depthTest: false
      });

      const pts: T.Vector3[] = [];
      for (const code of codes) {
        const p = points[code];
        if (p) {
          pts.push(new T.Vector3(p.position[0], p.position[1], p.position[2]));
        }
      }
      if (pts.length >= 2) {
        const curve = new T.CatmullRomCurve3(pts, false, 'centripetal');
        const tube = new T.TubeGeometry(curve, Math.max(40, pts.length * 8), 0.0012, 10, false);
        const mesh = new T.Mesh(tube, material);
        mesh.renderOrder = 8;
        mesh.userData.meridian = meridian;
        meridianLineGroup.add(mesh);
      }
    }
    meridianLineGroup.updateMatrixWorld(true);
  }

  const pickable: T.Mesh[] = [];
  let labelsVisible = true;
  const labelResources: {
    texture: T.CanvasTexture;
    material: T.SpriteMaterial;
    sprite: T.Sprite;
    line: T.Line;
    lineMaterial: T.LineBasicMaterial;
  }[] = [];

  function clearLabelResources() {
    for (const item of labelResources) {
      item.texture.dispose();
      item.material.dispose();
      item.line.geometry.dispose();
      item.lineMaterial.dispose();
    }
    labelResources.length = 0;
  }

  function addLabel(position: T.Vector3, code: string) {
    const definition = DEFINITIONS.find(item => item.code === code);
    if (!definition) return;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const context = canvas.getContext('2d');
    if (!context) return;

    // 透明背景，无方框
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#263e37';
    context.font = '600 42px "Microsoft YaHei", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(
      definition.name + ' ' + code,
      canvas.width / 2,
      canvas.height / 2
    );

    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;

    const material = new T.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      toneMapped: false
    });

    const sprite = new T.Sprite(material);

        // 标签是显示注释，不是穴位坐标。
    // 根据穴位在身体的位置智能选择标签方向，避免重叠。
    sprite.position.copy(position);
    
    // 细分区域判断
    const isHeadTop = position.y > 1.62 && Math.abs(position.z) < 0.06;  // 头顶正中线
    const isHeadFront = position.y > 1.55 && position.z > 0.06;  // 头前面
    const isHeadBack = position.y > 1.55 && position.z < -0.06;  // 头后面
    const isHeadSide = position.y > 1.50 && Math.abs(position.x) > 0.06;  // 头侧面
    const isFootBottom = position.y < 0.12;  // 脚底
    const isFootTop = position.y >= 0.12 && position.y < 0.20 && position.z > 0;  // 脚背（前面）
    const isKneeBack = position.y >= 0.18 && position.y < 0.45 && position.z < -0.02;  // 膝盖后面（腘窝）
    const isLungMeridian = code.startsWith('LU');  // 手太阴肺经
    const isFront = position.z > 0.04;  // 身体前面
    const isBack = position.z < -0.04;  // 身体后面
    const isLeftSide = position.x > 0.10;  // 身体左侧
    const isRightSide = position.x < -0.10;  // 身体右侧
    
    if (isHeadTop) {
      // 头顶正中线：标签向上，并根据前后位置微调
      sprite.position.y += 0.07;
      sprite.position.z += position.z > 0 ? 0.02 : -0.02;
    } else if (isHeadFront) {
      // 头前面：标签向前上方
      sprite.position.z += 0.08;
      sprite.position.y += 0.03;
      sprite.position.x += position.x > 0 ? 0.02 : -0.02;
    } else if (isHeadBack) {
      // 头后面：标签向后上方
      sprite.position.z -= 0.08;
      sprite.position.y += 0.03;
      sprite.position.x += position.x > 0 ? 0.02 : -0.02;
    } else if (isHeadSide) {
      // 头侧面：标签向侧面
      if (position.x > 0) {
        sprite.position.x += 0.09;
      } else {
        sprite.position.x -= 0.09;
      }
      sprite.position.y += 0.02;
    } else if (isFootBottom) {
      // 脚底：标签向下
      sprite.position.y -= 0.07;
      sprite.position.x += position.x > 0 ? 0.02 : -0.02;
    } else if (isFootTop) {
      // 脚背：标签向前
      sprite.position.z += 0.07;
      sprite.position.x += position.x > 0 ? 0.02 : -0.02;
    } else if (isKneeBack) {
      // 膝盖后面（腘窝）：标签向后更多，避免穿插
      sprite.position.z -= 0.16;
      sprite.position.x += position.x > 0 ? 0.04 : -0.04;
      sprite.position.y += 0.01;
    } else if (isLungMeridian) {
      // 手太阴肺经：全部在身体前面/手臂内侧，标签向前偏移更多避免穿插
      sprite.position.z += 0.14;
      sprite.position.x += position.x > 0 ? 0.06 : -0.06;
      sprite.position.y += 0.01;
    } else if (isFront && !isLeftSide && !isRightSide) {
      // 身体前面正中线：标签向前
      sprite.position.z += 0.09;
      sprite.position.x += 0.02;
    } else if (isBack && !isLeftSide && !isRightSide) {
      // 身体后面正中线：标签向后
      sprite.position.z -= 0.09;
      sprite.position.x += 0.02;
    } else if (isLeftSide) {
      // 身体左侧：标签向左
      sprite.position.x += 0.09;
      if (isFront) sprite.position.z += 0.02;
      if (isBack) sprite.position.z -= 0.08;
    } else if (isRightSide) {
      // 身体右侧：标签向右
      sprite.position.x -= 0.09;
      if (isFront) sprite.position.z += 0.02;
      if (isBack) sprite.position.z -= 0.08;
    } else {
      // 默认：根据前后决定Z方向，X轻微偏移
      sprite.position.x += 0.05;
      sprite.position.z += position.z >= 0 ? 0.07 : -0.07;
    }
    
    sprite.scale.set(.074, .013875, 1);
    sprite.visible = labelsVisible;
    sprite.renderOrder = 12;

    // 引导线：从穴位红点到标签框
    const lineGeometry = new T.BufferGeometry().setFromPoints([
      position.clone(),
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
  }

  const style = document.createElement('style');
  style.textContent = [
    '.ae-panel{position:absolute;right:88px;top:106px;z-index:26;',
    'width:292px;max-height:calc(100dvh - 275px);overflow:auto;',
    'padding:14px;border:1px solid #d6e0d7;border-radius:12px;',
    'background:#fffefaF5;box-shadow:0 12px 36px #203e3018;',
    'color:#29483d;font:13px/1.65 system-ui,"Microsoft YaHei",sans-serif;}',
    '.ae-panel summary{cursor:pointer;font-size:16px;font-weight:650;}',
    '.ae-panel button{border:1px solid #cddbcf;background:#fff;',
    'border-radius:7px;padding:6px 9px;color:#29483d;margin:3px 3px 3px 0;}',
    '.ae-panel button:hover{background:#edf4e9;}',
    '.ae-panel button:focus-visible{outline:2px solid #168c94;outline-offset:2px;}',
    '.ae-panel button[aria-pressed=true]{background:#286c57;color:white;}',
    '.ae-panel .ae-status{padding:8px;background:#edf4eb;border-radius:7px;margin:9px 0;}',
    '.ae-panel .ae-message{color:#a34d2b;white-space:pre-wrap;}',
    '.ae-panel .ae-small{font-size:11px;color:#747a6b;}',
    '.ae-panel .ae-card{padding:10px;background:#f1f4ed;border-radius:8px;margin:9px 0;}',
    '.ae-panel .ae-card p{margin:5px 0;}',
    '.ae-panel h3{font-size:13px;margin:12px 0 5px;}',
    '.ae-panel .ae-list{display:grid;grid-template-columns:1fr 1fr;gap:3px;}',
    '.ae-panel .ae-list button{text-align:left;}',
    '.ae-panel .ae-study-library{border-top:1px solid #dce3d8;margin-top:14px;padding-top:10px;}',
    '.ae-panel .ae-study-summary{cursor:pointer;font-weight:600;font-size:14px;margin:8px 0;}',
    '.ae-panel .ae-study-item{padding:8px;background:#f1f4ed;border-radius:7px;margin:6px 0;}',
    '.ae-panel .ae-study-item p{margin:4px 0;}',
    '.ae-panel .ae-study-search{width:100%;padding:7px;border:1px solid #cddbcf;border-radius:7px;margin:6px 0;font-size:12px;}',
    '.ae-panel .ae-study-points-list{max-height:200px;overflow:auto;}',
    '@media(max-width:1100px){.ae-panel{right:20px;top:100px;width:260px;}}',
    '@media(max-width:767px){.ae-panel{right:10px;left:10px;top:110px;',
    'width:auto;max-height:43dvh;}}'
  ].join('');
  host.appendChild(style);

  const panel = document.createElement('section');
  panel.className = 'ae-panel';
  panel.setAttribute('aria-label', '任脉穴位标定工具');
  panel.innerHTML = [
    '<details open>',
    '<summary>十四经穴位 · 标注与学习</summary>',
    '<h3>经脉目录</h3>',
    '<select data-role="meridian-select" aria-label="选择经脉"',
    ' style="width:100%;padding:8px;border:1px solid #cddbcf;border-radius:7px;background:white"></select>',
    '<p class="ae-small" data-role="catalog-count"></p>',
    '<p class="ae-small">GB/T 12346—2021 · 362个名称条目<br>',
    '362穴目录已收录；已有坐标才显示三维标记。空目录不代表已完成定位。</p>',
    '<div class="ae-status" data-role="status"></div>',
    '<h3>① 标定两个基准</h3>',
    '<button data-action="navel">拾取脐中</button>',
    '<button data-action="pubic">拾取耻骨上缘体表点</button>',
    '<button data-action="cancel">退出拾取模式</button>',
    '<div class="ae-small" data-role="anchors"></div>',
    '<p class="ae-small">先通过解剖参考确认耻骨联合上缘，',
    '再回到皮肤拾取对应点。不要把生殖器根部或阴毛边界当作该标志。</p>',
    '<h3>② 生成并逐点检查</h3>',
    '<button data-action="generate">仅生成CV2—CV8七穴草稿</button>',
    '<button data-action="surface-line" aria-pressed="true">七穴贴肤辅助线：开</button>',
    '<div class="ae-list" data-role="list"></div>',
    '<div class="ae-card" data-role="info"></div>',
    '<button data-action="adjust">在皮肤上标注／调整当前穴位</button>',
    '<button data-action="save" style="background:#286c57;color:white;font-weight:bold">💾 保存标注（自动+手动备份）</button>',
    '<button data-action="export">导出标注JSON</button>',
    '<button data-action="undo">撤销上次修改</button>',
    '<h3>显示与数据管理</h3>',
    '<button data-action="labels" aria-pressed="true">穴名标签：开</button>',
    '<button data-action="delete-point">删除当前穴位</button>',
    '<button data-action="clear-navel">清除脐中基准</button>',
    '<button data-action="clear-pubic">清除耻骨基准</button>',
    '<button data-action="restore-seed">恢复项目内置全部穴位（264穴）</button>',
    '<p class="ae-message" data-role="message" role="status"></p>',
    '<p class="ae-small">红点：穴位草稿；金点：当前穴位；旁侧文字框仅为穴名标签；',
    '蓝绿点：尚未生成穴位时的基准。旋转不会误记为点击。</p>',
    '<p class="ae-small">自动生成采用基准间的纵向折量和局部皮肤投影。',
    '正中线暂按两基准的X/Y连线处理，需要检查模型的实际正中线。',
    '七穴连线仅为贴肤辅助线，不是完整任脉循行；其他经脉未自动连线。</p>',
    '<div class="ae-study-library">',
    '<details><summary class="ae-study-summary">奇经八脉 · 文字资料</summary>',
    '<p class="ae-small">本区尚未关联三维路线。以下为概要，不是完整循行原文。</p>',
    '<div class="ae-study-item"><strong>任脉</strong><p>主要体表路线沿人体前正中线。具有本经所属穴位。</p></div>',
    '<div class="ae-study-item"><strong>督脉</strong><p>主要体表路线沿背部正中线，经头部至面部。具有本经所属穴位。</p></div>',
    '<div class="ae-study-item"><strong>冲脉</strong><p>循行涉及腹部、胸部及下肢等，存在分支与体内路线，不能只用一条前腹直线表示。</p></div>',
    '<div class="ae-study-item"><strong>带脉</strong><p>循行具有环绕腰腹部的特点，不能简单等同于任意水平腰围线。</p></div>',
    '<div class="ae-study-item"><strong>阴跷脉</strong><p>循行涉及内踝、下肢内侧及头面部等。</p></div>',
    '<div class="ae-study-item"><strong>阳跷脉</strong><p>循行涉及外踝、下肢外侧、躯干及头面部等。</p></div>',
    '<div class="ae-study-item"><strong>阴维脉</strong><p>循行涉及下肢内侧、腹胸及咽喉等。</p></div>',
    '<div class="ae-study-item"><strong>阳维脉</strong><p>循行涉及下肢外侧、躯干、肩颈及头部等。</p></div>',
    '<p class="ae-small">十二正经加任脉、督脉，通常合称十四经。奇经八脉中，除任督二脉外，其余六脉没有本经专属穴位，而与其他经脉的穴位发生交会关系。</p>',
    '</details>',
    '<details class="ae-study-points"><summary class="ae-study-summary">穴位资料 · 16个学习示例</summary>',
    '<p class="ae-small">目前只有名称、归经与大致区域，尚未进行3D定位。"区域"不等于标准取穴方法。</p>',
    '<input class="ae-study-search" type="text" placeholder="搜索穴位、代码或经脉" aria-label="搜索穴位资料"/>',
    '<div class="ae-study-points-list"></div>',
    '</details>',
    '<details><summary class="ae-study-summary">五脏六腑与解剖模型</summary>',
    '<div class="ae-study-item"><p>五脏：心、肝、脾、肺、肾。</p><p>六腑：胆、胃、小肠、大肠、膀胱、三焦。</p>',
    '<p>中医脏腑是传统医学的功能理论概念，与现代解剖器官有联系，但不能完全等同。</p>',
    '<p>模型里的胆囊、心脏、肝脏等使用现代解剖名称。三焦不对应某一个独立的现代解剖器官，因此不创建虚构的"三焦器官"模型。</p></div>',
    '</details>',
    '</div>',
    '</details>'
  ].join('');
  host.appendChild(panel);

  function element(role: string) {
    return panel.querySelector<HTMLElement>('[data-role="' + role + '"]')!;
  }

  // 穴位资料 · 16个学习示例
  const STUDY_POINTS: [string, string, string, string][] = [
    ['LU9', '太渊', '手太阴肺经', '腕前区'],
    ['LI4', '合谷', '手阳明大肠经', '手背'],
    ['ST36', '足三里', '足阳明胃经', '小腿前外侧'],
    ['SP6', '三阴交', '足太阴脾经', '小腿内侧'],
    ['HT7', '神门', '手少阴心经', '腕前区'],
    ['SI3', '后溪', '手太阳小肠经', '手尺侧'],
    ['BL40', '委中', '足太阳膀胱经', '膝后区'],
    ['KI3', '太溪', '足少阴肾经', '踝内侧'],
    ['PC6', '内关', '手厥阴心包经', '前臂前区'],
    ['TE5', '外关', '手少阳三焦经', '前臂后区'],
    ['GB34', '阳陵泉', '足少阳胆经', '小腿外侧'],
    ['LR3', '太冲', '足厥阴肝经', '足背'],
    ['CV12', '中脘', '任脉', '上腹部'],
    ['CV6', '气海', '任脉', '下腹部'],
    ['GV20', '百会', '督脉', '头顶部'],
    ['GV14', '大椎', '督脉', '后正中线第七颈椎棘突下方区域']
  ];

  function renderStudyPoints(query: string) {
    const list = panel.querySelector<HTMLElement>('.ae-study-points-list')!;
    const q = query.trim().toLowerCase();
    const filtered = STUDY_POINTS.filter(p => p.join(' ').toLowerCase().includes(q));
    if (filtered.length === 0) {
      list.innerHTML = '<p class="ae-small">示例库中暂无匹配项。</p>';
      return;
    }
    list.innerHTML = filtered.map(([code, name, meridian, region]) =>
      `<div class="ae-study-item"><strong>${name} · ${code}</strong>` +
      `<p>归经：${meridian}</p><p>大致区域：${region}</p>` +
      `<p class="ae-small">三维标注状态：未定位</p></div>`
    ).join('');
  }

  const studySearch = panel.querySelector<HTMLInputElement>('.ae-study-search');
  if (studySearch) {
    studySearch.addEventListener('input', () => renderStudyPoints(studySearch.value));
    renderStudyPoints('');
  }

  function message(text: string) {
    element('message').textContent = text;
  }

  function snapshot(): SavedData {
    return {
      schema: 1,
      modelKey,
      standard: 'GB/T 12346—2021',
      anchors,
      points
    };
  }

  function withoutAbdominalPoints(
    sourcePoints: Record<string, StoredPoint>
  ): Record<string, StoredPoint> {
    const next = {...sourcePoints};
    for (const point of ABDOMINAL_DEFINITIONS) delete next[point.code];
    return next;
  }

  const history: string[] = [];

  function remember() {
    history.push(JSON.stringify(snapshot()));
    if (history.length > 20) history.shift();
  }

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(snapshot()));
      return true;
    } catch {
      message('浏览器本地保存失败，请使用“导出标注JSON”备份。');
      return false;
    }
  }

  function validSurface(value: unknown): value is SurfacePoint {
    if (!value || typeof value !== 'object') return false;
    const item = value as SurfacePoint;
    const validVector = (v: unknown) =>
      Array.isArray(v) && v.length === 3 &&
      v.every(n => typeof n === 'number' && Number.isFinite(n));

    return item.meshId === 'FJ2810' &&
      validVector(item.position) &&
      validVector(item.displayNormal) &&
      validVector(item.barycentric) &&
      validVector(item.vertexIndices) &&
      item.vertexIndices.every(n =>
        Number.isInteger(n) && n >= 0 && n < skinPart!.vertexCount
      ) &&
      Number.isInteger(item.faceIndex) &&
      item.faceIndex >= 0 &&
      item.faceIndex < skinPart!.indexCount / 3;
  }

  function loadProjectSeed() {
    const saved = PROJECT_ACUPOINT_SEED as unknown as SavedData;
    if (saved.modelKey !== modelKey) {
      throw new Error('项目内置穴位与模型版本不一致。');
    }

    const nextAnchors: Partial<Record<AnchorKey, SurfacePoint>> = {};
    const nextPoints: Record<string, StoredPoint> = {...points};

    for (const key of ['navel', 'pubic'] as AnchorKey[]) {
      const value = saved.anchors[key];
      if (!validSurface(value)) throw new Error('项目基准数据无效。');
      nextAnchors[key] = JSON.parse(JSON.stringify(value));
    }

    for (const item of ACUPOINT_CATALOG) {
      const value = saved.points[item.code];
      if (value && validSurface(value)) {
        nextPoints[item.code] = {
          ...JSON.parse(JSON.stringify(value)),
          status: 'pending-review'
        };
      }
    }

    anchors = nextAnchors;
    points = nextPoints;
  }

  try {
    loadProjectSeed();
    message('已载入项目内置七穴，三维状态仍为待复核。');
  } catch (error) {
    message(error instanceof Error ? error.message : String(error));
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const saved = JSON.parse(raw) as SavedData;
      if (saved.schema === 1 && saved.modelKey === modelKey) {
        anchors = {};
        points = {};
        for (const key of ['navel', 'pubic'] as AnchorKey[]) {
          const value = saved.anchors?.[key];
          if (validSurface(value)) anchors[key] = value;
        }
        for (const definition of DEFINITIONS) {
          const value = saved.points?.[definition.code];
          if (validSurface(value)) {
            points[definition.code] = {
              ...value,
              method: value.method === 'manual-surface-pick'
                ? 'manual-surface-pick' : 'regional-projection',
              status: 'pending-review'
            };
          }
        }
        message('已恢复本浏览器保存的标定草稿。');
      } else {
        message('发现其他模型版本的保存记录，未自动套用。');
      }
    }
  } catch {
    message('旧保存记录无法读取，未载入。');
  }

  const meridianSelect =
    element('meridian-select') as HTMLSelectElement;

  for (const meridian of MERIDIAN_CATALOG) {
    const option = document.createElement('option');
    option.value = meridian.id;
    option.textContent = meridian.name + ' · ' + meridian.names.length + '穴';
    meridianSelect.appendChild(option);
  }
  meridianSelect.value = activeMeridian;

  function onMeridianChange() {
    activeMeridian = meridianSelect.value;
    const first = ACUPOINT_CATALOG.find(p => p.meridian === activeMeridian);
    if (first) selected = first.code;
    armed = null;
    rebuildMarkers();
    message('已切换经脉。空心圆表示尚无三维位置，不会自动猜测坐标。');
  }

  meridianSelect.addEventListener('change', onMeridianChange);

  const pointButtons = new Map<string, HTMLButtonElement>();

  for (const definition of DEFINITIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.code = definition.code;
    button.textContent = definition.name + ' ' + definition.code;
    element('list').appendChild(button);
    pointButtons.set(definition.code, button);
  }

  function refreshInfo() {
    const definition = DEFINITIONS.find(item => item.code === selected)!;
    const point = points[selected];

    const card = element('info');
    card.replaceChildren();

    const title = document.createElement('strong');
    title.textContent = definition.name + ' · ' + definition.code;

    const text = document.createElement('p');
    text.textContent = definition.text;

    const source = document.createElement('p');
    source.className = 'ae-small';
    source.textContent = '依据：GB/T 12346—2021，' + definition.clause;

    const state = document.createElement('p');
    state.className = 'ae-small';
    state.textContent = point
      ? '三维状态：待复核；' +
        (point.method === 'manual-surface-pick' ? '人工拾取' : '区域折量投影') +
        '；皮肤面 #' + point.faceIndex
      : '三维状态：未标注';

    card.append(title, text, source, state);

    for (const [code, button] of pointButtons) {
      button.setAttribute('aria-pressed', String(code === selected));
      const meridian = ACUPOINT_CATALOG.find(p => p.code === code)?.meridian;
      button.hidden = meridian !== activeMeridian;
      const definition = DEFINITIONS.find(item => item.code === code)!;
      button.textContent =
        (points[code] ? '● ' : '○ ') + definition.name + ' ' + code;
    }

    const group = ACUPOINT_CATALOG.filter(
      item => item.meridian === activeMeridian
    );
    const placed = group.filter(item => !!points[item.code]).length;
    element('catalog-count').textContent =
      '本经已标注 ' + placed + ' / ' + group.length +
      '；全库已标注 ' +
      DEFINITIONS.filter(item => !!points[item.code]).length +
      ' / 362。全部三维位置仍待复核。';

    const anchorStatus = (key: AnchorKey) =>
      anchors[key] ? '已拾取（待核验）' : '未拾取';

    element('anchors').textContent =
      '脐中：' + anchorStatus('navel') +
      '；耻骨上缘：' + anchorStatus('pubic');
  }

  function addMarker(
    value: SurfacePoint,
    code: string | null
  ) {
    const mesh = new T.Mesh(
      code ? pointGeometry : anchorGeometry,
      code ? (code === selected ? selectedMaterial : pointMaterial) : anchorMaterial
    );

    // 实际定位保存在皮肤面上；仅显示中心外移0.8毫米，防止闪烁。
    mesh.position.copy(vector(value.position))
      .addScaledVector(vector(value.displayNormal), .0008);
    mesh.userData.acupointCode = code;
    markerGroup.add(mesh);
    if (code) {
      pickable.push(mesh);
      addLabel(mesh.position, code);
    }
  }

  function rebuildMarkers() {
    clearLabelResources();
    markerGroup.clear();
    pickable.length = 0;

    for (const definition of DEFINITIONS) {
      const point = points[definition.code];
      if (
        point &&
        ACUPOINT_CATALOG.find(p => p.code === definition.code)?.meridian
          === activeMeridian
      ) addMarker(point, definition.code);
    }

    if (activeMeridian === 'CV' && anchors.navel && !points.CV8) addMarker(anchors.navel, null);
    if (activeMeridian === 'CV' && anchors.pubic && !points.CV2) addMarker(anchors.pubic, null);

    markerGroup.updateMatrixWorld(true);
    rebuildSurfaceLine();
    rebuildMeridianLines();
    refreshInfo();
    dirty = true;
  }

  function surfaceFromHit(
    hit: T.Intersection,
    skin: T.Mesh,
    rayDirection: T.Vector3
  ): SurfacePoint {
    if (!hit.face || hit.faceIndex == null) {
      throw new Error('没有获取到皮肤三角面。');
    }

    const attribute = skin.geometry.getAttribute('position');
    const {a, b, c} = hit.face;

    const va = new T.Vector3().fromBufferAttribute(attribute, a);
    const vb = new T.Vector3().fromBufferAttribute(attribute, b);
    const vc = new T.Vector3().fromBufferAttribute(attribute, c);
    const localPoint = skin.worldToLocal(hit.point.clone());

    const barycentric = new T.Vector3();
    const result = T.Triangle.getBarycoord(
      localPoint, va, vb, vc, barycentric
    );
    if (!result || !Number.isFinite(barycentric.x)) {
      throw new Error('皮肤三角面无法计算面内坐标。');
    }

    const normal = hit.face.normal.clone().applyNormalMatrix(
      new T.Matrix3().getNormalMatrix(skin.matrixWorld)
    ).normalize();

    // 仅决定显示偏移方向，不声称已校验全网格法线朝向。
    if (normal.dot(rayDirection) > 0) normal.negate();

    return {
      position: tuple(hit.point),
      displayNormal: tuple(normal),
      faceIndex: hit.faceIndex,
      vertexIndices: [a, b, c],
      barycentric: tuple(barycentric),
      meshId: 'FJ2810'
    };
  }

  function validateAbdominalPoint(point: SurfacePoint) {
    const [x, y, z] = point.position;
    // 以下为防止误点到头、腿、背部的工程范围，并非穴位标准。
    if (Math.abs(x) > .06 || y < .72 || y > 1.30 || z < -.01) {
      throw new Error('这两个基准只能选在前側腹部正中区域，请回到正面放大后拾取。');
    }
  }

  function validateAnchors() {
    if (!anchors.navel || !anchors.pubic) {
      throw new Error('请先拾取脐中和耻骨联合上缘体表对应点。');
    }

    const navel = vector(anchors.navel.position);
    const pubic = vector(anchors.pubic.position);
    const height = navel.y - pubic.y;

    // 宽松的输入合理性检查，不是医学准确性认证。
    if (height < .07 || height > .40) {
      throw new Error('两基准的高度差异常，请检查是否误选或选反。');
    }
    if (Math.abs(navel.x - pubic.x) > .03) {
      throw new Error('两个基准横向偏差过大，请核对前正中线。');
    }
    return {navel, pubic};
  }

  function projectAt(
    navel: T.Vector3,
    pubic: T.Vector3,
    downCun: number
  ): SurfacePoint {
    const skin = getSkin();
    if (!skin) throw new Error('请先显示体表。');

    const target = navel.clone().lerp(pubic, downCun / 5);
    const origin = new T.Vector3(
      target.x, target.y, skinPart!.bounds[1][2] + .20
    );
    const direction = new T.Vector3(0, 0, -1);
    const ray = new T.Raycaster(origin, direction, 0, 1);
    skin.updateMatrixWorld(true);

    const hit = ray.intersectObject(skin, false)[0];
    if (!hit) {
      throw new Error('部分位置没有命中皮肤；未保存此次生成，请检查基准。');
    }

    // 避免误投到其他前突部位或穿过孔洞落到背部。
    if (Math.abs(hit.point.z - target.z) > .05) {
      throw new Error('部分投影深度异常；未保存此次生成，请逐点检查该区域。');
    }

    const point = surfaceFromHit(hit, skin, direction);
    validateAbdominalPoint(point);
    return point;
  }

  function generate() {
    if (!available) throw new Error('请显示体表，并退出展开和隔离模式。');
    if (Object.keys(points).length &&
        !window.confirm('重新生成会覆盖这七穴的现有草稿，可随后撤销。继续吗？')) {
      return;
    }

    const {navel, pubic} = validateAnchors();
    const next: Record<string, StoredPoint> = {};

    // 全部求交成功后才提交，避免出现半套数据。
    for (const definition of ABDOMINAL_DEFINITIONS) {
      const surface = definition.code === 'CV8'
        ? anchors.navel!
        : definition.code === 'CV2'
          ? anchors.pubic!
          : projectAt(navel, pubic, definition.downCun);

      next[definition.code] = {
        ...surface,
        method: definition.code === 'CV2' || definition.code === 'CV8'
          ? 'manual-surface-pick' : 'regional-projection',
        status: 'pending-review'
      };
    }

    remember();
    points = {...points, ...next};
    armed = null;
    rebuildMarkers();

    if (persist()) {
      message('七个穴位草稿已生成并保存。请逐点核对；尚未通过专业复核。');
    }
  }

  function exportData() {
    const exported = {
      ...snapshot(),
      exportedAt: new Date().toISOString(),
      coordinateSystem: {
        units: 'meter',
        positiveX: 'subject-left',
        positiveY: 'superior',
        positiveZ: 'anterior'
      },
      algorithm: {
        region: 'CV2-CV8-only; other points use manual surface picking',
        longitudinalReferenceCun: 5,
        method: 'anchor-XY-interpolation-then-local-front-skin-raycast',
        limitation: '基准点、正中线和姿态适配均需人工核验'
      },
      definitions: DEFINITIONS,
      clinicalValidation: 'not-validated'
    };

    const blob = new Blob(
      [JSON.stringify(exported, null, 2)],
      {type:'application/json'}
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'human-atlas-acupoints-draft.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('已请求下载真实标注数据，请在浏览器下载列表检查。');
  }

  function onPanelClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('button');
    if (!button) return;

    try {
      if (button.dataset.code) {
        selected = button.dataset.code;
        armed = null;
        rebuildMarkers();
        message('已选中 ' + selected + '。');
        return;
      }

      const action = button.dataset.action;

      if (action === 'surface-line') {
        surfaceLineVisible = !surfaceLineVisible;
        button.textContent = surfaceLineVisible
          ? '七穴贴肤辅助线：开'
          : '七穴贴肤辅助线：关';
        button.setAttribute('aria-pressed',String(surfaceLineVisible));
        rebuildSurfaceLine();
    rebuildMeridianLines();
        dirty = true;
        return;
      }

      if (action === 'labels') {
        labelsVisible = !labelsVisible;
        for (const item of labelResources) {
          item.sprite.visible = labelsVisible;
        }
        button.textContent = labelsVisible ? '穴名标签：开' : '穴名标签：关';
        button.setAttribute('aria-pressed', String(labelsVisible));
        dirty = true;
        return;
      }
      if (action === 'ruler') {
        rulerEnabled = !rulerEnabled;
        if (!rulerEnabled) {
          rulerPoint1 = null;
          rulerPoint2 = null;
          clearRuler();
        }
        button.textContent = rulerEnabled ? '尺子测量：开（点击2点）' : '尺子测量：关';
        button.setAttribute('aria-pressed', String(rulerEnabled));
        message(rulerEnabled ? '尺子模式已开启：点击皮肤表面2个点，测量距离（cm和寸）。' : '尺子模式已关闭。');
        dirty = true;
        return;
      }
      if (action === 'ruler-clear') {
        rulerPoint1 = null;
        rulerPoint2 = null;
        clearRuler();
        message('尺子测量已清除。');
        dirty = true;
        return;
      }

      if (action === 'delete-point') {
        if (!points[selected]) {
          message('当前穴位尚未标注，无需删除。');
          return;
        }

        remember();
        const next = {...points};
        delete next[selected];
        points = next;
        armed = null;
        rebuildMarkers();

        if (persist()) {
          message('已删除 ' + selected +
            ' 的圆点，基准仍保留；可撤销或重新生成。');
        }
        return;
      }

      if (action === 'clear-navel' || action === 'clear-pubic') {
        const key: AnchorKey =
          action === 'clear-navel' ? 'navel' : 'pubic';

        if (!anchors[key]) {
          message('该基准尚未设置。');
          return;
        }

        if (!window.confirm(
          '清除基准会同时清除依赖它的七穴草稿，可随后撤销。继续吗？'
        )) return;

        remember();
        const next = {...anchors};
        delete next[key];
        anchors = next;
        points = withoutAbdominalPoints(points);
        armed = null;
        rebuildMarkers();

        if (persist()) message('基准和依赖的七穴草稿已清除。');
        return;
      }

      if (action === 'restore-seed') {
        if (!window.confirm(
          '恢复项目内置CV2—CV8七穴，保留其他穴位。可随后撤销。'
        )) return;

        remember();
        loadProjectSeed();
        armed = null;
        rebuildMarkers();

        if (persist()) message('已恢复你此次导出的七穴位置，仍标记待复核。');
        return;
      }

      if (action === 'navel' || action === 'pubic') {
        if (!available) throw new Error('请先显示体表，并退出展开和隔离模式。');
        armed = action;
        message(action === 'navel'
          ? '拾取模式：放大正面腹部，点击脐窝中央。'
          : '拾取模式：点击已确认的耻骨联合上缘体表对应点。');
      } else if (action === 'cancel') {
        armed = null;
        message('已取消拾取，恢复普通观察。');
      } else if (action === 'generate') {
        generate();
      } else if (action === 'adjust') {
        if (!available) throw new Error('请先显示体表，并退出展开和隔离模式。');
        if (selected === 'CV8' || selected === 'CV2') {
          armed = selected === 'CV8' ? 'navel' : 'pubic';
          message('调整端点会更新对应基准并清除七穴旧结果；之后重新生成。');
        } else {
          armed = selected;
          message('调整 ' + selected + '：点击该穴在皮肤上的新位置。');
        }
      } else if (action === 'save') {
        if (persist()) {
          exportData();
          message('✅ 已保存到浏览器本地，并下载了JSON备份文件。');
        } else {
          message('保存失败，请使用导出JSON备份。');
        }
      } else if (action === 'export') {
        exportData();
      } else if (action === 'undo') {
        const previous = history.pop();
        if (!previous) {
          message('没有可撤销的修改。');
          return;
        }
        const saved = JSON.parse(previous) as SavedData;
        anchors = saved.anchors;
        points = saved.points;
        armed = null;
        rebuildMarkers();
        if (persist()) message('已撤销上次修改。');
      }
    } catch (error) {
      message(error instanceof Error ? error.message : String(error));
    }
  }

  panel.addEventListener('click', onPanelClick);
  rebuildMarkers();

  return {
    toggleRuler(): boolean {
      rulerEnabled = !rulerEnabled;
      if (!rulerEnabled) {
        rulerPoint1 = null;
        rulerPoint2 = null;
        clearRuler();
      }
      updateRuler();
      dirty = true;
      return rulerEnabled;
    },
    isRulerEnabled(): boolean {
      return rulerEnabled;
    },
    clearRulerPoints() {
      rulerPoint1 = null;
      rulerPoint2 = null;
      clearRuler();
      dirty = true;
    },
    pick(raycaster: T.Raycaster): boolean {
      if (!available || disposed) return false;

      const skin = getSkin();
      if (!skin) return false;
      skin.updateMatrixWorld(true);

      if (armed) {
        const hit = raycaster.intersectObject(skin, false)[0];
        if (!hit) {
          message('没有命中皮肤，请点击人体表面，或取消拾取。');
          return true;
        }

        try {
          const surface = surfaceFromHit(hit, skin, raycaster.ray.direction);
          if (armed === 'navel' || armed === 'pubic') {
            validateAbdominalPoint(surface);
          }

          if (armed === 'navel' || armed === 'pubic') {
            if (Object.keys(points).length &&
                !window.confirm('更改基准会清除七穴旧结果，可随后撤销。继续吗？')) {
              return true;
            }

            remember();
            anchors = {...anchors, [armed]: surface};
            points = withoutAbdominalPoints(points);
          } else {
            remember();
            points = {
              ...points,
              [armed]: {
                ...surface,
                method:'manual-surface-pick',
                status:'pending-review'
              }
            };
          }

          armed = null;
          rebuildMarkers();
          if (persist()) message('已拾取并保存皮肤位置，状态为待复核。');
        } catch (error) {
          message(error instanceof Error ? error.message : String(error));
        }
        return true;
      }

      // 尺子测量模式
      if (rulerEnabled) {
        const skin = getSkin();
        if (!skin) return false;
        const skinHit = raycaster.intersectObject(skin, false)[0];
        if (!skinHit) return false;
        const point = skinHit.point.clone();
        if (!rulerPoint1 || (rulerPoint1 && rulerPoint2)) {
          // 开始新的测量
          rulerPoint1 = point;
          rulerPoint2 = null;
          message('尺子：已记录第1点，再点击第2点测量距离。');
        } else {
          rulerPoint2 = point;
          const distM = rulerPoint1.distanceTo(rulerPoint2);
          const distCm = distM * 100;
          const distCun = distCm / 2.19;
          message('尺子：距离 = ' + distCm.toFixed(1) + 'cm = ' + distCun.toFixed(2) + '寸。再点击开始新测量。');
        }
        updateRuler();
        dirty = true;
        return true;
      }
      markerGroup.updateMatrixWorld(true);
      const markerHit = raycaster.intersectObjects(pickable, false)[0];
      if (!markerHit) return false;

      const skinHit = raycaster.intersectObject(skin, false)[0];
      if (skinHit && markerHit.distance > skinHit.distance + .005) return false;

      const code = markerHit.object.userData.acupointCode;
      if (typeof code === 'string') {
        selected = code;
        rebuildMarkers();
        message('已选中 ' + selected + '；此位置仍待复核。');
        return true;
      }
      return false;
    },

    update(sceneAssembled: boolean): boolean {
      const next = sceneAssembled && !!getSkin();
      if (available !== next) {
        available = next;
        markerGroup.visible = next;
        rebuildSurfaceLine();
    rebuildMeridianLines();
        if (!next) armed = null;
        element('status').textContent = next
          ? '皮肤拾取可用。先选择基准按钮，再点击皮肤。'
          : '暂停：请显示体表，保持展开0%，并退出单结构隔离。';
        dirty = true;
      }

      if (!element('status').textContent) {
        element('status').textContent = '等待皮肤模型加载或显示。';
      }

      const changed = dirty;
      dirty = false;
      return changed;
    },

    dispose() {
      disposed = true;
      clearRuler();
      scene.remove(rulerGroup);
      rulerLineMaterial.dispose();
      rulerPointMaterial.dispose();
      rulerPointGeometry.dispose();
      panel.removeEventListener('click', onPanelClick);
      meridianSelect.removeEventListener('change',onMeridianChange);
      clearSurfaceLine();
      scene.remove(surfaceLineGroup);
      surfaceLineMaterial.dispose();
      clearMeridianLines();
      scene.remove(meridianLineGroup);
      panel.remove();
      style.remove();
      scene.remove(markerGroup);
      clearLabelResources();
      markerGroup.clear();
      pointGeometry.dispose();
      anchorGeometry.dispose();
      pointMaterial.dispose();
      selectedMaterial.dispose();
      anchorMaterial.dispose();
    }
  };
}
