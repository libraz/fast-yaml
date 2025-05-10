const fs = require('fs');
const fastYaml = require('./js/index.cjs');

// 異なるサイズのファイルをテスト
const files = [
  './example/benchmark/data/test-10KB.yaml',
  './example/benchmark/data/test-100KB.yaml',
  './example/benchmark/data/test-1MB.yaml',
];

// プロファイリング関数
async function runProfileTest() {
  console.profile('fast-yaml-profile');

  for (const file of files) {
    const yaml = fs.readFileSync(file, 'utf8');
    console.time(`Parse ${file}`);
    const result = fastYaml.load(yaml);
    console.timeEnd(`Parse ${file}`);
  }

  console.profileEnd('fast-yaml-profile');
}

runProfileTest();
