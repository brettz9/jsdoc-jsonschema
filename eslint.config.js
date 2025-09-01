import ashNazg from 'eslint-config-ash-nazg';

export default [
  {
    ignores: [
      'coverage'
    ]
  },
  ...ashNazg(['sauron', 'node']),
  {
    settings: {
      polyfills: [
        'Number.isInteger',
        'Number.parseFloat',
        'Promise.all'
      ]
    }
  },
  {
    files: ['test/**', 'bin/**'],
    rules: {
      'no-console': 0,
      'n/exports-style': 0
    }
  },
  {
    files: ['test/fixtures/*.js'],
    rules: {
      'import/unambiguous': 0,
      'unicorn/no-empty-file': 0
    }
  },
  {
    files: ['*.md/*.js'],
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
  },
  {
    rules: {
      'import/no-commonjs': 0,
      'import/unambiguous': 0
    }
  }
];
