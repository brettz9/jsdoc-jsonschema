#!/usr/bin/env node

import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import {cliBasics} from 'command-line-basics';
import {jsdocFileToJsonSchema} from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const optionDefinitions = await cliBasics(
  join(__dirname, '../src/optionDefinitions.js')
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
