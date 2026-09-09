import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const editorPath = path.join(root, 'app/acupoint-editor.ts');
const studyPath = path.join(root, 'app/meridian-study.tsx');
const catalogPath = path.join(root, 'app/acupoint-catalog.ts');

let editor = fs.readFileSync(editorPath, 'utf8');
let study = fs.readFileSync(studyPath, 'utf8');

const marker = '// full-acupoint-catalog-v1';

if (
  editor.includes(marker) ||
  fs.existsSync(catalogPath)
) {
  throw new Error('检测到本次更新已安装，未重复修改。');
}

if (!editor.includes('PROJECT_ACUPOINT_SEED')) {
  throw new Error('请先完成上一轮“项目内置七穴、标签和清除按钮”更新。');
}

function replaceOnce(text, before, after, label) {
  const count = text.split(before).length - 1;
  if (count !== 1) {
    throw new Error(
      `${label}：预期匹配1处，实际${count}处。未写入任何修改。`
    );
  }
  return text.replace(before, after);
}

/*
 * 本文件只建立标准名称和条款索引。
 * 不把没有录入、核验的定位正文伪装为已完成资料。
 * 不产生全身穴位的猜测坐标。
 */
const catalogSource = String.raw`
export interface MeridianCatalog {
  id: string;
  name: string;
  chapter: number;
  names: string[];
}

export const MERIDIAN_CATALOG: MeridianCatalog[] = [
  {
    id:'LU', name:'手太阴肺经', chapter:1,
    names:'中府 云门 天府 侠白 尺泽 孔最 列缺 经渠 太渊 鱼际 少商'.split(' ')
  },
  {
    id:'LI', name:'手阳明大肠经', chapter:2,
    names:'商阳 二间 三间 合谷 阳溪 偏历 温溜 下廉 上廉 手三里 曲池 肘髎 手五里 臂臑 肩髃 巨骨 天鼎 扶突 口禾髎 迎香'.split(' ')
  },
  {
    id:'ST', name:'足阳明胃经', chapter:3,
    names:'承泣 四白 巨髎 地仓 大迎 颊车 下关 头维 人迎 水突 气舍 缺盆 气户 库房 屋翳 膺窗 乳中 乳根 不容 承满 梁门 关门 太乙 滑肉门 天枢 外陵 大巨 水道 归来 气冲 髀关 伏兔 阴市 梁丘 犊鼻 足三里 上巨虚 条口 下巨虚 丰隆 解溪 冲阳 陷谷 内庭 厉兑'.split(' ')
  },
  {
    id:'SP', name:'足太阴脾经', chapter:4,
    names:'隐白 大都 太白 公孙 商丘 三阴交 漏谷 地机 阴陵泉 血海 箕门 冲门 府舍 腹结 大横 腹哀 食窦 天溪 胸乡 周荣 大包'.split(' ')
  },
  {
    id:'HT', name:'手少阴心经', chapter:5,
    names:'极泉 青灵 少海 灵道 通里 阴郄 神门 少府 少冲'.split(' ')
  },
  {
    id:'SI', name:'手太阳小肠经', chapter:6,
    names:'少泽 前谷 后溪 腕骨 阳谷 养老 支正 小海 肩贞 臑俞 天宗 秉风 曲垣 肩外俞 肩中俞 天窗 天容 颧髎 听宫'.split(' ')
  },
  {
    id:'BL', name:'足太阳膀胱经', chapter:7,
    names:'睛明 攒竹 眉冲 曲差 五处 承光 通天 络却 玉枕 天柱 大杼 风门 肺俞 厥阴俞 心俞 督俞 膈俞 肝俞 胆俞 脾俞 胃俞 三焦俞 肾俞 气海俞 大肠俞 关元俞 小肠俞 膀胱俞 中膂俞 白环俞 上髎 次髎 中髎 下髎 会阳 承扶 殷门 浮郄 委阳 委中 附分 魄户 膏肓 神堂 譩譆 膈关 魂门 阳纲 意舍 胃仓 肓门 志室 胞肓 秩边 合阳 承筋 承山 飞扬 跗阳 昆仑 仆参 申脉 金门 京骨 束骨 足通谷 至阴'.split(' ')
  },
  {
    id:'KI', name:'足少阴肾经', chapter:8,
    names:'涌泉 然谷 太溪 大钟 水泉 照海 复溜 交信 筑宾 阴谷 横骨 大赫 气穴 四满 中注 肓俞 商曲 石关 阴都 腹通谷 幽门 步廊 神封 灵墟 神藏 彧中 俞府'.split(' ')
  },
  {
    id:'PC', name:'手厥阴心包经', chapter:9,
    names:'天池 天泉 曲泽 郄门 间使 内关 大陵 劳宫 中冲'.split(' ')
  },
  {
    id:'TE', name:'手少阳三焦经', chapter:10,
    names:'关冲 液门 中渚 阳池 外关 支沟 会宗 三阳络 四渎 天井 清泠渊 消泺 臑会 肩髎 天髎 天牖 翳风 瘈脉 颅息 角孙 耳门 耳和髎 丝竹空'.split(' ')
  },
  {
    id:'GB', name:'足少阳胆经', chapter:11,
    names:'瞳子髎 听会 上关 颔厌 悬颅 悬厘 曲鬓 率谷 天冲 浮白 头窍阴 完骨 本神 阳白 头临泣 目窗 正营 承灵 脑空 风池 肩井 渊腋 辄筋 日月 京门 带脉 五枢 维道 居髎 环跳 风市 中渎 膝阳关 阳陵泉 阳交 外丘 光明 阳辅 悬钟 丘墟 足临泣 地五会 侠溪 足窍阴'.split(' ')
  },
  {
    id:'LR', name:'足厥阴肝经', chapter:12,
    names:'大敦 行间 太冲 中封 蠡沟 中都 膝关 曲泉 阴包 足五里 阴廉 急脉 章门 期门'.split(' ')
  },
  {
    id:'GV', name:'督脉', chapter:13,
    names:'长强 腰俞 腰阳关 命门 悬枢 脊中 中枢 筋缩 至阳 灵台 神道 身柱 陶道 大椎 哑门 风府 脑户 强间 后顶 百会 前顶 囟会 上星 神庭 印堂 素髎 水沟 兑端 龈交'.split(' ')
  },
  {
    id:'CV', name:'任脉', chapter:14,
    names:'会阴 曲骨 中极 关元 石门 气海 阴交 神阙 水分 下脘 建里 中脘 上脘 巨阙 鸠尾 中庭 膻中 玉堂 紫宫 华盖 璇玑 天突 廉泉 承浆'.split(' ')
  }
];

const EXPECTED: Record<string, number> = {
  LU:11, LI:20, ST:45, SP:21, HT:9, SI:19, BL:67,
  KI:27, PC:9, TE:23, GB:44, LR:14, GV:29, CV:24
};

for (const meridian of MERIDIAN_CATALOG) {
  if (meridian.names.length !== EXPECTED[meridian.id]) {
    throw new Error(meridian.name + '目录数量不正确。');
  }
}

export const ACUPOINT_CATALOG = MERIDIAN_CATALOG.flatMap(meridian =>
  meridian.names.map((name, index) => {
    const ordinal = index + 1;

    // 印堂插在第25个条目，但代码是GV24+。
    // 后续素髎、水沟等保留原国际代码。
    const code = meridian.id === 'GV'
      ? ordinal === 25
        ? 'GV24+'
        : 'GV' + (ordinal > 25 ? ordinal - 1 : ordinal)
      : meridian.id + ordinal;

    return {
      code,
      name,
      meridian: meridian.id,
      clause: '5.' + meridian.chapter + '.' + ordinal
    };
  })
);

if (
  ACUPOINT_CATALOG.length !== 362 ||
  new Set(ACUPOINT_CATALOG.map(point => point.code)).size !== 362
) {
  throw new Error('经穴目录总数或代码唯一性检查失败。');
}
`;

