'use strict';

const util = require('util');
const chai = require('chai');
const {jsdocToJsonSchema} = require('../');

chai.config.truncateThreshold = 0;

// eslint-disable-next-line no-unused-vars
const log = (arg) => {
  console.log(util.inspect(arg, {
    showHidden: false, // e.g., `length`
    depth: null
  }));
};

const parentType = `
/**
 * @typedef {PlainObject} ParentType
 * @property {number} numName
 */
`;
const childType = `
/**
 * @typedef {ParentType} ChildType
 * @property {string|null} strName
 * @property {boolean} boolName
 */
`;
const nonTypedefBlock = `
/**
 * @function SomeFunc
 * @param {string|null} strName
 * @param {boolean} boolName
 */
`;

const docWithTypeError = `
  /**
   * @typedef BadType
   * @property {string&}
   */
`;

describe('`jsdocToJsonSchema`', function () {
  it('converts a simple jsdoc block', function () {
    const schema = jsdocToJsonSchema(parentType);
    // log(schema);
    expect(schema).to.deep.equal([{
      type: 'object',
      properties: {
        numName: {
          type: 'number'
        }
      }
    }]);
  });
  it('converts a simple jsdoc block ignoring an irrelevant block', function () {
    const schema = jsdocToJsonSchema(parentType + nonTypedefBlock);
    // log(schema);
    expect(schema).to.deep.equal([{
      type: 'object',
      properties: {
        numName: {
          type: 'number'
        }
      }
    }]);
  });
  it('throws with jsdoc type error', function () {
    expect(() => {
      jsdocToJsonSchema(docWithTypeError);
    }).to.throw(Error);
  });
  it('converts two jsdoc blocks together', function () {
    const schema = jsdocToJsonSchema(parentType + childType);
    // log(schema);
    expect(schema).to.deep.equal([
      {
        type: 'object',
        properties: {
          numName: {
            type: 'number'
          }
        }
      },
      {
        type: 'object',
        properties: {
          strName: {
            type: 'null'
          },
          boolName: {
            type: 'boolean'
          }
        }
      }
    ]);
  });
});
