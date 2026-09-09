import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';

const root = fileURLToPath(new URL('../', import.meta.url));
const models = path.join(root, 'public', 'models');
const atlas = JSON.parse(
  fs.readFileSync(path.join(models, 'atlas.json'), 'utf8')
);

if (!Array.isArray(atlas.parts) || !Array.isArray(atlas.chunks)) {
  throw new Error('模型索引结构与预期不符。');
}

function combineBounds(parts) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  for (const part of parts) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], part.bounds[0][axis]);
      max[axis] = Math.max(max[axis], part.bounds[1][axis]);
    }
  }

  if (!parts.length) return null;

  return {
    min,
    max,
    size: max.map((value, axis) => value - min[axis])
  };
}

function localFile(url) {
  // 原项目分块保存在 public/models，保留文件名进行本地检查。
  const pathname = String(url).split(/[?#]/)[0];
  return path.join(models, path.posix.basename(pathname));
}

const chunkCache = new Map();

function loadChunk(index) {
  if (chunkCache.has(index)) return chunkCache.get(index);

  const chunk = atlas.chunks[index];
  if (!chunk) throw new Error(`缺少分块索引 ${index}`);

  const rawPath = localFile(chunk.url);
  const gzipPath = chunk.gzip ? localFile(chunk.gzip) : null;
  let buffer;

  if (fs.existsSync(rawPath)) {
    buffer = fs.readFileSync(rawPath);
  } else if (gzipPath && fs.existsSync(gzipPath)) {
    buffer = gunzipSync(fs.readFileSync(gzipPath));
  } else {
    throw new Error(`找不到模型分块：${chunk.url}`);
  }

  if (buffer.length !== chunk.bytes) {
    throw new Error(
      `分块 ${index} 大小异常：实际 ${buffer.length}，预期 ${chunk.bytes}`
    );
  }

  chunkCache.set(index, buffer);
  return buffer;
}

function inspectSurface(part) {
  try {
    const buffer = loadChunk(part.chunk);
    const positionEnd = part.positions + part.vertexCount * 12;
    const indexEnd = part.indices + part.indexCount * 4;

    if (
      part.positions < 0 ||
      part.indices < 0 ||
      positionEnd > buffer.length ||
      indexEnd > buffer.length
    ) {
      throw new Error('顶点或索引范围超出分块长度');
    }

    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    let invalidCoordinates = 0;
    let invalidIndices = 0;
    let repeatedIndexTriangles = 0;

    for (let vertex = 0; vertex < part.vertexCount; vertex++) {
      for (let axis = 0; axis < 3; axis++) {
        const offset = part.positions + vertex * 12 + axis * 4;
        const value = buffer.readFloatLE(offset);

        if (!Number.isFinite(value)) {
          invalidCoordinates++;
          continue;
        }

        min[axis] = Math.min(min[axis], value);
        max[axis] = Math.max(max[axis], value);
      }
    }

    for (let i = 0; i < part.indexCount; i++) {
      const index = buffer.readUInt32LE(part.indices + i * 4);
      if (index >= part.vertexCount) invalidIndices++;
    }

    for (let i = 0; i + 2 < part.indexCount; i += 3) {
      const a = buffer.readUInt32LE(part.indices + i * 4);
      const b = buffer.readUInt32LE(part.indices + (i + 1) * 4);
      const c = buffer.readUInt32LE(part.indices + (i + 2) * 4);
      if (a === b || b === c || a === c) repeatedIndexTriangles++;
    }

    return {
      id: part.id,
      name: part.name,
      vertices: part.vertexCount,
      triangles: part.indexCount / 3,
      indexCountMultipleOfThree: part.indexCount % 3 === 0,
      invalidCoordinates,
      invalidIndices,
      repeatedIndexTriangles,
      actualBounds: {min, max},
      manifestBounds: part.bounds,
      status: '数据读取完成；闭合性、姿态与定位适用性尚未验证'
    };
  } catch (error) {
    return {
      id: part.id,
      name: part.name,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

const systems = {};
for (const part of atlas.parts) {
  systems[part.system] = (systems[part.system] ?? 0) + 1;
}

const surface = atlas.parts.filter(
  part => part.system === 'integumentary'
);

const structures = atlas.parts.map(part => ({
  id: part.id,
  conceptId: part.conceptId,
  name: part.name,
  system: part.system,
  bounds: part.bounds
}));

const report = {
  purpose: '穴位及经脉标注前的模型数据检查，不是医学定位认证',
  version: atlas.version,
  source: atlas.source,
  scope: atlas.scope,
  sex: atlas.sex,
  coordinateConvention:
    '根据项目署名文档：米制、Y轴向上；左右方向仍需结合模型核验',
  totalParts: atlas.parts.length,
  totalBounds: combineBounds(atlas.parts),
  systemCounts: systems,
  surfaceParts: surface.length,
  surfaceBounds: combineBounds(surface),
  surfaceChecks: surface.map(inspectSurface),
  structures,
  remainingChecks: [
    '体表是否覆盖完整人体，是否存在孔洞或开放边界',
    '实际左右方向与前后方向',
    '肩、肘、腕、髋、膝、踝及手指姿势',
    '骨性标志能否映射到对应皮肤表面',
    '肌腱、体表褶皱等定位参照是否具有足够细节',
    '各身体分区的骨度分寸参照',
    '标准定位资料及专业复核'
  ]
};

const output = path.join(root, 'anatomy-audit.json');
fs.writeFileSync(output, JSON.stringify(report, null, 2), 'utf8');

console.log('检查完成。');
console.log(`模型部件数：${atlas.parts.length}`);
console.log(`体表部件数：${surface.length}`);
console.log(`体表读取失败数：${
  report.surfaceChecks.filter(item => item.error).length
}`);
console.log(`报告位置：${output}`);
console.log('未修改任何模型或网页文件。');