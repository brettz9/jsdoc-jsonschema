'use strict';

module.exports = {
  extends: [
    'ash-nazg/sauron',
    'plugin:node/recommended-script'
  ],
  env: {
    browser: false,
    es6: true
  },
  settings: {
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
      'ash-nazg/sauron-node',
      'plugin:node/recommended-script'
    ],
    env: {
      mocha: true
    },
    globals: {
      expect: true
    },
    rules: {
      // Reenabled by recommended-script
      'no-process-exit': 0,

      'no-console': 0,
      'node/exports-style': 0,

      // Browser only
      'compat/compat': 0,
      'import/no-commonjs': 0
    }
  }, {
    files: ['*.md'],
    globals: {
    },
    rules: {
      'node/no-missing-require': ['error', {
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
