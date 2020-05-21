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
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  overrides: [{
    files: ['test/**'],
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
      // Browser only
      'compat/compat': 0,
      'import/no-commonjs': 0,
      'no-console': 0,
      'node/exports-style': 0
    }
  }, {
    files: ['*.md'],
    globals: {
    },
    rules: {
      'node/no-missing-require': ['error', {
        allowModules: ['jsdoc-to-jsonschema']
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
