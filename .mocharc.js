'use strict';

module.exports = {
  'inline-diffs': true,
  delay: false,
  exclude: 'test/*/**',
  reporter: 'cypress-multi-reporters',
  'reporter-option': [
    'configFile=mocha-multi-reporters.json'
  ],
  require: [
    'chai/register-expect'
  ]
};
