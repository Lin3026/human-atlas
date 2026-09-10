const fs = require('fs');
let content = fs.readFileSync('./app/anatomy-zh.ts', 'utf8');
const normalized = content.replace(/\r\n/g, '\n');

// 在 anatomyChinese 函数里添加序数词处理
// 找到现有的 vertebra 正则处理块，在它前面添加序数词映射和更全面的处理

const oldVertebraBlock = `  const vertebra = key.match(/^(cervical|thoracic|lumbar) vertebra\\s+(\\d+)$/);
  if (vertebra) {
    const names: Record<string, string> = {
      cervical: '颈椎', thoracic: '胸椎', lumbar: '腰椎'
    };
    return '第' + vertebra[2] + names[vertebra[1]];
  }`;

const newVertebraBlock = `  // 英文序数词 → 中文数字
  const ORDINAL: Record<string, string> = {
    'first': '1', 'second': '2', 'third': '3', 'fourth': '4',
    'fifth': '5', 'sixth': '6', 'seventh': '7', 'eighth': '8',
    'ninth': '9', 'tenth': '10', 'eleventh': '11', 'twelfth': '12'
  };

  // 椎骨：Seventh cervical vertebra → 第7颈椎
  const vertebraOrdinal = key.match(/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\\s+(cervical|thoracic|lumbar)\\s+vertebra$/);
  if (vertebraOrdinal) {
    const names: Record<string, string> = {
      cervical: '颈椎', thoracic: '胸椎', lumbar: '腰椎'
    };
    return '第' + ORDINAL[vertebraOrdinal[1]] + names[vertebraOrdinal[2]];
  }

  // 肋骨：Left seventh rib → 左侧第7肋骨
  const ribOrdinal = key.match(/^(left|right)\\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\\s+rib$/);
  if (ribOrdinal) {
    const side = ribOrdinal[1] === 'left' ? '左侧' : '右侧';
    return side + '第' + ORDINAL[ribOrdinal[2]] + '肋骨';
  }

  // 掌骨/跖骨：Left first metacarpal bone → 左侧第1掌骨
  const metaOrdinal = key.match(/^(left|right)\\s+(first|second|third|fourth|fifth)\\s+(metacarpal|metatarsal)\\s+bone$/);
  if (metaOrdinal) {
    const side = metaOrdinal[1] === 'left' ? '左侧' : '右侧';
    const bone = metaOrdinal[3] === 'metacarpal' ? '掌骨' : '跖骨';
    return side + '第' + ORDINAL[metaOrdinal[2]] + bone;
  }

  const vertebra = key.match(/^(cervical|thoracic|lumbar) vertebra\\s+(\\d+)$/);
  if (vertebra) {
    const names: Record<string, string> = {
      cervical: '颈椎', thoracic: '胸椎', lumbar: '腰椎'
    };
    return '第' + vertebra[2] + names[vertebra[1]];
  }`;

if (normalized.includes(oldVertebraBlock)) {
  content = normalized.replace(oldVertebraBlock, newVertebraBlock);
  fs.writeFileSync('./app/anatomy-zh.ts', content.replace(/\n/g, '\r\n'));
  console.log('anatomy-zh.ts 修改成功：添加序数词自动转换（椎骨/肋骨/掌骨/跖骨）');
} else {
  console.log('未找到目标块');
  const idx = normalized.indexOf('vertebra = key.match');
  console.log('位置:', idx);
  console.log('上下文:', JSON.stringify(normalized.substring(idx-20, idx+150)));
}
