/**
 * fast-yaml - High-performance YAML parser with js-yaml API compatibility
 *
 * This library provides a WebAssembly-based YAML parser that is API-compatible with js-yaml
 * but uses the high-performance yaml-rust2 Rust library under the hood.
 *
 * @module fast-yaml
 */

// Variable for lazy initialization and caching of WASM module
let wasmModule = null;

/**
 * Get the WASM module
 * Initializes the module only on first call, then returns the cached instance
 *
 * @returns {Object} Initialized WASM module with all exported functions
 */
async function getWasmModule() {
  if (wasmModule === null) {
    // Dynamic import for ESM - this allows lazy loading
    wasmModule = await import('../pkg/fast_yaml.js'); // eslint-disable-line import/extensions
  }
  return wasmModule;
}

/**
 * YAMLException class for js-yaml compatibility
 *
 * This class extends Error to provide the same error structure as js-yaml's YAMLException.
 */
export class YAMLException extends Error {
  /**
   * Create a new YAMLException
   *
   * @param {string} message - Error message
   * @param {Object} [options] - Additional error information
   * @param {number} [options.mark] - Mark position in the source
   * @param {number} [options.line] - Line number (1-based)
   * @param {number} [options.column] - Column number (1-based)
   * @param {string} [options.snippet] - Code snippet around the error
   * @param {string} [options.reason] - Reason for the error
   */
  constructor(message, options = {}) {
    super(message);
    this.name = 'YAMLException';

    // Add js-yaml compatible properties
    this.reason = options.reason || message;
    this.mark = options.mark || null;
    this.line = options.line || null;
    this.column = options.column || null;
    this.snippet = options.snippet || null;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert the exception to a string representation
   *
   * @returns {string} String representation of the error
   */
  toString() {
    let result = `${this.name}: `;

    if (this.reason) {
      result += this.reason;
    }

    if (this.line !== null) {
      result += ` at line ${this.line}`;

      if (this.column !== null) {
        result += `, column ${this.column}`;
      }
    }

    return result;
  }
}

/**
 * Common error handling function
 *
 * @param {Error} error - Original error
 * @throws {YAMLException} Converted YAMLException
 */
function handleYamlError(error) {
  const errorMsg = error.toString();
  const lineMatch = errorMsg.match(/line (\d+)/i);
  const columnMatch = errorMsg.match(/column (\d+)/i);

  throw new YAMLException(errorMsg, {
    reason: errorMsg,
    line: lineMatch ? parseInt(lineMatch[1], 10) : null,
    column: columnMatch ? parseInt(columnMatch[1], 10) : null,
  });
}

/**
 * Parse a YAML string into a JavaScript object
 *
 * @param {string} input - YAML string to parse
 * @param {Object} [options] - Parsing options
 * @returns {Object} Parsed JavaScript object
 * @throws {YAMLException} If the YAML string is invalid
 */
export async function parseYAML(input, _options = {}) {
  try {
    const module = await getWasmModule();
    return module.parse(input);
  } catch (error) {
    return handleYamlError(error);
  }
}

/**
 * Parse all YAML documents in a string into an array of JavaScript objects
 *
 * @param {string} input - YAML string containing multiple documents
 * @param {Object} [options] - Parsing options
 * @returns {Array} Array of parsed JavaScript objects
 */
export async function parseAllYAML(input, _options = {}) {
  try {
    const module = await getWasmModule();
    return module.parse_all(input);
  } catch (error) {
    return handleYamlError(error);
  }
}

/**
 * Parse a YAML string with schema validation into a JavaScript object
 *
 * @param {string} input - YAML string to parse
 * @param {Object} [options] - Parsing options
 * @returns {Object} Parsed JavaScript object
 * @throws {YAMLException} If the YAML string is invalid
 */
export async function loadYAML(input, _options = {}) {
  try {
    const module = await getWasmModule();
    return module.load(input);
  } catch (error) {
    return handleYamlError(error);
  }
}

/**
 * Parse all YAML documents in a string with schema validation into an array of JavaScript objects
 *
 * @param {string} input - YAML string containing multiple documents
 * @param {Object} [options] - Parsing options
 * @returns {Array} Array of parsed JavaScript objects
 */
export async function loadAllYAML(input, _options = {}) {
  try {
    const module = await getWasmModule();
    return module.load_all(input);
  } catch (error) {
    return handleYamlError(error);
  }
}

/**
 * Validate a YAML document against a JSON Schema
 *
 * @param {string} yaml - YAML document to validate
 * @param {Object} schema - JSON Schema to validate against
 * @returns {Object} Validation result with success flag and any errors
 */
export async function validateYAML(yaml, schema) {
  try {
    const module = await getWasmModule();
    return module.validate(yaml, schema);
  } catch (error) {
    return handleYamlError(error);
  }
}

/**
 * Query a YAML document using a YAMLPath expression
 *
 * @param {string} yaml - YAML document to query
 * @param {string} path - YAMLPath expression
 * @returns {Array} Array of matching values
 */
export async function queryYAML(yaml, path) {
  try {
    const module = await getWasmModule();
    return module.query(yaml, path);
  } catch (error) {
    return handleYamlError(error);
  }
}

/**
 * Parse a YAML document in a streaming fashion
 *
 * @param {string} yaml - YAML document to parse
 * @param {Function} callback - Callback function to receive parsed chunks
 * @param {Object} [options] - Parsing options
 * @returns {Promise} Promise that resolves when parsing is complete
 */
export async function parseStreamYAML(yaml, callback, options = {}) {
  try {
    const module = await getWasmModule();
    return module.parse_stream(yaml, callback, options);
  } catch (error) {
    return handleYamlError(error);
  }
}

/**
 * Get the version of the fast-yaml library
 *
 * @returns {string} Version string
 */
export async function getVersion() {
  try {
    const module = await getWasmModule();
    return module.version();
  } catch (error) {
    // Version function should not throw, but handle it just in case
    console.error('Error getting version:', error);
    return 'unknown';
  }
}

// For js-yaml API compatibility
export const parse = parseYAML;
export const parseAll = parseAllYAML;
export const load = loadYAML;
export const loadAll = loadAllYAML;

// Export YAMLException for users who need to catch or check error types

// Default export for convenience
export default {
  parse: parseYAML,
  parseAll: parseAllYAML,
  load: loadYAML,
  loadAll: loadAllYAML,
  validate: validateYAML,
  query: queryYAML,
  parseStream: parseStreamYAML,
  version: getVersion,

  // Add a helper method to preload the WASM module
  preload: async () => {
    await getWasmModule();
    return true;
  },
};