/* ---------- 将七穴定义保留为独立的自动生成范围 ---------- */

editor = replaceOnce(
  editor,
  'const DEFINITIONS: PointDefinition[] = [',
  'const ABDOMINAL_DEFINITIONS: PointDefinition[] = [',
  '保留七穴生成范围'
);

editor = replaceOnce(
  editor,
  'function vector(value: XYZ) {',
  `const DEFINITIONS: PointDefinition[] = ACUPOINT_CATALOG.map(item => {
  const existing = ABDOMINAL_DEFINITIONS.find(p => p.code === item.code);
  return existing ?? {
    code: item.code,
    name: item.name,
    clause: item.clause,
    downCun: -1,
    text: '已收录标准名称与条款索引；本条定位正文尚未录入本面板，请查阅对应国标条款。'
  };
});

function vector(value: XYZ) {`,
  '完整穴位目录'
);

/*
 * 只修改指定函数范围内的循环，防止把362穴全部套用5寸公式。
 */
function replaceWithinFunction(
  text, functionStart, nextFunction, before, after, label
) {
  const start = text.indexOf(functionStart);
  const end = text.indexOf(nextFunction, start + functionStart.length);
  if (start < 0 || end < 0) throw new Error(label + '：函数范围不匹配。');

  const section = text.slice(start, end);
  const updated = replaceOnce(section, before, after, label);
  return text.slice(0, start) + updated + text.slice(end);
}

