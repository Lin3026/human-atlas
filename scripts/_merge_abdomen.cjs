const fs = require('fs');
const draft = JSON.parse(fs.readFileSync('./abdomen-4meridians-draft.json', 'utf8'));
const seedRaw = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');

const jsonMatch = seedRaw.match(/export const PROJECT_ACUPOINT_SEED = (\{[\s\S]*\});/);
if (!jsonMatch) { console.log('无法解析seed文件'); process.exit(1); }
const seed = JSON.parse(jsonMatch[1]);

let added = 0, skipped = 0;
for (const [code, point] of Object.entries(draft.points)) {
  if (!seed.points[code]) {
    seed.points[code] = point;
    added++;
  } else {
    skipped++;
  }
}

const newContent = seedRaw.replace(jsonMatch[1], JSON.stringify(seed, null, 2));
fs.writeFileSync('./app/acupoint-seed.ts', newContent);

console.log('合并完成：新增', added, '个，跳过', skipped, '个');
console.log('seed现有', Object.keys(seed.points).length, '个穴位');
const meridians = {};
for (const code of Object.keys(seed.points)) {
  const m = code.replace(/[0-9]/g, '');
  meridians[m] = (meridians[m] || 0) + 1;
}
console.log('各经分布:', JSON.stringify(meridians));
