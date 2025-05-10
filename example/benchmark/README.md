# fast-yaml Benchmarks

This directory contains benchmarking tools for comparing the performance of fast-yaml against js-yaml.

## Requirements

- Node.js v20 or later
- [hyperfine](https://github.com/sharkdp/hyperfine) - A command-line benchmarking tool

## Installation

```bash
# Install hyperfine
# macOS
brew install hyperfine

# Ubuntu/Debian
apt install hyperfine

# Windows (via scoop)
scoop install hyperfine
```

## Running the Benchmarks

To run the benchmarks:

```bash
node run-benchmark.js
```

This will:

1. Generate test YAML files of various sizes (10KB, 100KB, 1MB)
2. Create benchmark scripts for both fast-yaml and js-yaml
3. Temporarily install js-yaml in a separate directory (not in your project)
4. Run the benchmarks using hyperfine
5. Generate a results summary and a README template for updating the main README.md

## How It Works

The benchmark process:

1. **Test Data Generation**: Creates synthetic YAML files with nested structures
2. **Temporary Setup**: Installs js-yaml in a temporary directory to avoid adding it to your project
3. **Measurement**: Uses hyperfine to accurately measure parsing performance
4. **Cleanup**: Removes all temporary files and installations after benchmarking

## Updating the README

After running the benchmarks, a template file `README-benchmark-template.md` will be generated. You can copy the content from this file to update the benchmark section in the main README.md.

## Notes

- The benchmark results may vary depending on your hardware and system load
- For the most accurate results, close other applications while running benchmarks
- The benchmark runs each test multiple times with warmup cycles to ensure accuracy
