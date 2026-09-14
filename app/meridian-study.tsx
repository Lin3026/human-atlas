import {StudyLibrary} from './study-library';
import {useState} from 'react';
import * as T from 'three';
import type {Atlas} from './anatomy';

/* ---------- 数据与类型 ---------- */

type Point3 = [number, number, number];

export interface MeridianSettings {
  visible: string[];
  bilateral: boolean;
  flow: boolean;
  xray: boolean;
}

interface Meridian {
  id: string;
  name: string;
  color: string;
  direction: string;
  note: string;
  points: Point3[];
}

/**
 * 未校准的体表主干演示数据。
 * 坐标以身高约 1.75 的模板为基础，不是标准穴位坐标。
 * 数组顺序表示该演示线的方向；未绘制体内循行及全部分支。
 */
export const MERIDIANS: Meridian[] = [
  {
    id: 'LU',
    name: '手太阴肺经',
    color: '#d49420',
    direction: '胸 → 上肢内侧前缘 → 拇指',
    note: '体表主干沿上肢内侧前缘向手部行进；完整循行还包括体内路线及通向食指的分支。',
    points: [
      [.13,1.40,.12],[.20,1.36,.10],[.25,1.24,.08],
      [.28,1.10,.07],[.31,.96,.065],[.34,.84,.07],[.37,.78,.08]
    ]
  },
  {
    id: 'LI',
    name: '手阳明大肠经',
    color: '#d96343',
    direction: '食指 → 上肢外侧前缘 → 肩颈 → 对侧鼻旁',
    note: '完整路线在面部有交叉；当前左右镜像示意没有复现面部交叉及全部分支。',
    points: [
      [.39,.76,.04],[.35,.85,.035],[.32,1.00,.02],
      [.29,1.16,.02],[.23,1.40,.02],[.13,1.46,.06],
      [.07,1.52,.09],[.04,1.61,.105]
    ]
  },
  {
    id: 'ST',
    name: '足阳明胃经',
    color: '#bb7624',
    direction: '面部 → 胸腹前面 → 下肢前外侧 → 第二趾',
    note: '此处仅画一条简化体表主干，未完整绘制头面部路线、腹部支线及足背分支。',
    points: [
      [.035,1.63,.11],[.075,1.57,.10],[.07,1.46,.10],
      [.13,1.37,.14],[.11,1.20,.14],[.06,1.02,.13],
      [.14,.88,.11],[.15,.65,.095],[.14,.48,.085],
      [.13,.25,.065],[.12,.08,.12],[.11,.035,.20]
    ]
  },
  {
    id: 'SP',
    name: '足太阴脾经',
    color: '#978124',
    direction: '大趾 → 下肢内侧 → 腹胸部',
    note: '下肢内侧的经脉相对位置随部位变化；当前曲线未按这些解剖关系逐点校准。',
    points: [
      [.075,.035,.20],[.07,.10,.10],[.065,.29,.045],
      [.075,.49,.055],[.08,.68,.055],[.085,.89,.085],
      [.12,1.04,.13],[.16,1.20,.13],[.19,1.32,.08]
    ]
  },
  {
    id: 'HT',
    name: '手少阴心经',
    color: '#cf4760',
    direction: '腋下 → 上肢内侧后缘 → 小指',
    note: '绘制腋部至小指的简化体表段；未绘制心中起始的体内循行。',
    points: [
      [.19,1.34,.03],[.22,1.23,.025],[.25,1.10,.015],
      [.28,.97,.02],[.31,.85,.025],[.32,.76,.03]
    ]
  },
  {
    id: 'SI',
    name: '手太阳小肠经',
    color: '#ae526f',
    direction: '小指 → 上肢外侧后缘 → 肩胛 → 头面耳部',
    note: '肩胛与头面路线较复杂；此处省略部分曲折、面部分支和体内路线。',
    points: [
      [.32,.76,-.025],[.31,.87,-.04],[.29,1.02,-.05],
      [.25,1.22,-.06],[.21,1.39,-.08],[.13,1.38,-.12],
      [.08,1.46,-.10],[.07,1.55,-.025],[.075,1.62,.025]
    ]
  },
  {
    id: 'BL',
    name: '足太阳膀胱经',
    color: '#397cbc',
    direction: '内眼角 → 头顶 → 背腰部 → 下肢后侧 → 小趾',
    note: '背部有两条主要纵行支线。本原型只画一条简化路线，并未完整呈现膀胱经分支。',
    points: [
      [.025,1.65,.105],[.035,1.73,.03],[.045,1.68,-.09],
      [.055,1.52,-.105],[.065,1.34,-.13],[.07,1.13,-.12],
      [.09,.95,-.115],[.13,.79,-.10],[.14,.57,-.085],
      [.14,.36,-.07],[.15,.13,-.045],[.17,.035,.15]
    ]
  },
  {
    id: 'KI',
    name: '足少阴肾经',
    color: '#655bc3',
    direction: '足底 → 内踝后方 → 下肢内侧 → 腹胸部',
    note: '起于足底的路线在内踝周围有曲折；体内循行与分支未绘制。',
    points: [
      [.10,.015,.12],[.07,.06,-.01],[.06,.14,-.025],
      [.065,.32,.005],[.07,.53,.015],[.06,.76,.045],
      [.035,.98,.115],[.025,1.15,.15],[.04,1.32,.15],
      [.05,1.43,.12]
    ]
  },
  {
    id: 'PC',
    name: '手厥阴心包经',
    color: '#c25094',
    direction: '胸部 → 上肢内侧中间 → 掌中 → 中指',
    note: '绘制简化体表主干，未绘制体内循行和通往无名指的分支。',
    points: [
      [.12,1.34,.145],[.20,1.30,.075],[.24,1.18,.055],
      [.27,1.04,.05],[.30,.90,.055],[.34,.81,.06],[.355,.735,.055]
    ]
  },
  {
    id: 'TE',
    name: '手少阳三焦经',
    color: '#9a62bc',
    direction: '无名指 → 上肢外侧中间 → 肩颈 → 耳周 → 眉梢',
    note: '耳周和头侧路线在此大幅简化；未绘制全部分支与体内循行。',
    points: [
      [.345,.74,-.025],[.34,.86,-.065],[.30,1.02,-.075],
      [.26,1.21,-.065],[.22,1.42,-.025],[.105,1.49,-.025],
      [.085,1.59,-.015],[.07,1.66,.035],[.055,1.66,.085]
    ]
  },
  {
    id: 'GB',
    name: '足少阳胆经',
    color: '#3b986d',
    direction: '外眼角 → 头侧 → 躯干侧面 → 下肢外侧 → 第四趾',
    note: '头侧有多段往返曲折。本原型没有完整绘制，不能当作头部经络定位图。',
    points: [
      [.055,1.65,.09],[.09,1.65,.005],[.075,1.70,-.03],
      [.095,1.58,-.025],[.14,1.46,.005],[.205,1.32,.005],
      [.19,1.14,.015],[.19,.95,.015],[.20,.73,.01],
      [.19,.50,.005],[.175,.27,.015],[.17,.09,.09],[.15,.035,.19]
    ]
  },
  {
    id: 'LR',
    name: '足厥阴肝经',
    color: '#268e91',
    direction: '大趾 → 足背 → 下肢内侧 → 腹部 → 胁肋',
    note: '绘制足部至胁肋的简化体表段；完整循行还包括体内及头面部路线。',
    points: [
      [.08,.035,.205],[.085,.095,.12],[.075,.23,.06],
      [.08,.43,.06],[.085,.63,.075],[.07,.85,.095],
      [.035,1.01,.13],[.085,1.15,.145],[.14,1.27,.13]
    ]
  }
];

