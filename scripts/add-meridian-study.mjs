import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const changes = new Map();

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function replaceOnce(text, before, after, label) {
  const count = text.split(before).length - 1;
  if (count !== 1) {
    throw new Error(
      `${label}：预期匹配 1 处，实际 ${count} 处。` +
      '未写入修改；请检查是否已经运行过脚本，或原文件是否不同。'
    );
  }
  return text.replace(before, after);
}

if (!fs.existsSync(path.join(root, 'app/meridian-study.tsx'))) {
  throw new Error('请先创建 app/meridian-study.tsx');
}

/* 1. 为原场景状态增加可选经络设置。 */
let anatomy = read('app/anatomy.ts');
anatomy = replaceOnce(
  anatomy,
  'export interface SceneState {',
  'export interface SceneState {study?: import("./meridian-study").MeridianSettings;',
  'SceneState'
);
changes.set('app/anatomy.ts', anatomy);

/* 2. 将经络加入原 Three.js 场景、动画循环及清理流程。 */
let scene = read('app/scene.tsx');

scene =
  "import {assetURL,createMeridianLayer} from './meridian-study';\n" +
  scene;

scene = replaceOnce(
  scene,
  'camera.position.set(1.4,1.05,3.6);',
  'const meridianLayer=createMeridianLayer(scene,atlas);\n' +
  '  camera.position.set(1.4,1.05,3.6);',
  '初始化经络图层'
);

scene = replaceOnce(
  scene,
  'fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal})',
  'fetch(assetURL(compressed?chunk.gzip!:chunk.url),{signal:abort.signal})',
  '模型资源路径'
);

scene = replaceOnce(
  scene,
  'if(dirty){renderer.render(scene,camera);',
  'if(meridianLayer.update(s.study,ready&&amount<.001&&s.explode<.001&&!s.isolate,dt))dirty=true;\n' +
  '   if(dirty){renderer.render(scene,camera);',
  '经络动画'
);

scene = replaceOnce(
  scene,
  'observer.disconnect();controls.dispose();',
  'observer.disconnect();controls.dispose();meridianLayer.dispose();',
  '经络资源清理'
);

changes.set('app/scene.tsx', scene);

/* 3. 增加中文面板，保留原有解剖学习界面。 */
let page = read('app/page.tsx');

page =
  "import {assetURL,DEFAULT_STUDY,MeridianPanel} from './meridian-study';\n" +
  page;

page = replaceOnce(
  page,
  'export default function Home(){',
  'export default function Home(){\n' +
  ' const [study,setStudy]=useState(DEFAULT_STUDY);',
  '经络设置状态'
);

page = replaceOnce(
  page,
  "fetch('/models/atlas.json',{signal:abort.signal})",
  "fetch(assetURL('models/atlas.json'),{signal:abort.signal})",
  '模型索引路径'
);

page = replaceOnce(
  page,
  'state={{...state,inspectorOpen:details&&selectedParts.length>0}}',
  'state={{...state,study,inspectorOpen:details&&selectedParts.length>0}}',
  '向场景传递经络设置'
);

page = replaceOnce(
  page,
  '<div className="vignette"/>',
  `<div className="vignette"/>
  {!details&&!about&&panel===null&&<MeridianPanel
    settings={study}
    onChange={setStudy}
    suspended={state.explode>.001||state.isolate}
    onReference={()=>{
      setDetails(false);
      setChosen(null);
      setState(s=>({
        ...s,
        visible:['integumentary','skeletal'],
        selected:[],
        isolate:false,
        explode:0,
        view:'front',
        rotate:false,
        reset:s.reset+1
      }));
    }}
  />}`,
  '中文经络面板'
);

page = replaceOnce(
  page,
  '<h1>Human Atlas<Badge',
  '<h1>经络研习<Badge',
  '网页主标题'
);

changes.set('app/page.tsx', page);

/* 4. 使用相对构建路径，兼容 GitHub Pages 仓库子目录。 */
let vite = read('vite.config.ts');

vite = replaceOnce(
  vite,
  'defineConfig({root:',
  "defineConfig({base:'./',root:",
  'Vite 发布路径'
);

changes.set('vite.config.ts', vite);

/* 5. 保留原署名，追加本次改造说明。 */
const attributionPath = 'public/ATTRIBUTION.md';
let attribution = read(attributionPath);
attribution += `
## Meridian study prototype adaptation

This adaptation adds a Chinese meridian study panel and independently
toggleable Three.js curves with direction indicators.
The meridian coordinates are unverified schematic teaching data, not
part of the original BodyParts3D dataset and not clinical point locations.
Internal pathways, several branches, and acupuncture points are not represented.
The original anatomy attribution and license notices are retained.
`;
changes.set(attributionPath, attribution);

/*
 * 所有匹配检查通过后，先完整备份待修改文件，再进行写入。
 * 备份放在项目旁边，避免被构建或类型检查误扫描。
 */
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(
  path.dirname(root),
  `human-atlas-backup-${stamp}`
);

for (const relative of changes.keys()) {
  const destination = path.join(backup, relative);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.copyFileSync(path.join(root, relative), destination);
}

for (const [relative, content] of changes) {
  fs.writeFileSync(path.join(root, relative), content, 'utf8');
}

console.log('经络原型已接入。');
console.log(`原文件备份：${backup}`);
console.log('下一步运行 npm.cmd ci，然后 npm.cmd run dev。');