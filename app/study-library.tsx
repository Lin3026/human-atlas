
import {useState, useMemo} from 'react';
import {MERIDIAN_CATALOG} from './acupoint-catalog';
import {ACUPOINT_LOCATIONS} from './acupoint-locations';

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

// 生成全部362个穴位的列表
const ALL_POINTS = MERIDIAN_CATALOG.flatMap(meridian =>
  meridian.names.map((name, index) => ({
    code: `${meridian.id}${index + 1}`,
    name,
    meridian: meridian.name,
    meridianId: meridian.id,
    location: ACUPOINT_LOCATIONS[`${meridian.id}${index + 1}`] || ''
  }))
);

export function StudyLibrary() {
  const [query, setQuery] = useState('');
  const [selectedMeridian, setSelectedMeridian] = useState('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_POINTS.filter(point => {
      const matchMeridian = selectedMeridian === 'ALL' || point.meridianId === selectedMeridian;
      const matchQuery = !q || 
        point.name.toLowerCase().includes(q) ||
        point.code.toLowerCase().includes(q) ||
        point.meridian.toLowerCase().includes(q) ||
        point.location.toLowerCase().includes(q);
      return matchMeridian && matchQuery;
    });
  }, [query, selectedMeridian]);

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

      <details open style={{marginTop:12}}>
        <summary style={{cursor:'pointer',fontWeight:600}}>
          穴位资料 · 十四经362穴（国标定位）
        </summary>
        <p className="mp-note">
          包含十四经全部362个穴位的名称、归经与国标标准定位描述。
          标准定位依据：GB/T 12346-2021《腧穴名称与定位》。
        </p>
        
        {/* 经络筛选 */}
        <div style={{marginBottom:10}}>
          <select
            value={selectedMeridian}
            onChange={e => setSelectedMeridian(e.target.value)}
            style={{width:'100%',padding:'8px',border:'1px solid #cddbcf',borderRadius:'7px',background:'white',marginBottom:'8px'}}
          >
            <option value="ALL">全部经络（362穴）</option>
            {MERIDIAN_CATALOG.map(m => (
              <option key={m.id} value={m.id}>{m.name}（{m.names.length}穴）</option>
            ))}
          </select>
        </div>

        {/* 搜索框 */}
        <input
          className="mp-search"
          placeholder="搜索穴位名称、代码、经络或定位描述"
          aria-label="搜索穴位资料"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        
        <p className="mp-small" style={{margin:'8px 0',color:'#747a6b'}}>
          显示 {filtered.length} / 362 个穴位
        </p>

        {/* 穴位列表 */}
        <div style={{maxHeight:'400px',overflowY:'auto',border:'1px solid #e4e3dd',borderRadius:'8px',padding:'8px'}}>
          {filtered.map(point => (
            <div className="mp-info" key={point.code} style={{marginBottom:'10px',padding:'10px',background:'#f9faf7',borderRadius:'8px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                <strong style={{fontSize:'14px'}}>{point.name} · {point.code}</strong>
                <span style={{fontSize:'11px',color:'#286c57',background:'#e8f0e8',padding:'2px 6px',borderRadius:'4px'}}>{point.meridian}</span>
              </div>
              {point.location ? (
                <p style={{color:'#29483d',fontSize:'12px',lineHeight:'1.7',margin:'6px 0',padding:'8px',background:'#f1f4ed',borderRadius:'6px',borderLeft:'3px solid #286c57'}}>
                  <strong style={{color:'#286c57'}}>标准定位：</strong>{point.location}
                </p>
              ) : (
                <p className="mp-note" style={{fontSize:'11px'}}>定位描述待补充</p>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p style={{textAlign:'center',color:'#747a6b',padding:'20px'}}>未找到匹配的穴位</p>}
        </div>
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
            因此不创建虚构的"三焦器官"模型。
          </p>
        </div>
      </details>
    </div>
  );
}
