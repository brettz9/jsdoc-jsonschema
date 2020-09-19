#!/usr/bin/env node
'use strict';

const {join} = require('path');

const {cliBasics} = require('command-line-basics');
const {jsdocFileToJsonSchema} = require('../src/index.js');

const optionDefinitions = cliBasics(
  join(__dirname, '../src/optionDefinitions.js')
);

if (!optionDefinitions) { // cliBasics handled
  process.exit();
}

(async () => {
try {
  await jsdocFileToJsonSchema(optionDefinitions);
  console.log(`Finished writing files!`);
} catch (err) {
  console.error(err);
  process.exit();
}
})();
