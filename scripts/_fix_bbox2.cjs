const fs = require('fs');
let c = fs.readFileSync('./scripts/batch-dumai-head-v2.mjs', 'utf8');
const oldLine = "skinGeo.setIndex(new T.BufferAttribute(indices, 1));";
const newLine = oldLine + "\nskinGeo.computeBoundingBox();";
if (c.includes(oldLine)) {
  c = c.replace(oldLine, newLine);
  fs.writeFileSync('./scripts/batch-dumai-head-v2.mjs', c);
  console.log('已添加computeBoundingBox');
} else {
  console.log('未找到setIndex行');
  console.log(c.substring(0, 500));
}
