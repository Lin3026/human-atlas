import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const editorFile = path.join(root, 'app/acupoint-editor.ts');
const seedFile = path.join(root, 'app/acupoint-seed.ts');
const jsonFile = path.join(root, 'renmai-CV2-CV8-draft.json');
const marker = '// acupoint-display-upgrade-v1';

if (!fs.existsSync(jsonFile)) {
  throw new Error(
    '请先把导出的 renmai-CV2-CV8-draft.json 复制到项目根目录。'
  );
}

let source = fs.readFileSync(editorFile, 'utf8');

if (source.includes(marker) || fs.existsSync(seedFile)) {
  throw new Error('检测到这次更新已经安装，未重复修改。');
}

const draft = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
const atlas = JSON.parse(
  fs.readFileSync(path.join(root, 'public/models/atlas.json'), 'utf8')
);
const skin = atlas.parts.find(p => p.id === 'FJ2810');

if (!skin) throw new Error('当前模型没有 FJ2810 皮肤部件。');

const modelKey = JSON.stringify([
  atlas.version, skin.id,
  skin.vertexCount, skin.indexCount, skin.bounds
]);

if (draft.schema !== 1 || draft.modelKey !== modelKey) {
  throw new Error('导出数据与当前模型版本不匹配，未安装。');
}

function validateSurface(point, label) {
  const vector = value =>
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(n => typeof n === 'number' && Number.isFinite(n));

  if (
    !point ||
    point.meshId !== 'FJ2810' ||
    !vector(point.position) ||
    !vector(point.displayNormal) ||
    !vector(point.barycentric) ||
    !vector(point.vertexIndices) ||
    !Number.isInteger(point.faceIndex) ||
    point.faceIndex < 0 ||
    point.faceIndex >= skin.indexCount / 3 ||
    point.vertexIndices.some(
      n => !Number.isInteger(n) || n < 0 || n >= skin.vertexCount
    )
  ) {
    throw new Error(label + ' 的皮肤标注数据无效。');
  }

  const sum = point.barycentric.reduce((a, b) => a + b, 0);
  if (
    Math.abs(sum - 1) > 0.001 ||
    point.barycentric.some(n => n < -0.001 || n > 1.001)
  ) {
    throw new Error(label + ' 的三角面内坐标异常。');
  }
}

validateSurface(draft.anchors?.navel, '脐中');
validateSurface(draft.anchors?.pubic, '耻骨基准');

const seed = {
  schema: 1,
  modelKey,
  standard: 'GB/T 12346—2021',
  anchors: draft.anchors,
  points: {}
};

for (let number = 2; number <= 8; number++) {
  const code = 'CV' + number;
  const point = draft.points?.[code];
  validateSurface(point, code);

  seed.points[code] = {
    ...point,
    status: 'pending-review'
  };
}

function replaceOnce(before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(
      label + '：预期匹配1处，实际' + count +
      '处。未写入修改，请保留报错信息。'
    );
  }
  source = source.replace(before, after);
}

/* 1. 点稍微放大，只改变显示大小，不改变保存坐标。 */

replaceOnce(
  "new T.SphereGeometry(.003, 14, 10)",
  "new T.SphereGeometry(.004, 14, 10)",
  '穴位显示大小'
);

/* 2. 为标签配置独立资源管理。 */

replaceOnce(
  'const pickable: T.Mesh[] = [];',
  `const pickable: T.Mesh[] = [];
  let labelsVisible = true;
  const labelResources: {
    texture: T.CanvasTexture;
    material: T.SpriteMaterial;
    sprite: T.Sprite;
  }[] = [];

  function clearLabelResources() {
    for (const item of labelResources) {
      item.texture.dispose();
      item.material.dispose();
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

    context.fillStyle = 'rgba(255,254,247,0.96)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = code === selected ? '#cf861c' : '#b84b3a';
    context.lineWidth = 5;
    context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

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
    // 与红点错开，避免挡住皮肤上的实际标记。
    sprite.position.copy(position);
    sprite.position.x += .047;
    sprite.position.z += .008;
    sprite.scale.set(.074, .013875, 1);
    sprite.visible = labelsVisible;
    sprite.renderOrder = 12;

    markerGroup.add(sprite);
    labelResources.push({texture, material, sprite});
  }`,
  '标签资源'
);

/* 3. 增加清除、恢复和标签开关。 */

replaceOnce(
  '<button data-action="cancel">取消拾取</button>',
  '<button data-action="cancel">退出拾取模式</button>',
  '退出拾取按钮'
);