export const DEFAULT_STUDY: MeridianSettings = {
  visible: [],
  bilateral: true,
  flow: false,
  xray: false
};

/** 相对网站目录解析资源，兼容 GitHub Pages 的仓库子目录。 */
export function assetURL(path: string): string {
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return new URL(path.replace(/^\/+/, ''), document.baseURI).href;
}

/* ---------- Three.js 经络图层 ---------- */

export function createMeridianLayer(scene: T.Scene, atlas: Atlas) {
  const root = new T.Group();
  root.name = 'meridian-study-unverified';
  root.visible = false;
  scene.add(root);

  // 使用模型总包围盒做初步比例映射，不等于解剖标志点校准。
  const box = new T.Box3();
  for (const part of atlas.parts) {
    box.expandByPoint(new T.Vector3().fromArray(part.bounds[0]));
    box.expandByPoint(new T.Vector3().fromArray(part.bounds[1]));
  }

  const center = box.getCenter(new T.Vector3());
  const height = box.getSize(new T.Vector3()).y;
  root.position.set(center.x, box.min.y, center.z);
  root.scale.setScalar(height > 0 ? height / 1.75 : 1);

  const geometries: T.BufferGeometry[] = [];
  const materials: T.MeshStandardMaterial[] = [];
  const coneGeometry = new T.ConeGeometry(.012, .03, 8);
  const beadGeometry = new T.SphereGeometry(.009, 12, 10);
  geometries.push(coneGeometry, beadGeometry);

  interface Route {
    id: string;
    group: T.Group;
    mirrored: boolean;
    curve: T.CatmullRomCurve3;
    bead: T.Mesh;
  }

  const routes: Route[] = [];
  const up = new T.Vector3(0, 1, 0);

  for (const meridian of MERIDIANS) {
    const curve = new T.CatmullRomCurve3(
      meridian.points.map(p => new T.Vector3(...p)),
      false,
      'centripetal'
    );

    const tube = new T.TubeGeometry(curve, 150, .012, 12, false);
    geometries.push(tube);

    const material = new T.MeshStandardMaterial({
      color: meridian.color,
      emissive: meridian.color,
      emissiveIntensity: 0.8,
      metalness: 0.1,
      roughness: 0.3,
      transparent: true,
      opacity: .95,
      depthWrite: false,
      depthTest: false
    });
    const beadMaterial = new T.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#ffffff',
      emissiveIntensity: 0.6,
      depthWrite: false,
      depthTest: false
    });
    materials.push(material, beadMaterial);

    // 同一条路线镜像到另一侧，保留数组的循行顺序。
    for (const mirrored of [false, true]) {
      const group = new T.Group();
      if (mirrored) group.scale.x = -1;

      const line = new T.Mesh(tube, material);
      line.renderOrder = 5;
      group.add(line);

      for (const t of [.18, .48, .78]) {
        const arrow = new T.Mesh(coneGeometry, material);
        arrow.position.copy(curve.getPointAt(t));
        arrow.quaternion.setFromUnitVectors(up, curve.getTangentAt(t));
        arrow.renderOrder = 6;
        group.add(arrow);
      }

      const bead = new T.Mesh(beadGeometry, beadMaterial);
      bead.visible = false;
      bead.renderOrder = 7;
      group.add(bead);

      root.add(group);
      routes.push({id: meridian.id, group, mirrored, curve, bead});
    }
  }

  let previous: MeridianSettings | undefined;
  let elapsed = 0;

  return {
    /**
     * 返回是否需要重新渲染。
     * 解剖爆炸/单结构隔离时暂时隐藏，避免经络留在错误位置。
     */
    update(
      settings: MeridianSettings | undefined,
      available: boolean,
      dt: number
    ): boolean {
      const visible = !!settings && available && settings.visible.length > 0;
      let dirty = previous !== settings || root.visible !== visible;
      root.visible = visible;

      if (!settings) {
        previous = settings;
        return dirty;
      }

      if (previous !== settings) {
        const ids = new Set(settings.visible);
        for (const route of routes) {
          route.group.visible =
            ids.has(route.id) && (!route.mirrored || settings.bilateral);
          route.bead.visible = settings.flow;
        }

        for (const material of materials) {
          material.depthTest = !settings.xray;
        }
      }

      if (visible && settings.flow) {
        elapsed += dt;
        for (const route of routes) {
          if (route.group.visible) {
            route.bead.position.copy(
              route.curve.getPointAt((elapsed * .12) % 1)
            );
          }
        }
        dirty = true;
      }

      previous = settings;
      return dirty;
    },

    dispose() {
      scene.remove(root);
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      root.clear();
    }
  };
}

