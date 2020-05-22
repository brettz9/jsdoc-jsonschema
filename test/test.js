'use strict';

const util = require('util');
const chai = require('chai');
const jsonSchemaToJSDoc = require('json-schema-to-jsdoc');
const {jsdocToJsonSchema} = require('../');

chai.config.truncateThreshold = 0;

// eslint-disable-next-line no-unused-vars -- Use during debugging
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
 * @property {string} strName
 * @property {boolean} boolName
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
    const schemas = jsdocToJsonSchema(parentType);
    // log(schema);
    const expectedSchema = {
      type: 'object',
      title: 'ParentType',
      properties: {
        numName: {
          type: 'number'
        }
      },
      required: [
        'numName'
      ]
    };
    expect(schemas).to.deep.equal([expectedSchema]);
  });
  it.skip('converts a simple jsdoc block with literals', function () {
    const literalType = `
    /**
     * @typedef {PlainObject} LiteralType
     * @property {"abc"|"def"|"ghi"} enumName
     */
    `;
    const schemas = jsdocToJsonSchema(literalType);
    // log(schema);
    const expectedSchema = {
      type: 'object',
      title: 'LiteralType',
      properties: {
        enumName: {
          type: 'number',
          enum: ['abc', 'def']
        }
      },
      required: [
        'numName'
      ]
    };
    expect(schemas).to.deep.equal([expectedSchema]);
    const schemaToJSDoc = jsonSchemaToJSDoc(expectedSchema);
    expect(schemaToJSDoc).to.equal(parentType);
  });
  it('converts a simple jsdoc block with descriptions', function () {
    const typedefWithDescriptions = `
    /**
     * Here is the typedef description.
     * @typedef {PlainObject} ParentType
     * @property {number} numName Property description 1
     * @property {boolean} boolName Property description 2
     */
    `;
    const schemas = jsdocToJsonSchema(typedefWithDescriptions);
    // log(schema);
    expect(schemas).to.deep.equal([{
      type: 'object',
      title: 'ParentType',
      description: 'Here is the typedef description.',
      properties: {
        numName: {
          description: 'Property description 1',
          type: 'number'
        },
        boolName: {
          description: 'Property description 2',
          type: 'boolean'
        }
      },
      required: [
        'numName', 'boolName'
      ]
    }]);
  });
  it('converts a simple jsdoc block without a typedef name', function () {
    const noNameTypedef = `
    /**
     * @typedef {PlainObject}
     * @property {number} numName
     */
    `;
    const schemas = jsdocToJsonSchema(noNameTypedef);
    // log(schema);
    expect(schemas).to.deep.equal([{
      type: 'object',
      properties: {
        numName: {
          type: 'number'
        }
      },
      required: [
        'numName'
      ]
    }]);
  });
  it(
    'converts a simple jsdoc block and avoids putting additional ' +
      'fields into `required`',
    function () {
      const noNameTypedef = `
      /**
       * @typedef {PlainObject}
       * @property {number} numName
       * @property {string} numName
       */
      `;
      const schemas = jsdocToJsonSchema(noNameTypedef);
      // log(schema);
      expect(schemas).to.deep.equal([{
        type: 'object',
        properties: {
          numName: {
            type: 'string'
          }
        },
        required: [
          'numName'
        ]
      }]);
    }
  );
  it('converts a simple jsdoc block with an optional property', function () {
    const noNameTypedef = `
    /**
     * @typedef {PlainObject} SomeType
     * @property {number} [numName]
     * @property {string} strName
     * @property {boolean} [boolName=true]
     */
    `;
    const schemas = jsdocToJsonSchema(noNameTypedef);
    // log(schema);
    expect(schemas).to.deep.equal([{
      type: 'object',
      properties: {
        numName: {
          type: 'number'
        },
        strName: {
          type: 'string'
        },
        boolName: {
          type: 'boolean'
        }
      },
      title: 'SomeType',
      required: [
        'strName'
      ]
    }]);
  });
  it('converts a simple jsdoc block without properties', function () {
    const noNameTypedef = `
    /**
     * @typedef {PlainObject}
     */
    `;
    const schemas = jsdocToJsonSchema(noNameTypedef);
    // log(schema);
    expect(schemas).to.deep.equal([{
      type: 'object'
    }]);
  });
  it('converts a simple jsdoc block ignoring an irrelevant block', function () {
    const nonTypedefBlock = `
    /**
     * @function SomeFunc
     * @param {string} strName
     * @param {boolean} boolName
     */
    `;

    const schemas = jsdocToJsonSchema(parentType + nonTypedefBlock);
    // log(schema);
    expect(schemas).to.deep.equal([{
      type: 'object',
      title: 'ParentType',
      properties: {
        numName: {
          type: 'number'
        }
      },
      required: [
        'numName'
      ]
    }]);
  });
  it('throws with jsdoc type error', function () {
    const docWithTypeError = `
      /**
       * @typedef BadType
       * @property {string&} val
       */
    `;
    expect(() => {
      jsdocToJsonSchema(docWithTypeError);
    }).to.throw(Error);
  });
  it('throws with non-supported jsdoc type', function () {
    const docWithNonSupportedJSDocType = `
      /**
       * @typedef UnrecognizedJSDocType
       * @property {external:outsideType} jsdocNameWithUnrecognizedType
       */
    `;
    expect(() => {
      jsdocToJsonSchema(docWithNonSupportedJSDocType);
    }).to.throw(TypeError, 'Unsupported jsdoc type EXTERNAL');
  });
  it(
    'throws with `tolerateCase: false` and upper-cased JSON-Schema type',
    function () {
      expect(() => {
        jsdocToJsonSchema(docWithUpperCasedJsonSchemaType, {
          tolerateCase: false
        });
      }).to.throw(TypeError, 'Unsupported jsdoc name Number');
    }
  );
  it(
    'accepts upper-cased JSON-Schema type with default `tolerateCase: true`',
    function () {
      const schemas = jsdocToJsonSchema(docWithUpperCasedJsonSchemaType);
      expect(schemas).to.deep.equal([
        {
          type: 'object',
          title: 'UpperCaseType',
          properties: {
            val: {
              type: 'number'
            }
          },
          required: [
            'val'
          ]
        }
      ]);
    }
  );
  it('converts two jsdoc blocks together', function () {
    const schemas = jsdocToJsonSchema(parentType + childType);
    // log(schema);
    expect(schemas).to.deep.equal([
      {
        type: 'object',
        title: 'ParentType',
        properties: {
          numName: {
            type: 'number'
          }
        },
        required: [
          'numName'
        ]
      },
      {
        type: 'object',
        title: 'ChildType',
        properties: {
          strName: {
            type: 'string'
          },
          boolName: {
            type: 'boolean'
          }
        },
        required: [
          'strName', 'boolName'
        ]
      }
    ]);
  });
});
