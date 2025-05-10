
const fs = require('fs');
const fastYaml = require('../../../js/index.cjs');

const file = process.argv[2];
const yaml = fs.readFileSync(file, 'utf8');
fastYaml.load(yaml);
  