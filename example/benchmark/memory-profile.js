const fs = require('fs');
const fastYaml = require('./js/index.cjs');

function formatMemoryUsage(data) {
  return {
    rss: `${Math.round(data.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(data.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(data.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(data.external / 1024 / 1024)} MB`,
  };
}

// 異なるサイズのファイルをテスト
const files = [
  './example/benchmark/data/test-10KB.yaml',
  './example/benchmark/data/test-100KB.yaml',
  './example/benchmark/data/test-1MB.yaml',
];

async function runMemoryTest() {
  for (const file of files) {
    const yaml = fs.readFileSync(file, 'utf8');

    // GCを強制実行して初期状態をクリーンに
    if (global.gc) {
      global.gc();
    }

    // 初期メモリ使用量
    const beforeMemory = process.memoryUsage();
    console.log(`Before parsing ${file}:`, formatMemoryUsage(beforeMemory));

    // パース実行
    const result = fastYaml.load(yaml);

    // パース後のメモリ使用量
    const afterMemory = process.memoryUsage();
    console.log(`After parsing ${file}:`, formatMemoryUsage(afterMemory));

    // 差分
    console.log(`Memory increase:`, {
      rss: `${Math.round((afterMemory.rss - beforeMemory.rss) / 1024 / 1024)} MB`,
      heapTotal: `${Math.round((afterMemory.heapTotal - beforeMemory.heapTotal) / 1024 / 1024)} MB`,
      heapUsed: `${Math.round((afterMemory.heapUsed - beforeMemory.heapUsed) / 1024 / 1024)} MB`,
      external: `${Math.round((afterMemory.external - beforeMemory.external) / 1024 / 1024)} MB`,
    });

    console.log('-----------------------------------');
  }
}

runMemoryTest();
