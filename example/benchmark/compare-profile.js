const fs = require('fs');
const fastYaml = require('./js/index.cjs');

// js-yamlをインストールする必要があります
// npm install js-yaml
let jsYaml;
try {
  jsYaml = require('js-yaml');
} catch (e) {
  console.error('js-yaml is not installed. Please run: npm install js-yaml');
  process.exit(1);
}

const files = [
  './example/benchmark/data/test-10KB.yaml',
  './example/benchmark/data/test-100KB.yaml',
  './example/benchmark/data/test-1MB.yaml',
];

async function runCompareTest() {
  for (const file of files) {
    const yaml = fs.readFileSync(file, 'utf8');

    console.log(`\nTesting ${file}:`);

    // js-yamlのプロファイリング
    console.time('js-yaml parse');
    const jsResult = jsYaml.load(yaml);
    console.timeEnd('js-yaml parse');

    // fast-yamlのプロファイリング
    console.time('fast-yaml parse');
    const fastResult = fastYaml.load(yaml);
    console.timeEnd('fast-yaml parse');

    // 結果の構造を比較
    console.log('Results match:', JSON.stringify(jsResult) === JSON.stringify(fastResult));

    // 詳細なプロファイリング（10回の繰り返し）
    console.log('\nDetailed profiling (10 iterations):');

    // js-yaml詳細プロファイリング
    const jsYamlTimes = [];
    for (let i = 0; i < 10; i++) {
      const start = process.hrtime.bigint();
      jsYaml.load(yaml);
      const end = process.hrtime.bigint();
      jsYamlTimes.push(Number(end - start) / 1000000); // ナノ秒からミリ秒に変換
    }

    // fast-yaml詳細プロファイリング
    const fastYamlTimes = [];
    for (let i = 0; i < 10; i++) {
      const start = process.hrtime.bigint();
      fastYaml.load(yaml);
      const end = process.hrtime.bigint();
      fastYamlTimes.push(Number(end - start) / 1000000); // ナノ秒からミリ秒に変換
    }

    // 統計情報の計算
    const jsYamlAvg = jsYamlTimes.reduce((a, b) => a + b, 0) / jsYamlTimes.length;
    const fastYamlAvg = fastYamlTimes.reduce((a, b) => a + b, 0) / fastYamlTimes.length;

    const jsYamlMin = Math.min(...jsYamlTimes);
    const fastYamlMin = Math.min(...fastYamlTimes);

    const jsYamlMax = Math.max(...jsYamlTimes);
    const fastYamlMax = Math.max(...fastYamlTimes);

    console.log(
      'js-yaml times (ms):',
      jsYamlTimes.map((t) => t.toFixed(2))
    );
    console.log(
      'fast-yaml times (ms):',
      fastYamlTimes.map((t) => t.toFixed(2))
    );

    console.log('\nStatistics:');
    console.log(
      `js-yaml: avg=${jsYamlAvg.toFixed(2)}ms, min=${jsYamlMin.toFixed(2)}ms, max=${jsYamlMax.toFixed(2)}ms`
    );
    console.log(
      `fast-yaml: avg=${fastYamlAvg.toFixed(2)}ms, min=${fastYamlMin.toFixed(2)}ms, max=${fastYamlMax.toFixed(2)}ms`
    );
    console.log(`Ratio (fast-yaml/js-yaml): ${(fastYamlAvg / jsYamlAvg).toFixed(2)}x`);

    console.log('-----------------------------------');
  }
}

runCompareTest();
