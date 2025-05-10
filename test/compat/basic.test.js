/**
 * js-yaml Compatibility Tests
 *
 * This test file tests the compatibility between fast-yaml and js-yaml.
 */

const fastYaml = require('../../js/index.cjs');
// 実際のテストでは、js-yamlをインストールしてインポートする必要があります
// const jsYaml = require('js-yaml');

describe('js-yaml Compatibility Tests', () => {
  describe('Basic YAML Parsing', () => {
    test('can parse simple objects', () => {
      const yaml = `
foo: bar
baz: 123
`;
      const expected = {
        foo: 'bar',
        baz: 123
      };

      const result = fastYaml.parse(yaml);
      // const jsYamlResult = jsYaml.load(yaml);

      expect(result).toEqual(expected);
      // expect(result).toEqual(jsYamlResult);
    });

    test('can parse nested objects', () => {
      const yaml = `
foo:
  bar:
    baz: qux
  quux: corge
`;
      const expected = {
        foo: {
          bar: {
            baz: 'qux'
          },
          quux: 'corge'
        }
      };

      const result = fastYaml.parse(yaml);
      // const jsYamlResult = jsYaml.load(yaml);

      expect(result).toEqual(expected);
      // expect(result).toEqual(jsYamlResult);
    });

    test('can parse arrays', () => {
      const yaml = `
- foo
- bar
- baz
`;
      const expected = ['foo', 'bar', 'baz'];

      const result = fastYaml.parse(yaml);
      // const jsYamlResult = jsYaml.load(yaml);

      expect(result).toEqual(expected);
      // expect(result).toEqual(jsYamlResult);
    });

    test('can parse complex data structures', () => {
      const yaml = `
foo:
  - bar
  - baz
  - qux:
      quux: corge
      grault:
        - garply
        - waldo
`;
      const expected = {
        foo: [
          'bar',
          'baz',
          {
            qux: {
              quux: 'corge',
              grault: ['garply', 'waldo']
            }
          }
        ]
      };

      const result = fastYaml.parse(yaml);
      // const jsYamlResult = jsYaml.load(yaml);

      expect(result).toEqual(expected);
      // expect(result).toEqual(jsYamlResult);
    });
  });

  describe('Multiple Document Parsing', () => {
    test('can parse multiple YAML documents', () => {
      const yaml = `
---
foo: bar
...
---
baz: qux
...
`;
      const expected = [
        { foo: 'bar' },
        { baz: 'qux' }
      ];

      const result = fastYaml.parseAll(yaml);
      // const jsYamlResult = jsYaml.loadAll(yaml);

      expect(result).toEqual(expected);
      // expect(result).toEqual(jsYamlResult);
    });
  });

  describe('Error Handling', () => {
    test('throws error for invalid YAML', () => {
      const yaml = `
foo: bar
  baz: qux
`;

      expect(() => {
        fastYaml.parse(yaml);
      }).toThrow();

      // expect(() => {
      //   jsYaml.load(yaml);
      // }).toThrow();
    });
  });
});
