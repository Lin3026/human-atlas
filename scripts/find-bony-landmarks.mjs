// 获取关键骨性标志坐标
import { loadAtlas } from '../app/atlas-loader';
import * as THREE from 'three';

async function main() {
  const atlas = await loadAtlas();
  const skeletalParts = atlas.parts.filter(p => p.system === 'skeletal');

  // 关键骨性标志
  const landmarks = [
    { name: '肩峰', pattern: /acromion|clavicle.*acromial|scapula.*acromion/i },
    { name: '肱骨外上髁', pattern: /humerus.*lateral.*epicondyle|lateral.*epicondyle.*humerus/i },
    { name: '肱骨内上髁', pattern: /humerus.*medial.*epicondyle|medial.*epicondyle.*humerus/i },
    { name: '尺骨鹰嘴', pattern: /olecranon|ulna.*olecranon/i },
    { name: '桡骨茎突', pattern: /radius.*styloid|styloid.*radius/i },
    { name: '尺骨茎突', pattern: /ulna.*styloid|styloid.*ulna/i },
    { name: '股骨大转子', pattern: /greater trochanter|trochanter.*femur/i },
    { name: '髌骨', pattern: /patella/i },
    { name: '胫骨内侧髁', pattern: /tibia.*medial.*condyle|medial.*condyle.*tibia/i },
    { name: '外踝', pattern: /lateral malleolus|malleolus.*lateral|fibula.*malleolus/i },
    { name: '内踝', pattern: /medial malleolus|malleolus.*medial|tibia.*malleolus/i },
    { name: '第7颈椎', pattern: /seventh cervical|cervical.*7|C7/i },
    { name: '第1胸椎', pattern: /first thoracic|thoracic.*1|T1/i },
    { name: '第12胸椎', pattern: /twelfth thoracic|thoracic.*12|T12/i },
    { name: '第1腰椎', pattern: /first lumbar|lumbar.*1|L1/i },
    { name: '第5腰椎', pattern: /fifth lumbar|lumbar.*5|L5/i },
    { name: '骶骨', pattern: /sacrum/i },
    { name: '尾骨', pattern: /coccyx/i },
    { name: '胸骨柄', pattern: /manubrium/i },
    { name: '胸骨体', pattern: /body of sternum/i },
    { name: '剑突', pattern: /xiphoid/i },
    { name: '锁骨', pattern: /clavicle/i },
    { name: '肩胛骨', pattern: /scapula/i },
    { name: '肱骨', pattern: /humerus/i },
    { name: '桡骨', pattern: /^radius/i },
    { name: '尺骨', pattern: /^ulna/i },
    { name: '股骨', pattern: /femur/i },
    { name: '胫骨', pattern: /^tibia/i },
    { name: '腓骨', pattern: /^fibula/i },
  ];

  console.log('=== 关键骨性标志部件 ===');
  for (const landmark of landmarks) {
    const parts = skeletalParts.filter(p => landmark.pattern.test(p.name));
    if (parts.length > 0) {
      console.log('\n' + landmark.name + ':');
      parts.forEach(p => {
        const bbox = getBoundingBox(atlas, p);
        if (bbox) {
          console.log('  ' + p.name + ': center=[' + 
            bbox.center.x.toFixed(3) + ', ' + 
            bbox.center.y.toFixed(3) + ', ' + 
            bbox.center.z.toFixed(3) + '] size=[' +
            bbox.size.x.toFixed(3) + ', ' + bbox.size.y.toFixed(3) + ', ' + bbox.size.z.toFixed(3) + ']');
        }
      });
    }
  }
}

function getBoundingBox(atlas, part) {
  // 简化：从atlas元数据获取bounding box
  if (part.boundingBox) {
    const min = part.boundingBox.min;
    const max = part.boundingBox.max;
    return {
      center: { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 },
      size: { x: max.x - min.x, y: max.y - min.y, z: max.z - min.z },
      min, max
    };
  }
  return null;
}

main().catch(console.error);
