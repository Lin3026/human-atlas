const fs = require('fs');
const content = fs.readFileSync('./app/acupoint-seed.ts', 'utf8');

// 找膀胱经背部穴位BL11-BL23
const blCodes = ['BL11','BL12','BL13','BL14','BL15','BL16','BL17','BL18','BL19','BL20','BL21','BL22','BL23'];
for (const code of blCodes) {
  const regex = new RegExp('"' + code + '"[\\s\\S]*?"position":\\s*\\[([^\\]]+)\\]');
  const match = content.match(regex);
  if (match) {
    console.log(code + ': position=[' + match[1] + ']');
  }
}

console.log('\n--- 膀胱经第二侧线 BL41-BL52 ---');
const blCodes2 = ['BL41','BL42','BL43','BL44','BL45','BL46','BL47','BL48','BL49','BL50','BL51','BL52'];
for (const code of blCodes2) {
  const regex = new RegExp('"' + code + '"[\\s\\S]*?"position":\\s*\\[([^\\]]+)\\]');
  const match = content.match(regex);
  if (match) {
    console.log(code + ': position=[' + match[1] + ']');
  }
}
