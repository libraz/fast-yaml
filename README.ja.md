# fast-yaml

js-yaml API互換のYAMLパーサー、RustとWebAssemblyを活用。

Rust×Wasmでjs製ライブラリを置き換えるべく「fast」を名乗って開発したものの、いざ蓋を開けたら本家より遅かった――というオチも一緒にお楽しみください。

そのためnpm公開は見送り、このリポジトリは実験リファレンス的な位置づけで維持しています。

## 概要

fast-yamlは、Rust製YAMLパーサー（yaml-rust2）をWebAssembly化し、npm経由で配布することでjs-yamlを安全に置換するライブラリです。

主な特徴：

- **100% API互換**: js-yamlの`parse`/`load`/`parseAll`/`loadAll`関数をそのまま置換可能
- **YAML 1.2準拠 + コメント保持**: YAML Test Suite完全合格を目標
- **クロスプラットフォーム**: 単一.wasmでWindows/macOS/Linux対応、npm install失敗ゼロ
- **UX向上**: npx fast-yamlによるCLI利用

## インストール

```bash
npm install fast-yaml
# または
yarn add fast-yaml
```

## 使用方法

### JavaScript/TypeScript

```javascript
// ESモジュール
import { parse, load, parseAll, loadAll } from 'fast-yaml';

// CommonJS
const { parse, load, parseAll, loadAll } = require('fast-yaml');

// 単一のYAMLドキュメントをパース
const yaml = `
foo: bar
baz:
  - qux
  - quux
`;

const result = parse(yaml);
console.log(result);
// { foo: 'bar', baz: ['qux', 'quux'] }

// 複数のYAMLドキュメントをパース
const multiDocYaml = `
---
document: 1
...
---
document: 2
...
`;

const documents = parseAll(multiDocYaml);
console.log(documents);
// [{ document: 1 }, { document: 2 }]
```

### YAMLPathクエリ

```javascript
import { query } from 'fast-yaml';

const yaml = `
services:
  - name: service1
    port: 8080
  - name: service2
    port: 8081
`;

const names = query(yaml, '.services[*].name');
console.log(names);
// ['service1', 'service2']
```

### JSON Schemaバリデーション

```javascript
import { validate } from 'fast-yaml';

const yaml = `
name: John Doe
age: 30
`;

const schema = {
  type: 'object',
  required: ['name', 'age'],
  properties: {
    name: { type: 'string' },
    age: { type: 'integer', minimum: 0 }
  }
};

const result = validate(yaml, schema);
console.log(result.valid); // true
```

### ストリーミングパース

```javascript
import { parseStream } from 'fast-yaml';

const yaml = fs.readFileSync('large-file.yaml', 'utf8');

parseStream(yaml, (chunk) => {
  console.log('Received chunk:', chunk);
}, { chunkSize: 64 * 1024 });
```

### CLIツール

```bash
# YAMLファイルをJSONに変換
npx fast-yaml parse config.yaml

# YAMLファイルをJSON Schemaでバリデーション
npx fast-yaml validate config.yaml schema.json

# YAMLファイルをYAMLPathでクエリ
npx fast-yaml query config.yaml '.services[*].name'

# バージョン情報を表示
npx fast-yaml version

# ヘルプを表示
npx fast-yaml help
```

## ライセンス

MITライセンス
