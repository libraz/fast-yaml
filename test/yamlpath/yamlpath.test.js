/**
 * YAMLPath Tests
 *
 * This test file tests the YAMLPath functionality of fast-yaml.
 */

const fastYaml = require('../../js/index.cjs');

describe('YAMLPath Tests', () => {
  const sampleYaml = `
# Sample YAML
version: 1.0
services:
  - name: service1
    port: 8080
    enabled: true
    config:
      timeout: 30
      retries: 3
  - name: service2
    port: 8081
    enabled: false
    config:
      timeout: 60
      retries: 5
environments:
  dev:
    url: https://dev.example.com
    debug: true
  prod:
    url: https://prod.example.com
    debug: false
`;

  describe('Basic Paths', () => {
    test('can retrieve root level properties', () => {
      const result = fastYaml.query(sampleYaml, '.version');
      expect(result).toEqual([1.0]);
    });

    test('can retrieve nested properties', () => {
      const result = fastYaml.query(sampleYaml, '.environments.dev.url');
      expect(result).toEqual(['https://dev.example.com']);
    });
  });

  describe('Array Access', () => {
    test('can access array elements by index', () => {
      const result = fastYaml.query(sampleYaml, '.services[0].name');
      expect(result).toEqual(['service1']);
    });

    test('can access all array elements', () => {
      const result = fastYaml.query(sampleYaml, '.services[*].name');
      expect(result).toEqual(['service1', 'service2']);
    });

    test('can filter array elements', () => {
      const result = fastYaml.query(sampleYaml, '.services[?(@.enabled==true)].name');
      expect(result).toEqual(['service1']);
    });
  });

  describe('Complex Queries', () => {
    test('can use multiple filters', () => {
      const result = fastYaml.query(
        sampleYaml,
        '.services[?(@.port>8080&&@.config.retries>3)].name'
      );
      expect(result).toEqual(['service2']);
    });

    test('can use wildcard with nested properties', () => {
      const result = fastYaml.query(sampleYaml, '.environments.*.url');
      expect(result).toEqual(['https://dev.example.com', 'https://prod.example.com']);
    });

    test('can use recursive descent', () => {
      const result = fastYaml.query(sampleYaml, '$..timeout');
      expect(result).toEqual([30, 60]);
    });
  });

  describe('Error Handling', () => {
    test('returns empty array for non-existent paths', () => {
      const result = fastYaml.query(sampleYaml, '.nonexistent.path');
      expect(result).toEqual([]);
    });

    test('throws error for invalid path syntax', () => {
      expect(() => {
        fastYaml.query(sampleYaml, '.services[invalid]');
      }).toThrow();
    });
  });
});
