const fs = require('fs');
const content = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');
const pointMatches = content.match(/^\s+"([A-Z]+)(\d+)"\s*:\s*\{/gm);
if (pointMatches) {
  const meridians = {};
  pointMatches.forEach(m => {
    const mer = m.match(/"([A-Z]+)\d+"/)[1];
    meridians[mer] = (meridians[mer] || 0) + 1;
  });
  console.log('已标注穴位总数:', pointMatches.length);
  console.log('各经脉穴位数:');
  Object.entries(meridians).sort().forEach(([k, v]) => console.log('  ' + k + ': ' + v + '穴'));
} else {
  console.log('未匹配到穴位');
}
