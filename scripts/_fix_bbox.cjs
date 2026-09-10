const fs = require('fs');
let c = fs.readFileSync('./scripts/batch-dumai-head-v2.mjs', 'utf8');
const oldLine = "skinGeo.setAttribute('index', new T.BufferAttribute(indices, 1));";
const newLine = oldLine + "\nskinGeo.computeBoundingBox();";
c = c.replace(oldLine, newLine);
fs.writeFileSync('./scripts/batch-dumai-head-v2.mjs', c);
console.log('已添加computeBoundingBox');
