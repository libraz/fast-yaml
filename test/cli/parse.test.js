/**
 * CLI Parse Command Smoke Test
 *
 * This test verifies that the CLI parse command works correctly.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Create a temporary directory for test files
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fast-yaml-test-'));
const yamlFile = path.join(tempDir, 'test.yaml');
const cliPath = path.resolve(__dirname, '../../bin/fast-yaml');

// Test YAML content
const yamlContent = `
# Test YAML file
string: Hello, World!
number: 42
boolean: true
null_value: null
array:
  - item1
  - item2
  - item3
nested:
  key1: value1
  key2: value2
  deep:
    deeper: deepest
`;

// Expected JSON output (formatted for comparison)
const expectedJson = {
  string: 'Hello, World!',
  number: 42,
  boolean: true,
  null_value: null,
  array: ['item1', 'item2', 'item3'],
  nested: {
    key1: 'value1',
    key2: 'value2',
    deep: {
      deeper: 'deepest'
    }
  }
};

describe('CLI Parse Command', () => {
  beforeAll(() => {
    // Write the test YAML file
    fs.writeFileSync(yamlFile, yamlContent);
  });

  afterAll(() => {
    // Clean up the temporary directory
    fs.unlinkSync(yamlFile);
    fs.rmdirSync(tempDir);
  });

  test('parses a YAML file correctly', () => {
    // Run the CLI command
    const output = execSync(`node ${cliPath} parse ${yamlFile}`, { encoding: 'utf8' });

    // Parse the JSON output
    const result = JSON.parse(output);

    // Verify the result
    expect(result).toEqual(expectedJson);
  });

  test('handles errors for invalid YAML', () => {
    // Create an invalid YAML file
    const invalidYamlFile = path.join(tempDir, 'invalid.yaml');
    fs.writeFileSync(invalidYamlFile, 'invalid: yaml: content: - not properly formatted');

    // Run the CLI command and expect it to fail
    expect(() => {
      execSync(`node ${cliPath} parse ${invalidYamlFile}`, { encoding: 'utf8' });
    }).toThrow();

    // Clean up
    fs.unlinkSync(invalidYamlFile);
  });

  test('handles large YAML files', () => {
    // Create a large YAML file
    const largeYamlFile = path.join(tempDir, 'large.yaml');
    let largeContent = 'items:\n';

    // Generate 1000 items
    for (let i = 0; i < 1000; i++) {
      largeContent += `  - id: item${i}\n    value: ${i}\n`;
    }

    fs.writeFileSync(largeYamlFile, largeContent);

    // Run the CLI command
    const output = execSync(`node ${cliPath} parse ${largeYamlFile}`, { encoding: 'utf8' });

    // Parse the JSON output
    const result = JSON.parse(output);

    // Verify the result has 1000 items
    expect(result.items).toHaveLength(1000);
    expect(result.items[0].id).toBe('item0');
    expect(result.items[999].id).toBe('item999');

    // Clean up
    fs.unlinkSync(largeYamlFile);
  });

  test('handles UTF-8 BOM correctly', () => {
    // Create a YAML file with UTF-8 BOM
    const bomYamlFile = path.join(tempDir, 'bom.yaml');
    const bomContent = '\uFEFF' + 'bom: true\ntext: UTF-8 with BOM';

    fs.writeFileSync(bomYamlFile, bomContent);

    // Run the CLI command
    const output = execSync(`node ${cliPath} parse ${bomYamlFile}`, { encoding: 'utf8' });

    // Parse the JSON output
    const result = JSON.parse(output);

    // Verify the result
    expect(result).toEqual({
      bom: true,
      text: 'UTF-8 with BOM'
    });

    // Clean up
    fs.unlinkSync(bomYamlFile);
  });
});
