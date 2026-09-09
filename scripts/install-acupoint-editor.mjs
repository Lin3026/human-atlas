import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const scenePath = path.join(root, 'app', 'scene.tsx');
const modulePath = path.join(root, 'app', 'acupoint-editor.ts');
const marker = '// acupoint-editor-install-v1';

let sceneSource = fs.readFileSync(scenePath, 'utf8');

if (sceneSource.includes(marker) || fs.existsSync(modulePath)) {
  throw new Error('检测到穴位编辑器已经安装，未重复修改。');
}

function replaceOnce(text, before, after, label) {
  const count = text.split(before).length - 1;
  if (count !== 1) {
    throw new Error(
      label + '：应匹配1处，实际匹配' + count +
      '处。未修改项目，请保留此提示。'
    );
  }
  return text.replace(before, after);
}

/*
 * 不替换原场景，只在拾取、渲染和清理位置接入独立模块。
 */
sceneSource = replaceOnce(
  sceneSource,
  'const clock=new T.Clock();',
  `const acupointEditor=createAcupointEditor(el,scene,atlas,()=>{
    const index=atlas.parts.findIndex(p=>p.id==='FJ2810');
    if(index<0||data[index*4+3]<.5)return undefined;
    return pickers[index];
  });
  const clock=new T.Clock();`,
  '编辑器初始化'
);

sceneSource = replaceOnce(
  sceneSource,
  'let nearest=Infinity,found=-1;',
  `if(acupointEditor.pick(raycaster))return;
   let nearest=Infinity,found=-1;`,
  '穴位拾取'
);

sceneSource = replaceOnce(
  sceneSource,
  'if(dirty){renderer.render(scene,camera);',
  `if(acupointEditor.update(
      ready&&amount<.001&&s.explode<.001&&!s.isolate
    ))dirty=true;
   if(dirty){renderer.render(scene,camera);`,
  '穴位显示更新'
);

sceneSource = replaceOnce(
  sceneSource,
  'observer.disconnect();controls.dispose();',
  'observer.disconnect();controls.dispose();acupointEditor.dispose();',
  '编辑器资源清理'
);

sceneSource =
  marker + '\n' +
  "import {createAcupointEditor} from './acupoint-editor';\n" +
  sceneSource;

