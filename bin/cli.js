#!/usr/bin/env node

import {cliBasics} from 'command-line-basics';
import {jsdocFileToJsonSchema} from '../src/index.js';

const optionDefinitions = await cliBasics(
  import.meta.dirname + '/../src/optionDefinitions.js',
  {
    packageJsonPath: import.meta.dirname + '/../package.json'
  }
);

if (!optionDefinitions) { // cliBasics handled
  process.exit();
}

try {
  await jsdocFileToJsonSchema(optionDefinitions);
  console.log(`Finished writing files!`);
} catch (err) {
  console.error(err);
  process.exit();
}