editor = replaceWithinFunction(
  editor,
  '  function generate() {',
  '  function exportData() {',
  'for (const definition of DEFINITIONS)',
  'for (const definition of ABDOMINAL_DEFINITIONS)',
  '限制区域自动生成'
);

editor = replaceWithinFunction(
  editor,
  '  function generate() {',
  '  function exportData() {',
  'points = next;',
  'points = {...points, ...next};',
  '生成七穴时保留其他穴位'
);

editor = replaceWithinFunction(
  editor,
  '  function loadProjectSeed() {',
  '  try {\n    loadProjectSeed();',
  'for (const definition of DEFINITIONS)',
  'for (const definition of ABDOMINAL_DEFINITIONS)',
  '内置七穴载入范围'
);

editor = replaceWithinFunction(
  editor,
  '  function loadProjectSeed() {',
  '  try {\n    loadProjectSeed();',
  'const nextPoints: Record<string, StoredPoint> = {};',
  'const nextPoints: Record<string, StoredPoint> = {...points};',
  '恢复七穴时保留其他穴位'
);

/* 更换腹部基准，只清除依赖该基准的七穴，不清掉其他区域。 */

editor = replaceOnce(
  editor,
  '  const history: string[] = [];',
  `  function withoutAbdominalPoints(
    sourcePoints: Record<string, StoredPoint>
  ): Record<string, StoredPoint> {
    const next = {...sourcePoints};
    for (const point of ABDOMINAL_DEFINITIONS) delete next[point.code];
    return next;
  }

  const history: string[] = [];`,
  '区域清除函数'
);

editor = replaceOnce(
  editor,
  'anchors = next;\n        points = {};',
  'anchors = next;\n        points = withoutAbdominalPoints(points);',
  '清除基准保留其他区域'
);

editor = replaceOnce(
  editor,
  'anchors = {...anchors, [armed]: surface};\n            points = {};',
  'anchors = {...anchors, [armed]: surface};\n            points = withoutAbdominalPoints(points);',
  '更换基准保留其他区域'
);

/* ---------- 按经脉筛选 ---------- */

editor = replaceOnce(
  editor,
  "  let selected = 'CV8';",
  `  let selected = 'CV8';
  let activeMeridian = 'CV';`,
  '当前经脉'
);

editor = replaceOnce(
  editor,
  "'<summary>穴位标定 · 下腹部任脉</summary>',",
  `'<summary>十四经穴位 · 标注与学习</summary>',
    '<h3>经脉目录</h3>',
    '<select data-role="meridian-select" aria-label="选择经脉"',
    ' style="width:100%;padding:8px;border:1px solid #cddbcf;border-radius:7px;background:white"></select>',
    '<p class="ae-small" data-role="catalog-count"></p>',`,
  '经脉选择界面'
);

