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
   * @property {string&} val
   */
`;

const docWithNonJsonSchemaType = `
  /**
   * @typedef BadType
   * @property {something} val
   */
`;

const docWithUpperCasedJsonSchemaType = `
/**
 * @typedef UpperCaseType
 * @property {Number} val
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
  it('throws with non-JSON-Schema type', function () {
    expect(() => {
      jsdocToJsonSchema(docWithNonJsonSchemaType);
    }).to.throw(TypeError, 'Unknown type');
  });
  it(
    'throws with `tolerateCase: false` and upper-cased JSON-Schema type',
    function () {
      expect(() => {
        jsdocToJsonSchema(docWithUpperCasedJsonSchemaType, {
          tolerateCase: false
        });
      }).to.throw(TypeError, 'Unknown type');
    }
  );
  it(
    'accepts upper-cased JSON-Schema type with default `tolerateCase: true`',
    function () {
      const schema = jsdocToJsonSchema(docWithUpperCasedJsonSchemaType);
      expect(schema).to.deep.equal([
        {
          type: 'object',
          properties: {
            val: {
              type: 'number'
            }
          }
        }
      ]);
    }
  );
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
