## Benchmark Results

Current benchmark results show that js-yaml is faster than fast-yaml in this environment. This differs from the expected performance characteristics and may be due to the development state of the project.

| File Size | js-yaml | fast-yaml | Ratio (js-yaml:fast-yaml) |
|-----------|---------|-----------|---------------------------|
| 10KB | 26.82ms | 35.68ms | 1:1.33 |
| 100KB | 32.74ms | 37.55ms | 1:1.15 |
| 1MB | 58.98ms | 102.99ms | 1:1.75 |

_Benchmark run on 2025-05-10 using Node.js v20.19.0_
