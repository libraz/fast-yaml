# fast-yaml

A YAML parser with js-yaml API compatibility, powered by Rust and WebAssembly.

## Overview

fast-yaml is a library that wraps the Rust YAML parser (yaml-rust2) in WebAssembly and distributes it via npm, providing a drop-in replacement for js-yaml.

Key features:

- **100% API Compatible**: Direct replacement for js-yaml's `parse`/`load`/`parseAll`/`loadAll` functions
- **YAML 1.2 Compliant + Comment Preservation**: Aims for full YAML Test Suite compliance
- **Cross-Platform**: Single .wasm file for Windows/macOS/Linux, zero npm install failures
- **Enhanced UX**: CLI usage via npx fast-yaml

## Installation

```bash
npm install fast-yaml
# or
yarn add fast-yaml
```

## Usage

### JavaScript/TypeScript

```javascript
// ES Modules
import { parse, load, parseAll, loadAll } from 'fast-yaml';

// CommonJS
const { parse, load, parseAll, loadAll } = require('fast-yaml');

// Parse a single YAML document
const yaml = `
foo: bar
baz:
  - qux
  - quux
`;

const result = parse(yaml);
console.log(result);
// { foo: 'bar', baz: ['qux', 'quux'] }

// Parse multiple YAML documents
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

### YAMLPath Queries

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

### JSON Schema Validation

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

### Streaming Parse

```javascript
import { parseStream } from 'fast-yaml';

const yaml = fs.readFileSync('large-file.yaml', 'utf8');

parseStream(yaml, (chunk) => {
  console.log('Received chunk:', chunk);
}, { chunkSize: 64 * 1024 });
```

### CLI Tool

```bash
# Convert YAML file to JSON
npx fast-yaml parse config.yaml

# Validate YAML file with JSON Schema
npx fast-yaml validate config.yaml schema.json

# Query YAML file with YAMLPath
npx fast-yaml query config.yaml '.services[*].name'

# Display version information
npx fast-yaml version

# Display help
npx fast-yaml help
```

## License

MIT License
