module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: ['js/**/*.js', 'js/**/*.mjs', '!js/cli.js', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  verbose: true,
  maxWorkers: '50%',
  reporters: ['default', ['jest-junit', { outputDirectory: './test-results' }]],
};
