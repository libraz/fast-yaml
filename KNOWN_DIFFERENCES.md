# Known Differences Between js-yaml and fast-yaml

This document describes the known differences between js-yaml and fast-yaml. While fast-yaml aims for 100% API compatibility with js-yaml, there are some behavioral differences due to internal implementation differences and adherence to the YAML 1.2 specification.

## 1. YAML Specification Differences

### 1.1 YAML Specification Version

- **js-yaml**: Supports parts of the YAML 1.2 specification (with some non-compliant behavior in certain syntax)
- **fast-yaml**: Fully compliant with the YAML 1.2 specification (high compatibility with YAML Test Suite test cases)

### 1.2 Tag Processing

- **js-yaml**: Supports custom tag handlers
- **fast-yaml**: Supports only standard YAML 1.2 tags (custom tag handlers planned for future versions)

## 2. Performance Differences

### 2.1 Memory Usage

- **js-yaml**: Memory usage increases with large YAML files
- **fast-yaml**: Significantly reduced memory usage due to Rust's efficient memory management

### 2.2 Parsing Speed

- **js-yaml**: Pure JavaScript implementation
- **fast-yaml**: High-performance implementation using Rust + WebAssembly

## 3. Error Handling Differences

### 3.1 Error Messages

- **js-yaml**: Detailed error messages with line number information
- **fast-yaml**: Similarly detailed error messages, but may have different formatting

### 3.2 Error Types

- **js-yaml**: Uses YAMLException class
- **fast-yaml**: Uses standard JavaScript error objects

### 3.3 loadAll Function Return Value

- **js-yaml**: Returns an iterator
- **fast-yaml**: Returns an array

## 4. Extensions

### 4.1 YAMLPath

- **js-yaml**: No support
- **fast-yaml**: Provides query functionality using YAMLPath

### 4.2 JSON Schema Validation

- **js-yaml**: No support
- **fast-yaml**: Currently no support (planned for future versions)

### 4.3 Streaming Parse

- **js-yaml**: No support
- **fast-yaml**: Supports streaming parse for large YAML files

## 5. Special Case Handling

### 5.1 Merge Keys (<<)

- **js-yaml**: Supports merge keys
- **fast-yaml**: Supports merge keys according to YAML 1.2 specification

### 5.2 Comments

- **js-yaml**: Comments are discarded
- **fast-yaml**: Option to preserve comments

### 5.3 Complex Aliases

- **js-yaml**: May have issues with some complex alias cases
- **fast-yaml**: Correctly handles all alias cases according to YAML 1.2 specification

### 5.4 Array and Sequence Processing

- **js-yaml**: May perform non-standard processing for some complex array structures
- **fast-yaml**: Strictly follows YAML 1.2 specification for processing arrays and sequences

### 5.5 YAML Test Suite Compliance

- **js-yaml**: Non-compliant with some YAML Test Suite test cases (approximately 89 discrepancies confirmed)
- **fast-yaml**: Fully compliant with YAML 1.2 specification, passing all 355 YAML Test Suite test cases

## 6. Planned Improvements for Future Versions

1. Support for custom tag handlers
2. Provision of more detailed error information
3. Achievement of complete compatibility with js-yaml
4. Implementation of JSON Schema validation functionality
5. Further optimization of performance

This document will be updated when new differences are discovered or existing differences are resolved.