/* ---------- 中文学习面板 ---------- */

interface PanelProps {
  settings: MeridianSettings;
  onChange: (settings: MeridianSettings) => void;
  onReference: () => void;
  suspended: boolean;
}

export function MeridianPanel({
  settings, onChange, onReference, suspended
}: PanelProps) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState('LU');

  const current = MERIDIANS.find(m => m.id === focused) ?? MERIDIANS[0];
  const matches = MERIDIANS.filter(m =>
    `${m.name} ${m.id}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  const change = (patch: Partial<MeridianSettings>) =>
    onChange({...settings, ...patch});

  const toggle = (id: string) => {
    change({
      visible: settings.visible.includes(id)
        ? settings.visible.filter(item => item !== id)
        : [...settings.visible, id]
    });
    setFocused(id);
  };

  return (
    <>
      <style>{`
        .meridian-panel {
          position:absolute;right:88px;top:106px;z-index:24;
          width:288px;max-height:calc(100dvh - 275px);
          display:flex;flex-direction:column;
          background:#fffef9f5;border:1px solid #dce3d8;
          border-radius:14px;box-shadow:0 12px 40px #25473412;
          color:#29483d;font:13px/1.65 system-ui,"Microsoft YaHei",sans-serif;
          backdrop-filter:blur(16px);
        }
        .meridian-panel .mp-heading {
          padding:13px 15px;display:flex;align-items:center;
          justify-content:space-between;gap:10px;
        }
        .meridian-panel .mp-heading strong {font-size:16px}
        .meridian-panel .mp-body {
          overflow:auto;overscroll-behavior:contain;padding:0 15px 15px;
        }
        .meridian-panel button {
          border:1px solid #d9e3d8;background:#fff;border-radius:7px;
          padding:4px 8px;color:#29483d;font:inherit;
        }
        .meridian-panel button:hover {background:#edf4e9}
        .meridian-panel button:focus-visible,
        .meridian-panel input:focus-visible {
          outline:2px solid #367c60;outline-offset:2px;
        }
        .meridian-panel .mp-search {
          width:100%;border:1px solid #d9e3d8;border-radius:8px;
          padding:8px 10px;background:white;color:#29483d;
        }
        .meridian-panel .mp-actions {
          display:flex;flex-wrap:wrap;gap:6px;margin:10px 0;
        }
        .meridian-panel .mp-row {
          display:flex;align-items:center;gap:7px;
          padding:7px 0;border-bottom:1px solid #edf0e9;
        }
        .meridian-panel .mp-row label {
          flex:1;display:flex;align-items:center;gap:7px;cursor:pointer;
        }
        .meridian-panel input[type=checkbox] {accent-color:#367c60}
        .meridian-panel .mp-dot {
          display:inline-block;width:8px;height:8px;border-radius:50%;
        }
        .meridian-panel .mp-options {
          display:flex;flex-wrap:wrap;gap:8px 12px;margin:12px 0;
        }
        .meridian-panel .mp-options label {
          display:flex;align-items:center;gap:4px;cursor:pointer;
        }
        .meridian-panel .mp-info {
          padding:11px;background:#f0f4ec;border-radius:9px;margin-top:10px;
        }
        .meridian-panel .mp-info p {margin:6px 0 0}
        .meridian-panel .mp-note {
          font-size:11px;line-height:1.65;color:#827454;margin:10px 0 0;
        }
        .meridian-panel .mp-alert {
          color:#a35130;background:#fff0df;padding:8px;border-radius:7px;
        }
        .meridian-panel.is-closed {width:190px}
        @media(max-width:1000px) {
          .meridian-panel {right:76px;width:258px}
        }
        @media(max-width:767px) {
          .meridian-panel {
            top:auto;bottom:142px;right:12px;
            width:min(300px,calc(100vw - 24px));max-height:48dvh;
          }
          .meridian-panel .mp-heading {padding:10px 12px}
        }
      `}</style>

      <section
        className={`meridian-panel ${open ? '' : 'is-closed'}`}
        aria-label="十二经络学习面板"
      >
        <div className="mp-heading">
          <strong>旧经络示意 · 未校准</strong>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="meridian-panel-body"
            onClick={() => setOpen(!open)}
          >
            {open ? '收起' : '展开'}
          </button>
        </div>

        {open && (
          <div className="mp-body" id="meridian-panel-body">
            <input
              className="mp-search"
              aria-label="搜索经络名称或代码"
              placeholder="搜索：肺经、膀胱经、LU…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />

            <div className="mp-actions">
              <button onClick={() => change({
                visible: MERIDIANS.map(m => m.id)
              })}>全部显示</button>
              <button onClick={() => change({visible: []})}>全部隐藏</button>
              <button onClick={onReference}>体表＋骨骼参考</button>
            </div>

            {matches.map(m => (
              <div className="mp-row" key={m.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.visible.includes(m.id)}
                    onChange={() => toggle(m.id)}
                  />
                  <span className="mp-dot" style={{background: m.color}}/>
                  <span>{m.name}</span>
                </label>
                <button
                  aria-label={`只显示${m.name}`}
                  onClick={() => {
                    change({visible: [m.id]});
                    setFocused(m.id);
                  }}
                >
                  单看
                </button>
              </div>
            ))}

            {matches.length === 0 && <p>没有匹配的经络。</p>}

            <div className="mp-options">
              <label>
                <input
                  type="checkbox"
                  checked={settings.bilateral}
                  onChange={e => change({bilateral: e.target.checked})}
                />双侧
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.flow}
                  onChange={e => change({flow: e.target.checked})}
                />流向动画
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.xray}
                  onChange={e => change({xray: e.target.checked})}
                />透视经络
              </label>
            </div>

            <StudyLibrary />

            {suspended && (
              <p className="mp-alert">
                解剖展开或隔离模式下，经络暂时隐藏。
                点击“体表＋骨骼参考”恢复观察。
              </p>
            )}

            <div className="mp-info">
              <strong style={{color: current.color}}>
                {current.name} · {current.id}
              </strong>
              <p>{current.direction}</p>
              <p>{current.note}</p>
            </div>

            <p className="mp-note">
              未校准教学原型：线条仅示意部分体表主干，
              不代表可直接观察到的解剖管道。未覆盖全部分支、
              体内循行或穴位，不用于针刺定位。
              透视模式会同时显示被人体遮挡的路线，注意前后区分。
            </p>
            <p className="mp-note">
              模型：BodyParts3D / The Database Center for Life Science。
              本次新增经络示意和中文学习交互。
            </p>
          </div>
        )}
      </section>
    </>
  );
}