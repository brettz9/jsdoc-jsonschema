'use strict';

module.exports = {
  extends: [
    'ash-nazg/sauron-node-overrides'
  ],
  parserOptions: {
    ecmaVersion: 2022
  },
  env: {
    browser: false
  },
  settings: {
    jsdoc: {
      mode: 'typescript'
    },
    polyfills: [
      'Number.isInteger',
      'Number.parseFloat',
      'Promise.all'
    ]
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  overrides: [{
    files: ['test/**', 'bin/**'],
    extends: [
      'ash-nazg/sauron-node'
    ],
    parserOptions: {
      ecmaVersion: 2022
    },
    env: {
      mocha: true
    },
    globals: {
      expect: true
    },
    rules: {
      'no-console': 0,
      'n/exports-style': 0,

      // Browser only
      'compat/compat': 0,
      'import/no-commonjs': 0
    }
  }, {
    files: ['test/fixtures/*.js'],
    rules: {
      'import/unambiguous': 0,
      'unicorn/no-empty-file': 0
    }
  }, {
    files: ['*.md/*.js'],
    globals: {
    },
    rules: {
      'import/no-unresolved': ['error', {
        ignore: ['jsdoc-jsonschema']
      }],
      'n/no-missing-require': ['error', {
        allowModules: ['jsdoc-jsonschema']
      }],
      'no-unused-vars': ['error', {
        // varsIgnorePattern: 'value'
      }],
      strict: 0
    }
  }],
  rules: {
    'import/no-commonjs': 0,
    'import/unambiguous': 0
  }
};