editor = editor.replace(
  'GB/T 12346—2021 · CV2—CV8<br>',
  'GB/T 12346—2021 · 362个名称条目<br>'
);

editor = replaceOnce(
  editor,
  "'<button data-action=\"generate\">按5骨度分寸生成草稿</button>',",
  `'<button data-action="generate">仅生成CV2—CV8七穴草稿</button>',
    '<button data-action="surface-line" aria-pressed="true">七穴贴肤辅助线：开</button>',`,
  '连线按钮'
);

editor = replaceOnce(
  editor,
  "'<button data-action=\"adjust\">调整当前穴位</button>',",
  "'<button data-action=\"adjust\">在皮肤上标注／调整当前穴位</button>',",
  '全身标注按钮'
);

editor = replaceOnce(
  editor,
  '  const pointButtons = new Map<string, HTMLButtonElement>();',
  `  const meridianSelect =
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

  const pointButtons = new Map<string, HTMLButtonElement>();`,
  '经脉选择逻辑'
);

editor = replaceOnce(
  editor,
  "button.setAttribute('aria-pressed', String(code === selected));",
  `button.setAttribute('aria-pressed', String(code === selected));
      const meridian = ACUPOINT_CATALOG.find(p => p.code === code)?.meridian;
      button.hidden = meridian !== activeMeridian;`,
  '穴位列表筛选'
);

editor = replaceOnce(
  editor,
  "    const anchorStatus = (key: AnchorKey) =>",
  `    const group = ACUPOINT_CATALOG.filter(
      item => item.meridian === activeMeridian
    );
    const placed = group.filter(item => !!points[item.code]).length;
    element('catalog-count').textContent =
      '本经已标注 ' + placed + ' / ' + group.length +
      '；全库已标注 ' +
      DEFINITIONS.filter(item => !!points[item.code]).length +
      ' / 362。全部三维位置仍待复核。';

    const anchorStatus = (key: AnchorKey) =>`,
  '穴位进度'
);

editor = replaceOnce(
  editor,
  'if (point) addMarker(point, definition.code);',
  `if (
        point &&
        ACUPOINT_CATALOG.find(p => p.code === definition.code)?.meridian
          === activeMeridian
      ) addMarker(point, definition.code);`,
  '三维标记筛选'
);

editor = replaceOnce(
  editor,
  "if (anchors.navel && !points.CV8) addMarker(anchors.navel, null);",
  "if (activeMeridian === 'CV' && anchors.navel && !points.CV8) addMarker(anchors.navel, null);",
  '脐中基准筛选'
);

editor = replaceOnce(
  editor,
  "if (anchors.pubic && !points.CV2) addMarker(anchors.pubic, null);",
  "if (activeMeridian === 'CV' && anchors.pubic && !points.CV2) addMarker(anchors.pubic, null);",
  '耻骨基准筛选'
);

/* ---------- 全身皮肤拾取，腹部基准仍使用原输入检查 ---------- */

editor = replaceOnce(
  editor,
  "          validateAbdominalPoint(surface);",
  `          if (armed === 'navel' || armed === 'pubic') {
            validateAbdominalPoint(surface);
          }`,
  '允许全身人工皮肤拾取'
);

/* ---------- 七穴贴肤辅助线 ---------- */

editor = replaceOnce(
  editor,
  '  const pickable: T.Mesh[] = [];',
  `  let surfaceLineVisible = true;
  const surfaceLineGroup = new T.Group();
  surfaceLineGroup.name = 'CV2-CV8-surface-guide-not-full-meridian';
  scene.add(surfaceLineGroup);

  const surfaceLineMaterial = new T.LineBasicMaterial({
    color:'#bc5037',
    transparent:true,
    opacity:.9,
    depthTest:true,
    depthWrite:false
  });

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

  const pickable: T.Mesh[] = [];`,
  '创建贴肤辅助线'
);

