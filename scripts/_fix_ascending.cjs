const fs = require('fs');
let c = fs.readFileSync('./app/anatomy-zh.ts', 'utf8');
c = c.replace("ascending: '上部',", "ascending: '下部（升部）',");
c = c.replace("descending: '下部',", "descending: '上部（降部）',");
c = c.replace("transverse: '中部',", "transverse: '中部（横部）',");
fs.writeFileSync('./app/anatomy-zh.ts', c);
console.log('已修正ascending/descending/transverse映射');
console.log('验证:', c.includes("下部（升部）"), c.includes("上部（降部）"));
