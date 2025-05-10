module.exports = {
  env: {
    node: true,
    browser: true,
    es2020: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        mjs: 'never',
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.test.js',
          '**/*.spec.js',
          'test/**/*.js',
        ],
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.mjs'],
      },
    },
  },
  overrides: [
    {
      files: ['*.mjs'],
      rules: {
        'import/no-commonjs': 'error',
      },
    },
    {
      files: ['*.cjs', 'js/cli.js'],
      rules: {
        'import/no-commonjs': 'off',
      },
    },
  ],
};