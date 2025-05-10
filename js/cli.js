#!/usr/bin/env node

/**
 * fast-yaml CLI - Command-line interface for the fast-yaml library
 *
 * This CLI tool provides command-line access to the fast-yaml library's functionality.
 */

const fs = require('fs');
const path = require('path');
const fastYaml = require('./index.cjs');

// Parse command-line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

/**
 * Print help information
 */
function printHelp() {
  console.log(`
fast-yaml - High-performance YAML parser with js-yaml API compatibility

Usage:
  fast-yaml <command> [options] [file]

Commands:
  parse <file>         Parse a YAML file to JSON
  validate <file> <schema>  Validate a YAML file against a JSON Schema
  query <file> <path>  Query a YAML file using a YAMLPath expression
  version              Show version information
  help                 Show this help information

Examples:
  fast-yaml parse config.yaml
  fast-yaml validate config.yaml schema.json
  fast-yaml query config.yaml '.services[*].name'
  `);
}

/**
 * Print version information
 */
function printVersion() {
  console.log(`fast-yaml v${fastYaml.version()}`);
}

/**
 * Read a file
 *
 * @param {string} filePath - Path to the file
 * @returns {string} File contents
 */
function readFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove UTF-8 BOM if present
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    return content;
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Parse a YAML file
 *
 * @param {string} filePath - Path to the YAML file
 */
function parseFile(filePath) {
  if (!filePath) {
    console.error('Error: No file specified');
    process.exit(1);
  }

  const yaml = readFile(filePath);
  try {
    const result = fastYaml.parse(yaml);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error parsing YAML: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Validate a YAML file against a JSON Schema
 *
 * @param {string} filePath - Path to the YAML file
 * @param {string} schemaPath - Path to the JSON Schema file
 */
function validateFile(filePath, schemaPath) {
  if (!filePath || !schemaPath) {
    console.error('Error: Both YAML file and schema file must be specified');
    process.exit(1);
  }

  const yaml = readFile(filePath);
  const schemaJson = readFile(schemaPath);

  try {
    const schema = JSON.parse(schemaJson);
    const result = fastYaml.validate(yaml, schema);

    if (result.valid) {
      console.log('Validation successful');
    } else {
      console.error('Validation failed:');
      result.errors.forEach((error) => {
        console.error(`- ${error.message} at ${error.path}`);
      });
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error validating YAML: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Query a YAML file using a YAMLPath expression
 *
 * @param {string} filePath - Path to the YAML file
 * @param {string} yamlPath - YAMLPath expression
 */
function queryFile(filePath, yamlPath) {
  if (!filePath || !yamlPath) {
    console.error('Error: Both YAML file and YAMLPath must be specified');
    process.exit(1);
  }

  const yaml = readFile(filePath);
  try {
    const result = fastYaml.query(yaml, yamlPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error querying YAML: ${error.message}`);
    process.exit(1);
  }
}

// Execute the appropriate command
switch (command) {
  case 'parse':
    parseFile(args[1]);
    break;
  case 'validate':
    validateFile(args[1], args[2]);
    break;
  case 'query':
    queryFile(args[1], args[2]);
    break;
  case 'version':
    printVersion();
    break;
  case 'help':
  default:
    printHelp();
    break;
}