const editorSource = String.raw`
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

const DEFINITIONS: PointDefinition[] = [
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
  let available = false;
  let dirty = true;
  let disposed = false;

  const markerGroup = new T.Group();
  markerGroup.name = 'acupoint-drafts-pending-review';
  markerGroup.visible = false;
  scene.add(markerGroup);

  const pointGeometry = new T.SphereGeometry(.003, 14, 10);
  const anchorGeometry = new T.SphereGeometry(.004, 14, 10);

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

  const pickable: T.Mesh[] = [];

  const style = document.createElement('style');
  style.textContent = [
    '.ae-panel{position:absolute;left:350px;top:160px;z-index:26;',
    'width:292px;max-height:calc(100dvh - 330px);overflow:auto;',
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
    '@media(max-width:1100px){.ae-panel{left:300px;top:150px;width:260px;}}',
    '@media(max-width:767px){.ae-panel{left:10px;top:110px;',
    'width:min(290px,calc(100vw - 65px));max-height:43dvh;}}'
  ].join('');
  host.appendChild(style);

  const panel = document.createElement('section');
  panel.className = 'ae-panel';
  panel.setAttribute('aria-label', '任脉穴位标定工具');
  panel.innerHTML = [
    '<details open>',
    '<summary>穴位标定 · 下腹部任脉</summary>',
    '<p class="ae-small">GB/T 12346—2021 · CV2—CV8<br>',
    '本工具生成待复核草稿，不是已核验图谱。</p>',
    '<div class="ae-status" data-role="status"></div>',
    '<h3>① 标定两个基准</h3>',
    '<button data-action="navel">拾取脐中</button>',
    '<button data-action="pubic">拾取耻骨上缘体表点</button>',
    '<button data-action="cancel">取消拾取</button>',
    '<div class="ae-small" data-role="anchors"></div>',
    '<p class="ae-small">先通过解剖参考确认耻骨联合上缘，',
    '再回到皮肤拾取对应点。不要把生殖器根部或阴毛边界当作该标志。</p>',
    '<h3>② 生成并逐点检查</h3>',
    '<button data-action="generate">按5骨度分寸生成草稿</button>',
    '<div class="ae-list" data-role="list"></div>',
    '<div class="ae-card" data-role="info"></div>',
    '<button data-action="adjust">调整当前穴位</button>',
    '<button data-action="export">导出标注JSON</button>',
    '<button data-action="undo">撤销上次修改</button>',
    '<p class="ae-message" data-role="message" role="status"></p>',
    '<p class="ae-small">红点：穴位草稿；金点：当前穴位；',
    '蓝绿点：尚未生成穴位时的基准。旋转不会误记为点击。</p>',
    '<p class="ae-small">自动生成采用基准间的纵向折量和局部皮肤投影。',
    '正中线暂按两基准的X/Y连线处理，需要检查模型的实际正中线。',
    '没有绘制完整任脉循行。</p>',
    '</details>'
  ].join('');
  host.appendChild(panel);

  function element(role: string) {
    return panel.querySelector<HTMLElement>('[data-role="' + role + '"]')!;
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

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const saved = JSON.parse(raw) as SavedData;
      if (saved.schema === 1 && saved.modelKey === modelKey) {
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
      const definition = DEFINITIONS.find(item => item.code === code)!;
      button.textContent =
        (points[code] ? '● ' : '○ ') + definition.name + ' ' + code;
    }

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
    if (code) pickable.push(mesh);
  }

  function rebuildMarkers() {
    markerGroup.clear();
    pickable.length = 0;

    for (const definition of DEFINITIONS) {
      const point = points[definition.code];
      if (point) addMarker(point, definition.code);
    }

    if (anchors.navel && !points.CV8) addMarker(anchors.navel, null);
    if (anchors.pubic && !points.CV2) addMarker(anchors.pubic, null);

    markerGroup.updateMatrixWorld(true);
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
      throw new Error('当前工具仅标定前侧腹部正中区域，请回到正面放大后拾取。');
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
    for (const definition of DEFINITIONS) {
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
    points = next;
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
        region: 'anterior-lower-abdomen',
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
    link.download = 'renmai-CV2-CV8-draft.json';
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
          validateAbdominalPoint(surface);

          if (armed === 'navel' || armed === 'pubic') {
            if (Object.keys(points).length &&
                !window.confirm('更改基准会清除七穴旧结果，可随后撤销。继续吗？')) {
              return true;
            }

            remember();
            anchors = {...anchors, [armed]: surface};
            points = {};
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
      panel.removeEventListener('click', onPanelClick);
      panel.remove();
      style.remove();
      scene.remove(markerGroup);
      markerGroup.clear();
      pointGeometry.dispose();
      anchorGeometry.dispose();
      pointMaterial.dispose();
      selectedMaterial.dispose();
      anchorMaterial.dispose();
    }
  };
}
`;

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(
  path.dirname(root),
  'human-atlas-acupoint-backup-' + stamp
);

fs.mkdirSync(backup, {recursive:true});
fs.copyFileSync(scenePath, path.join(backup, 'scene.tsx'));

fs.writeFileSync(modulePath, editorSource, 'utf8');
fs.writeFileSync(scenePath, sceneSource, 'utf8');

console.log('穴位皮肤标注工具已写入。');
console.log('备份位置：' + backup);
console.log('新增：app/acupoint-editor.ts');
console.log('修改：app/scene.tsx');
console.log('下一步执行 npm.cmd run check 与 npm.cmd run build。');
console.log('没有修改模型文件，也没有生成已复核穴位坐标。');