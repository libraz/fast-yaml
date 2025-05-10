
const fs = require('fs');
// Note: js-yaml needs to be installed separately
const jsYaml = require('js-yaml');

const file = process.argv[2];
const yaml = fs.readFileSync(file, 'utf8');
jsYaml.load(yaml);
  