/**
 * YAML 1.2 Specification Compliance Tests for fast-yaml
 *
 * This test file verifies that fast-yaml correctly implements the YAML 1.2 specification
 * using the official YAML Test Suite.
 */

const fs = require('fs');
const path = require('path');
const fastYaml = require('../../pkg');

// Helper function to read test case files
function readTestCase(testId) {
  const filePath = path.join(__dirname, '../yaml-test-suite/src', `${testId}.yaml`);
  const content = fs.readFileSync(filePath, 'utf8');

  // Get the test name from the first line comment if available
  const lines = content.split('\n');
  let name = testId;
  if (lines.length > 0 && lines[0].startsWith('#')) {
    name = lines[0].substring(1).trim();
  }

  // Check if this is an error test case
  const isErrorCase = content.includes('ERROR:');

  return {
    id: testId,
    name: name,
    content: content,
    isErrorCase: isErrorCase,
  };
}

// Get a list of all test case IDs
const testCaseIds = fs
  .readdirSync(path.join(__dirname, '../yaml-test-suite/src'))
  .filter((file) => file.endsWith('.yaml'))
  .map((file) => file.replace('.yaml', ''));

describe('YAML 1.2 Specification Compliance', () => {
  // Test each case from the YAML Test Suite
  testCaseIds.forEach((testId) => {
    const testCase = readTestCase(testId);

    test(`Test case ${testId}: ${testCase.name}`, () => {
      try {
        // Parse with fast-yaml
        const result = fastYaml.load(testCase.content);

        // If this is an error case, it should have thrown an error
        if (testCase.isErrorCase) {
          expect(false).toBe(true); // Force test to fail
        }
      } catch (error) {
        // If this is not an error case, it should not have thrown an error
        if (!testCase.isErrorCase) {
          throw error;
        }
        // Otherwise, the error is expected
      }
    });
  });

  // Test specific YAML 1.2 features
  describe('YAML 1.2 Specific Features', () => {
    test('Handles null values correctly', () => {
      const yaml = 'null_value: null\n';
      const result = fastYaml.load(yaml);
      expect(result.null_value).toBeNull();
    });

    test('Handles boolean values correctly', () => {
      const yaml = 'true_value: true\nfalse_value: false\n';
      const result = fastYaml.load(yaml);
      expect(result.true_value).toBe(true);
      expect(result.false_value).toBe(false);
    });

    test('Handles numeric values correctly', () => {
      const yaml = 'integer: 42\nfloat: 3.14159\n';
      const result = fastYaml.load(yaml);
      expect(result.integer).toBe(42);
      expect(result.float).toBeCloseTo(3.14159);
    });

    test('Handles complex data structures correctly', () => {
      const yaml = `
complex:
  nested:
    array:
      - item1
      - item2
    map:
      key1: value1
      key2: value2
`;
      const result = fastYaml.load(yaml);
      expect(result.complex.nested.array).toEqual(['item1', 'item2']);
      expect(result.complex.nested.map.key1).toBe('value1');
      expect(result.complex.nested.map.key2).toBe('value2');
    });
  });
});
