/**
 * fast-yaml - High-performance YAML parser with js-yaml API compatibility
 * 
 * Type definitions for TypeScript
 */

/**
 * Parse a YAML string into a JavaScript object
 * 
 * @param input - YAML string to parse
 * @param options - Parsing options
 * @returns Parsed JavaScript object
 */
export function parse(input: string, options?: object): any;

/**
 * Parse all YAML documents in a string into an array of JavaScript objects
 * 
 * @param input - YAML string containing multiple documents
 * @param options - Parsing options
 * @returns Array of parsed JavaScript objects
 */
export function parseAll(input: string, options?: object): any[];

/**
 * Parse a YAML string with schema validation into a JavaScript object
 * 
 * @param input - YAML string to parse
 * @param options - Parsing options
 * @returns Parsed JavaScript object
 */
export function load(input: string, options?: object): any;

/**
 * Parse all YAML documents in a string with schema validation into an array of JavaScript objects
 * 
 * @param input - YAML string containing multiple documents
 * @param options - Parsing options
 * @returns Array of parsed JavaScript objects
 */
export function loadAll(input: string, options?: object): any[];

/**
 * Validate a YAML document against a JSON Schema
 * 
 * @param yaml - YAML document to validate
 * @param schema - JSON Schema to validate against
 * @returns Validation result with success flag and any errors
 */
export function validate(yaml: string, schema: object): {
  valid: boolean;
  errors: Array<{
    message: string;
    path: string;
  }>;
};

/**
 * Query a YAML document using a YAMLPath expression
 * 
 * @param yaml - YAML document to query
 * @param path - YAMLPath expression
 * @returns Array of matching values
 */
export function query(yaml: string, path: string): any[];

/**
 * Parse a YAML document in a streaming fashion
 * 
 * @param yaml - YAML document to parse
 * @param callback - Callback function to receive parsed chunks
 * @param options - Parsing options
 * @returns Promise that resolves when parsing is complete
 */
export function parseStream(
  yaml: string,
  callback: (chunk: any) => void,
  options?: {
    chunkSize?: number;
    [key: string]: any;
  }
): Promise<void>;

/**
 * Get the version of the fast-yaml library
 * 
 * @returns Version string
 */
export function version(): string;

// Legacy aliases for compatibility
export const parseYAML: typeof parse;
export const parseAllYAML: typeof parseAll;
export const loadYAML: typeof load;
export const loadAllYAML: typeof loadAll;
export const validateYAML: typeof validate;
export const queryYAML: typeof query;
export const parseStreamYAML: typeof parseStream;
export const getVersion: typeof version;

// Default export
export default {
  parse,
  parseAll,
  load,
  loadAll,
  validate,
  query,
  parseStream,
  version,
};