replaceOnce(
  "'<button data-action=\"undo\">撤销上次修改</button>',",
  `'<button data-action="undo">撤销上次修改</button>',
    '<h3>显示与数据管理</h3>',
    '<button data-action="labels" aria-pressed="true">穴名标签：开</button>',
    '<button data-action="delete-point">删除当前穴位</button>',
    '<button data-action="clear-navel">清除脐中基准</button>',
    '<button data-action="clear-pubic">清除耻骨基准</button>',
    '<button data-action="restore-seed">恢复项目内置七穴</button>',`,
  '管理按钮'
);

/* 4. 先载入项目数据，再用有效的浏览器保存记录覆盖。
 * 浏览器中的主动清空也会保留，不在刷新时偷偷重新填上。
 */

replaceOnce(
  "  try {\n    const raw = localStorage.getItem(storageKey);",
  `  function loadProjectSeed() {
    const saved = PROJECT_ACUPOINT_SEED as unknown as SavedData;
    if (saved.modelKey !== modelKey) {
      throw new Error('项目内置穴位与模型版本不一致。');
    }

    const nextAnchors: Partial<Record<AnchorKey, SurfacePoint>> = {};
    const nextPoints: Record<string, StoredPoint> = {};

    for (const key of ['navel', 'pubic'] as AnchorKey[]) {
      const value = saved.anchors[key];
      if (!validSurface(value)) throw new Error('项目基准数据无效。');
      nextAnchors[key] = JSON.parse(JSON.stringify(value));
    }

    for (const definition of DEFINITIONS) {
      const value = saved.points[definition.code];
      if (!validSurface(value)) throw new Error('项目穴位数据无效。');
      nextPoints[definition.code] = {
        ...JSON.parse(JSON.stringify(value)),
        status: 'pending-review'
      };
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
    const raw = localStorage.getItem(storageKey);`,
  '项目内置数据'
);

/* 5. 重建点时同时重建标签，并清理旧贴图。 */

replaceOnce(
  'if (code) pickable.push(mesh);',
  `if (code) {
      pickable.push(mesh);
      addLabel(mesh.position, code);
    }`,
  '添加标签'
);

replaceOnce(
  'function rebuildMarkers() {\n    markerGroup.clear();',
  'function rebuildMarkers() {\n    clearLabelResources();\n    markerGroup.clear();',
  '重建标签清理'
);

/* 6. 清除操作全部支持本轮撤销。 */

replaceOnce(
  "      const action = button.dataset.action;",
  `      const action = button.dataset.action;

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
        points = {};
        armed = null;
        rebuildMarkers();

        if (persist()) message('基准和依赖的七穴草稿已清除。');
        return;
      }

      if (action === 'restore-seed') {
        if (!window.confirm(
          '用项目内置数据覆盖本浏览器的当前草稿？可随后撤销。'
        )) return;

        remember();
        loadProjectSeed();
        armed = null;
        rebuildMarkers();

        if (persist()) message('已恢复你此次导出的七穴位置，仍标记待复核。');
        return;
      }`,
  '管理操作'
);

/* 7. 有浏览器存储时，优先使用其有效内容，而不是与种子混合。 */

replaceOnce(
  'if (saved.schema === 1 && saved.modelKey === modelKey) {',
  `if (saved.schema === 1 && saved.modelKey === modelKey) {
        anchors = {};
        points = {};`,
  '浏览器数据优先级'
);

replaceOnce(
  '      scene.remove(markerGroup);\n      markerGroup.clear();',
  '      scene.remove(markerGroup);\n      clearLabelResources();\n      markerGroup.clear();',
  '退出资源清理'
);

/* 更新说明，避免误以为标签是实际定位。 */

replaceOnce(
  '红点：穴位草稿；金点：当前穴位；',
  '红点：穴位草稿；金点：当前穴位；旁侧文字框仅为穴名标签；',
  '显示说明'
);

source =
  marker + '\n' +
  "import {PROJECT_ACUPOINT_SEED} from './acupoint-seed';\n" +
  source;

/* 所有检查通过后才备份、写入。 */

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(
  path.dirname(root),
  'human-atlas-point-display-backup-' + stamp
);
fs.mkdirSync(backup, {recursive:true});
fs.copyFileSync(editorFile, path.join(backup, 'acupoint-editor.ts'));

const seedSource =
  '// 用户导出的模型标注草稿；未经专业复核。\n' +
  'export const PROJECT_ACUPOINT_SEED = ' +
  JSON.stringify(seed, null, 2) + ';\n';

fs.writeFileSync(seedFile, seedSource, 'utf8');
fs.writeFileSync(editorFile, source, 'utf8');

console.log('更新完成：项目内置七穴、中文穴名标签、清除与恢复按钮。');
console.log('没有移动任何穴位坐标。');
console.log('备份位置：' + backup);
console.log('请执行 npm.cmd run check 和 npm.cmd run build。');