editor = replaceOnce(
  editor,
  '    markerGroup.updateMatrixWorld(true);\n    refreshInfo();',
  '    markerGroup.updateMatrixWorld(true);\n    rebuildSurfaceLine();\n    refreshInfo();',
  '重建标记时更新连线'
);

editor = replaceOnce(
  editor,
  "      const action = button.dataset.action;",
  `      const action = button.dataset.action;

      if (action === 'surface-line') {
        surfaceLineVisible = !surfaceLineVisible;
        button.textContent = surfaceLineVisible
          ? '七穴贴肤辅助线：开'
          : '七穴贴肤辅助线：关';
        button.setAttribute('aria-pressed',String(surfaceLineVisible));
        rebuildSurfaceLine();
        dirty = true;
        return;
      }`,
  '辅助线开关'
);

editor = replaceOnce(
  editor,
  '        markerGroup.visible = next;',
  `        markerGroup.visible = next;
        rebuildSurfaceLine();`,
  '加载与暂停时更新连线'
);

editor = replaceOnce(
  editor,
  "      panel.removeEventListener('click', onPanelClick);",
  `      panel.removeEventListener('click', onPanelClick);
      meridianSelect.removeEventListener('change',onMeridianChange);
      clearSurfaceLine();
      scene.remove(surfaceLineGroup);
      surfaceLineMaterial.dispose();`,
  '资源清理'
);

/* ---------- 导出范围说明 ---------- */

editor = replaceOnce(
  editor,
  "link.download = 'renmai-CV2-CV8-draft.json';",
  "link.download = 'human-atlas-acupoints-draft.json';",
  '全库导出名称'
);

editor = replaceOnce(
  editor,
  "region: 'anterior-lower-abdomen',",
  "region: 'CV2-CV8-only; other points use manual surface picking',",
  '导出算法作用域'
);

editor = editor.replace(
  '当前工具仅标定前侧腹部正中区域，请回到正面放大后拾取。',
  '这两个基准只能选在前側腹部正中区域，请回到正面放大后拾取。'
);

editor = editor.replace(
  '本工具生成待复核草稿，不是已核验图谱。',
  '362穴目录已收录；已有坐标才显示三维标记。空目录不代表已完成定位。'
);

editor = editor.replace(
  '没有绘制完整任脉循行。',
  '七穴连线仅为贴肤辅助线，不是完整任脉循行；其他经脉未自动连线。'
);

editor = editor.replace(
  '用项目内置数据覆盖本浏览器的当前草稿？可随后撤销。',
  '恢复项目内置CV2—CV8七穴，保留其他穴位。可随后撤销。'
);

editor = marker + '\n' +
  "import {ACUPOINT_CATALOG,MERIDIAN_CATALOG} from './acupoint-catalog';\n" +
  editor;

/* 默认不再展示旧示意经络，仍可手动打开比较。 */
study = replaceOnce(
  study,
  "visible: ['LU'],",
  "visible: [],",
  '关闭默认旧示意经络'
);

study = study.replace(
  '十二经络 · 示意',
  '旧经络示意 · 未校准'
);

/* ---------- 备份后写入 ---------- */

const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const backup = path.join(
  path.dirname(root),
  'human-atlas-catalog-backup-' + stamp
);

fs.mkdirSync(backup,{recursive:true});
fs.copyFileSync(editorPath,path.join(backup,'acupoint-editor.ts'));
fs.copyFileSync(studyPath,path.join(backup,'meridian-study.tsx'));

fs.writeFileSync(catalogPath,catalogSource,'utf8');
fs.writeFileSync(editorPath,editor,'utf8');
fs.writeFileSync(studyPath,study,'utf8');

console.log('更新完成：');
console.log('1. 十四经362穴名称和条款目录');
console.log('2. 分经筛选与标注进度');
console.log('3. CV2—CV8皮肤采样辅助线');
console.log('4. 全身皮肤人工标注入口');
console.log('5. 默认关闭旧示意经络');
console.log('原七穴坐标未移动。备份：' + backup);
console.log('请运行 npm.cmd run check 和 npm.cmd run build。');