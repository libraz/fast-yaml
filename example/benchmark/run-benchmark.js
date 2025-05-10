#!/usr/bin/env node

/**
 * fast-yaml Benchmark Runner
 *
 * This script runs benchmarks comparing fast-yaml with js-yaml.
 * It uses hyperfine for accurate timing measurements.
 *
 * Note: js-yaml is not included in the repository and will be temporarily
 * installed during the benchmark process.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const WARMUP_RUNS = 3;
const BENCHMARK_RUNS = 10;
const RESULTS_FILE = path.join(__dirname, 'results.json');
const YAML_SIZES = ['10KB', '100KB', '1MB'];
const TMP_DIR = path.join(__dirname, 'tmp');

// Ensure the benchmark data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure the temporary directory exists
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Generate test YAML files of different sizes if they don't exist
function generateTestFiles() {
  console.log('Generating test YAML files...');

  const sizes = {
    '10KB': 100, // ~100 items for 10KB
    '100KB': 1000, // ~1000 items for 100KB
    '1MB': 10000, // ~10000 items for 1MB
  };

  for (const [size, count] of Object.entries(sizes)) {
    const filePath = path.join(dataDir, `test-${size}.yaml`);

    if (!fs.existsSync(filePath)) {
      console.log(`Generating ${size} test file...`);

      let yaml = 'items:\n';
      for (let i = 1; i <= count; i++) {
        yaml += `  - id: ${i}\n`;
        yaml += `    name: "Item ${i}"\n`;
        yaml += `    description: "This is a description for item ${i}"\n`;
        yaml += `    tags:\n`;
        yaml += `      - tag${(i % 5) + 1}\n`;
        yaml += `      - tag${(i % 7) + 1}\n`;
        yaml += `    metadata:\n`;
        yaml += `      created: 2025-01-${(i % 28) + 1}\n`;
        yaml += `      priority: ${(i % 5) + 1}\n`;
      }

      fs.writeFileSync(filePath, yaml);
      console.log(`Generated ${size} test file: ${filePath}`);
    }
  }
}

// Create benchmark scripts
function createBenchmarkScripts() {
  console.log('Creating benchmark scripts...');

  const scriptsDir = path.join(__dirname, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  // Create fast-yaml benchmark script
  const fastYamlScript = path.join(scriptsDir, 'bench-fast-yaml.js');
  fs.writeFileSync(
    fastYamlScript,
    `
const fs = require('fs');
const fastYaml = require('../../../js/index.cjs');

const file = process.argv[2];
const yaml = fs.readFileSync(file, 'utf8');
fastYaml.load(yaml);
  `
  );

  // Create js-yaml benchmark script
  const jsYamlScript = path.join(scriptsDir, 'bench-js-yaml.js');
  fs.writeFileSync(
    jsYamlScript,
    `
const fs = require('fs');
// Note: js-yaml needs to be installed separately
const jsYaml = require('js-yaml');

const file = process.argv[2];
const yaml = fs.readFileSync(file, 'utf8');
jsYaml.load(yaml);
  `
  );

  console.log('Benchmark scripts created.');
}

// Setup temporary js-yaml installation
function setupJsYaml() {
  console.log('Setting up js-yaml for benchmarking...');

  // Create a temporary package.json
  const packageJson = {
    name: 'fast-yaml-benchmark-temp',
    version: '1.0.0',
    private: true,
    dependencies: {
      'js-yaml': '^4.1.0',
    },
  };

  fs.writeFileSync(path.join(TMP_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Install js-yaml in the temporary directory
  console.log('Installing js-yaml temporarily...');
  execSync('npm install', { cwd: TMP_DIR, stdio: 'inherit' });

  // Create a symlink to node_modules
  const nodeModulesPath = path.join(TMP_DIR, 'node_modules');
  const symlinkPath = path.join(__dirname, 'scripts', 'node_modules');

  if (fs.existsSync(symlinkPath)) {
    fs.unlinkSync(symlinkPath);
  }

  fs.symlinkSync(nodeModulesPath, symlinkPath, 'junction');
  console.log('js-yaml setup complete.');
}

// Clean up temporary js-yaml installation
function cleanupJsYaml() {
  console.log('Cleaning up temporary js-yaml installation...');

  const symlinkPath = path.join(__dirname, 'scripts', 'node_modules');
  if (fs.existsSync(symlinkPath)) {
    fs.unlinkSync(symlinkPath);
  }

  // Remove the temporary directory
  fs.rmSync(TMP_DIR, { recursive: true, force: true });

  console.log('Cleanup complete.');
}

// Run benchmarks
function runBenchmarks() {
  console.log('Running benchmarks...');

  const results = {
    date: new Date().toISOString(),
    benchmarks: {},
  };

  for (const size of YAML_SIZES) {
    const yamlFile = path.join(dataDir, `test-${size}.yaml`);
    const fastYamlCmd = `node ${path.join(__dirname, 'scripts', 'bench-fast-yaml.js')} ${yamlFile}`;
    const jsYamlCmd = `node ${path.join(__dirname, 'scripts', 'bench-js-yaml.js')} ${yamlFile}`;

    console.log(`\nBenchmarking ${size} YAML file...`);

    try {
      // Run hyperfine benchmark
      const hyperfineCmd = [
        'hyperfine',
        `--warmup ${WARMUP_RUNS}`,
        `--runs ${BENCHMARK_RUNS}`,
        `--show-output`,
        `--export-json ${path.join(dataDir, `bench-${size}.json`)}`,
        `--command-name "fast-yaml" "${fastYamlCmd}"`,
        `--command-name "js-yaml" "${jsYamlCmd}"`,
      ].join(' ');

      console.log(`Running: ${hyperfineCmd}`);
      const output = execSync(hyperfineCmd, { encoding: 'utf8' });
      console.log(output);

      // Parse results
      const benchResult = JSON.parse(
        fs.readFileSync(path.join(dataDir, `bench-${size}.json`), 'utf8')
      );

      // Extract relevant metrics
      const fastYamlResult = benchResult.results.find((r) => r.command === 'fast-yaml');
      const jsYamlResult = benchResult.results.find((r) => r.command === 'js-yaml');

      if (fastYamlResult && jsYamlResult) {
        const speedup = jsYamlResult.mean / fastYamlResult.mean;

        results.benchmarks[size] = {
          'fast-yaml': {
            mean: fastYamlResult.mean,
            min: fastYamlResult.min,
            max: fastYamlResult.max,
            stddev: fastYamlResult.stddev,
          },
          'js-yaml': {
            mean: jsYamlResult.mean,
            min: jsYamlResult.min,
            max: jsYamlResult.max,
            stddev: jsYamlResult.stddev,
          },
          speedup: speedup,
        };

        console.log(`\nResults for ${size}:`);
        console.log(`fast-yaml: ${(fastYamlResult.mean * 1000).toFixed(2)}ms`);
        console.log(`js-yaml: ${(jsYamlResult.mean * 1000).toFixed(2)}ms`);
        console.log(`Speedup: ${speedup.toFixed(2)}x`);
      }
    } catch (error) {
      console.error(`Error benchmarking ${size}:`, error.message);
    }
  }

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\nBenchmark results saved to ${RESULTS_FILE}`);

  // Generate summary
  console.log('\nBenchmark Summary:');
  console.log('=================');
  console.log('| Size  | fast-yaml (ms) | js-yaml (ms) | Speedup |');
  console.log('|-------|----------------|--------------|---------|');

  for (const size of YAML_SIZES) {
    if (results.benchmarks[size]) {
      const fastYamlMs = (results.benchmarks[size]['fast-yaml'].mean * 1000).toFixed(2);
      const jsYamlMs = (results.benchmarks[size]['js-yaml'].mean * 1000).toFixed(2);
      const speedup = results.benchmarks[size].speedup.toFixed(2);

      console.log(
        `| ${size.padEnd(5)} | ${fastYamlMs.padEnd(14)} | ${jsYamlMs.padEnd(12)} | ${speedup.padEnd(7)} |`
      );
    }
  }

  // Generate README update template
  generateReadmeTemplate(results);
}

// Generate README update template
function generateReadmeTemplate(results) {
  console.log('\nGenerating README update template...');

  let template = `## Benchmark Results

Current benchmark results show that js-yaml is faster than fast-yaml in this environment. This differs from the expected performance characteristics and may be due to the development state of the project.

| File Size | js-yaml | fast-yaml | Ratio (js-yaml:fast-yaml) |
|-----------|---------|-----------|---------------------------|
`;

  for (const size of YAML_SIZES) {
    if (results.benchmarks[size]) {
      const fastYamlMs = (results.benchmarks[size]['fast-yaml'].mean * 1000).toFixed(2);
      const jsYamlMs = (results.benchmarks[size]['js-yaml'].mean * 1000).toFixed(2);
      const speedup = results.benchmarks[size].speedup.toFixed(2);

      template += `| ${size} | ${jsYamlMs}ms | ${fastYamlMs}ms | 1:${(1 / speedup).toFixed(2)} |\n`;
    }
  }

  template += `\n_Benchmark run on ${new Date().toISOString().split('T')[0]} using Node.js ${process.version}_\n`;

  const templatePath = path.join(__dirname, 'README-benchmark-template.md');
  fs.writeFileSync(templatePath, template);

  console.log(`README update template saved to ${templatePath}`);
  console.log('You can copy this content to update the benchmark section in the main README.md');
}

// Main function
function main() {
  console.log('fast-yaml benchmark runner');
  console.log('=========================\n');

  try {
    // Check if hyperfine is installed
    execSync('hyperfine --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('Error: hyperfine is not installed. Please install it first:');
    console.error('  - macOS: brew install hyperfine');
    console.error('  - Linux: apt install hyperfine or equivalent');
    console.error('  - Windows: scoop install hyperfine or equivalent');
    process.exit(1);
  }

  try {
    generateTestFiles();
    createBenchmarkScripts();
    setupJsYaml();
    runBenchmarks();
  } finally {
    cleanupJsYaml();
  }

  console.log('\nBenchmark completed successfully!');
}

// Run the main function
main();
