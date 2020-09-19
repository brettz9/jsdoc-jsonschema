'use strict';

const pkg = require('../package.json');

// Todo: We really ought to dogfood this based on `src/index.js`, and
//  even have a library to auto-convert JSON Schema into the structure below,
//  with jsdoc (and the converted JSON Schema) enhanced to add CLI properties,
//  e.g., any alias (`@cli-alias {file} f`) and possibly its `typeLabel`.
//  Probably also need to add whitelist option so only get desired typedef
//  and its parents out of a file.
//  Might also see about https://github.com/dsheiko/bycontract/
/* eslint-disable jsdoc/require-property -- Should build schema */
/**
* @typedef {PlainObject} JsdocFileJsonSchemaOptions
*/
/* eslint-enable jsdoc/require-property -- Should build schema */

const getChalkTemplateSingleEscape = (s) => {
  return s.replace(/[{}\\]/gu, (ch) => {
    return `\\u${ch.codePointAt().toString(16).padStart(4, '0')}`;
  });
};

const optionDefinitions = [
  {
    name: 'file', type: String, multiple: true,
    defaultOption: true,
    description: 'Repeat for each file you wish to be ' +
      'converted. Required.',
    typeLabel: '{underline file path}'
  },
  {
    name: 'space', type (val) {
      const numVal = Number(val);
      if (Number.isInteger(numVal)) {
        return numVal;
      }
      // eslint-disable-next-line prefer-named-capture-group -- Simple
      return val.replace(/['"](.*)['"]/u, '$1');
    },
    description: 'Used as the third `space` argument of `JSON.stringify`. ' +
      'Defaults to `2`.',
    typeLabel: '{underline number of spaces or string for spacing}'
  },
  {
    name: 'preferInteger', type: Boolean,
    description: 'Whether to prefer the creation of `integer` type over ' +
      '`number` when possible. Defaults to `false`'
  },
  {
    name: 'tolerateCase', type: Boolean,
    description: 'Whether to tolerate casing of type references. ' +
      'Defaults to `true`.'
  },
  {
    name: 'throwOnUnrecognizedName', type: Boolean,
    description: 'Whether to throw on encountering an unrecognized type ' +
      'name. Defaults to `true`.'
  },
  {
    name: '$defs', type: Boolean,
    description: 'Whether to output as `$defs` object. Necessary for ' +
      'hierarchical type definitions. Defaults to `false`.'
  },
  {
    name: 'types', type: JSON.parse.bind(JSON),
    description: 'Defaults to ' + getChalkTemplateSingleEscape(
      '`{PlainObject: {type: \'object\'}}`.'
    ),
    typeLabel: '{underline JSON string}'
  },
  {
    name: 'configPath', type: String,
    description: 'Path to config file for options. Lower priority than ' +
      'other CLI options. Defaults to non-use.',
    typeLabel: '{underline path to config file}'
  },
  {
    name: 'outputPath', type: String, alias: 'o', multiple: true,
    description: 'Path to which to save the file; defaults to ' +
      '`file` in the current working directory, but with `json` extension.',
    typeLabel: '{underline outputPath}'
  }
  /* , {
    name: 'logging', type: String,
    description: 'Logging level; default is "off".',
    typeLabel: '{underline "verbose"|"off"}'
  } */
];

const cliSections = [
  {
    // Add italics: `{italic textToItalicize}`
    content: pkg.description +
      '\n\n{italic jsdoc-jsonschema [--outputPath path1.js path2.js] ' +
      'file1.js file2.js}'
  },
  {
    optionList: optionDefinitions
  }
];

exports.definitions = optionDefinitions;
exports.sections = cliSections;
