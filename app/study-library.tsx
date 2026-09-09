
import {useState} from 'react';

const EXTRAORDINARY = [
  ['任脉', '主要体表路线沿人体前正中线。具有本经所属穴位。'],
  ['督脉', '主要体表路线沿背部正中线，经头部至面部。具有本经所属穴位。'],
  ['冲脉', '循行涉及腹部、胸部及下肢等，存在分支与体内路线，不能只用一条前腹直线表示。'],
  ['带脉', '循行具有环绕腰腹部的特点，不能简单等同于任意水平腰围线。'],
  ['阴跷脉', '循行涉及内踝、下肢内侧及头面部等。'],
  ['阳跷脉', '循行涉及外踝、下肢外侧、躯干及头面部等。'],
  ['阴维脉', '循行涉及下肢内侧、腹胸及咽喉等。'],
  ['阳维脉', '循行涉及下肢外侧、躯干、肩颈及头部等。']
];

const POINTS = [
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

export function StudyLibrary() {
  const [query, setQuery] = useState('');
  const filtered = POINTS.filter(point =>
    point.join(' ').toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div style={{borderTop:'1px solid #dce3d8',marginTop:14,paddingTop:10}}>
      <details>
        <summary style={{cursor:'pointer',fontWeight:600}}>
          奇经八脉 · 文字资料
        </summary>
        <p className="mp-note">
          本区尚未关联三维路线。以下为概要，不是完整循行原文。
        </p>
        {EXTRAORDINARY.map(([name, description]) => (
          <div className="mp-info" key={name}>
            <strong>{name}</strong>
            <p>{description}</p>
          </div>
        ))}
        <p className="mp-note">
          十二正经加任脉、督脉，通常合称十四经。
          奇经八脉中，除任督二脉外，其余六脉没有本经专属穴位，
          而与其他经脉的穴位发生交会关系。
        </p>
      </details>

      <details style={{marginTop:12}}>
        <summary style={{cursor:'pointer',fontWeight:600}}>
          穴位资料 · 16个学习示例
        </summary>
        <p className="mp-note">
          目前只有名称、归经与大致区域，尚未进行3D定位。
          “区域”不等于标准取穴方法。
        </p>
        <input
          className="mp-search"
          placeholder="搜索穴位、代码或经脉"
          aria-label="搜索穴位资料"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        {filtered.map(([code, name, meridian, region]) => (
          <div className="mp-info" key={code}>
            <strong>{name} · {code}</strong>
            <p>归经：{meridian}</p>
            <p>大致区域：{region}</p>
            <p className="mp-note">三维标注状态：未定位</p>
          </div>
        ))}
        {filtered.length === 0 && <p>示例库中暂无匹配项。</p>}
      </details>

      <details style={{marginTop:12}}>
        <summary style={{cursor:'pointer',fontWeight:600}}>
          五脏六腑与解剖模型
        </summary>
        <div className="mp-info">
          <p>五脏：心、肝、脾、肺、肾。</p>
          <p>六腑：胆、胃、小肠、大肠、膀胱、三焦。</p>
          <p>
            中医脏腑是传统医学的功能理论概念，
            与现代解剖器官有联系，但不能完全等同。
          </p>
          <p>
            模型里的胆囊、心脏、肝脏等使用现代解剖名称。
            三焦不对应某一个独立的现代解剖器官，
            因此不创建虚构的“三焦器官”模型。
          </p>
        </div>
      </details>
    </div>
  );
}
