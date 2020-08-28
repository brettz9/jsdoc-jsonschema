'use strict';

/*
Note: Keep using `json-schema-to-jsdoc` at
  https://github.com/n3ps/json-schema-to-jsdoc
  in the tests to sanity check (and ensure features we are using are mapping
  in other direction)
*/

const util = require('util');
const chai = require('chai');
const jsonSchemaToJSDoc = require('json-schema-to-jsdoc');
const {jsdocToJsonSchema} = require('../');

const schemaToJSDoc = (expectedSchema, indent = 0, opts = {}, types = {}) => {
  return '\n' + jsonSchemaToJSDoc(expectedSchema, {
    ...opts,
    indent,
    types: {
      object: 'PlainObject',
      ...types
    }
  });
};

chai.config.truncateThreshold = 0;

// eslint-disable-next-line no-unused-vars -- Use during debugging
const log = (arg) => {
  console.log(util.inspect(arg, {
    showHidden: false, // e.g., `length`
    depth: null
  }));
};

const numberType = `
/**
 * @typedef {123} NumberType
 */
`;

const integerType = `
/**
 * @typedef {123} IntegerType
 */
`;

const stringType = `
/**
 * @typedef {"a string"} StringType
 */
`;

const parentType = `
/**
 * @typedef {PlainObject} ParentType
 * @property {number} numName
 */
`;

const nestedType = `
/**
 * @typedef {PlainObject} NestedType
 * @property {object} cfg
 * @property {string} cfg.requiredProp
 * @property {number} [cfg.optionalProp]
 */
`;

/*
const childType = `
/**
 * @typedef {ParentType} ChildType
 * @property {string} strName
 * @property {boolean} boolName
 *
`;
*/

const docWithUpperCasedJsonSchemaType = `
/**
 * @typedef UpperCaseType
 * @property {Number} val
 */
`;

describe('`jsdocToJsonSchema`', function () {
  describe('primitive types', function () {
    it('converts a number type jsdoc block', function () {
      const schemas = jsdocToJsonSchema(numberType);
      // log(schemas[0]);
      const expectedSchema = {
        type: 'number',
        title: 'NumberType',
        enum: [123]
      };
      expect(schemas).to.deep.equal([expectedSchema]);

      const jsdoc = schemaToJSDoc(expectedSchema);
      // log(jsdoc);
      expect(jsdoc).to.equal(numberType);
    });
    it('converts an integer type jsdoc block', function () {
      const schemas = jsdocToJsonSchema(integerType, {
        preferInteger: true
      });
      // log(schemas[0]);
      const expectedSchema = {
        type: 'integer',
        title: 'IntegerType',
        enum: [123]
      };
      expect(schemas).to.deep.equal([expectedSchema]);

      // Todo: Reenable after https://github.com/n3ps/json-schema-to-jsdoc/pull/45
      // const jsdoc = schemaToJSDoc(expectedSchema);
      // log(jsdoc);
      // expect(jsdoc).to.equal(integerType);
    });
    it('converts a string type jsdoc block', function () {
      const schemas = jsdocToJsonSchema(stringType);
      // log(schemas[0]);
      const expectedSchema = {
        type: 'string',
        title: 'StringType',
        enum: ['a string']
      };
      expect(schemas).to.deep.equal([expectedSchema]);

      const jsdoc = schemaToJSDoc(expectedSchema);
      // log(jsdoc);
      expect(jsdoc).to.equal(stringType);
    });
  });
  it('converts a simple object jsdoc block', function () {
    const schemas = jsdocToJsonSchema(parentType);
    // log(schemas[0]);
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

    const jsdoc = schemaToJSDoc(expectedSchema);
    // log(jsdoc);
    expect(jsdoc).to.equal(parentType);
  });
  it('converts a simple jsdoc block with string literals', function () {
    const literalType = `
    /**
     * @typedef {PlainObject} LiteralType
     * @property {"abc"|"def"|"ghi"|"jkl"} enumName
     */
`;
    const schemas = jsdocToJsonSchema(literalType);
    // log(schemas[0]);
    const expectedSchema = {
      type: 'object',
      title: 'LiteralType',
      properties: {
        enumName: {
          type: 'string',
          enum: ['abc', 'def', 'ghi', 'jkl']
        }
      },
      required: [
        'enumName'
      ]
    };
    expect(schemas).to.deep.equal([expectedSchema]);
    const jsdoc = schemaToJSDoc(expectedSchema, 4);
    // log(jsdoc);
    expect(jsdoc).to.equal(literalType);
  });

  it('converts a simple jsdoc block with number literals', function () {
    const literalType = `
    /**
     * @typedef {PlainObject} LiteralType
     * @property {12|34.5|66|789} enumName
     */
`;
    const schemas = jsdocToJsonSchema(literalType);
    // log(schemas[0]);
    const expectedSchema = {
      type: 'object',
      title: 'LiteralType',
      properties: {
        enumName: {
          type: 'number',
          enum: [12, 34.5, 66, 789]
        }
      },
      required: [
        'enumName'
      ]
    };
    expect(schemas).to.deep.equal([expectedSchema]);
    const jsdoc = schemaToJSDoc(expectedSchema, 4);
    // log(jsdoc);
    expect(jsdoc).to.equal(literalType);
  });

  it(
    'converts a simple jsdoc block with number literals, ' +
    'description, and default',
    function () {
      const literalType = `
    /**
     * @typedef {PlainObject} LiteralType
     * @property {12|34.5|66|789} [enumName=66] Some enum
     */
`;
      const schemas = jsdocToJsonSchema(literalType);
      // log(schemas[0]);
      const expectedSchema = {
        type: 'object',
        title: 'LiteralType',
        properties: {
          enumName: {
            type: 'number',
            description: 'Some enum',
            default: 66,
            enum: [12, 34.5, 66, 789]
          }
        }
      };
      expect(schemas).to.deep.equal([expectedSchema]);
      const jsdoc = schemaToJSDoc(expectedSchema, 4);
      // log(jsdoc);
      expect(jsdoc).to.equal(literalType);
    }
  );

  it('converts a simple jsdoc block with integer literals', function () {
    const literalType = `
    /**
     * @typedef {PlainObject} LiteralType
     * @property {12|345|66|789} enumName
     */
`;
    const schemas = jsdocToJsonSchema(literalType, {
      preferInteger: true
    });
    // log(schemas[0]);
    const expectedSchema = {
      type: 'object',
      title: 'LiteralType',
      properties: {
        enumName: {
          type: 'integer',
          enum: [12, 345, 66, 789]
        }
      },
      required: [
        'enumName'
      ]
    };
    expect(schemas).to.deep.equal([expectedSchema]);

    // Todo: Reenable after https://github.com/n3ps/json-schema-to-jsdoc/pull/45
    // const jsdoc = schemaToJSDoc(expectedSchema, 4);
    // log(jsdoc);
    // expect(jsdoc).to.equal(literalType);
  });

  it('converts a simple jsdoc block with descriptions', function () {
    const typedefWithDescriptions = `
    /**
     * Here is the typedef description.
     * @typedef {PlainObject} ParentType
     * @property {number} numName Property description 1
     * @property {boolean} boolName Property description 2
     * @property [untypedName=5] Property description 3
     * @property untypedNameB
     */
`;
    const schemas = jsdocToJsonSchema(typedefWithDescriptions);
    // log(schemas[0]);
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
        },
        untypedName: {
          description: 'Property description 3',
          default: 5
        },
        untypedNameB: {
        }
      },
      required: [
        'numName', 'boolName', 'untypedNameB'
      ]
    }]);

    const jsdoc = schemaToJSDoc(schemas[0], 4, {
      defaultPropertyType: null
    });
    // log(jsdoc);
    expect(jsdoc).to.equal(typedefWithDescriptions);
  });
  it('converts a simple jsdoc block without a typedef name', function () {
    const noNameTypedef = `
    /**
     * @typedef {PlainObject}
     * @property {number} numName
     */
`;
    const schemas = jsdocToJsonSchema(noNameTypedef);
    // log(schema[0]);
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

    const jsdoc = schemaToJSDoc(schemas[0], 4);
    // log(jsdoc);
    expect(jsdoc).to.equal(noNameTypedef);
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
      const expectedTypedef = `
    /**
     * @typedef {PlainObject}
     * @property {string} numName
     */
`;
      const schemas = jsdocToJsonSchema(noNameTypedef);
      // log(schemas[0]);
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

      const jsdoc = schemaToJSDoc(schemas[0], 4);
      // log(jsdoc);
      expect(jsdoc).to.equal(expectedTypedef);
    }
  );
  it('converts a simple jsdoc block with an optional property', function () {
    const noNameTypedef = `
    /**
     * @typedef {PlainObject} SomeType
     * @property {number} [numName]
     * @property {string} strName
     * @property {boolean} [boolName=true]
     * @property {null} [nullName]
     * @property {true} [trueLiteral]
     * @property {false} [falseLiteral]
     */
`;
    const schemas = jsdocToJsonSchema(noNameTypedef);
    // log(schemas[0]);
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
          type: 'boolean',
          default: true
        },
        nullName: {
          type: 'null'
        },
        trueLiteral: {
          type: 'boolean',
          enum: [true]
        },
        falseLiteral: {
          type: 'boolean',
          enum: [false]
        }
      },
      title: 'SomeType',
      required: [
        'strName'
      ]
    }]);

    // Todo: Reenable after https://github.com/n3ps/json-schema-to-jsdoc/pull/45
    // const jsdoc = schemaToJSDoc(schemas[0], 4);
    // log(jsdoc);
    // expect(jsdoc).to.equal(noNameTypedef);
  });
  it('converts a simple jsdoc block without properties', function () {
    const noNameTypedef = `
    /**
     * @typedef {PlainObject}
     */
`;
    const schemas = jsdocToJsonSchema(noNameTypedef);
    // log(schemas[0]);
    expect(schemas).to.deep.equal([{
      type: 'object'
    }]);
    const jsdoc = schemaToJSDoc(schemas[0], 4);
    // log(jsdoc);
    expect(jsdoc).to.equal(noNameTypedef);
  });
  it(
    'converts a simple jsdoc block ignoring an irrelevant block',
    function () {
      const nonTypedefBlock = `
      /**
       * @function SomeFunc
       * @param {string} strName
       * @param {boolean} boolName
       */
  `;

      const schemas = jsdocToJsonSchema(parentType + nonTypedefBlock);
      // log(schemas[0]);
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
      const jsdoc = schemaToJSDoc(schemas[0]);
      // log(jsdoc);
      expect(jsdoc).to.equal(parentType);
    }
  );

  it(
    'converts a simple jsdoc block with `types`',
    function () {
      const schemas = jsdocToJsonSchema(parentType, {
        types: {
          PlainObject: {
            format: 'special',
            type: 'object'
          }
        }
      });
      // log(schemas[0]);
      expect(schemas).to.deep.equal([{
        type: 'object',
        format: 'special',
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

      // Todo: Reenable after https://github.com/n3ps/json-schema-to-jsdoc/issues/40
      /*
      const expected = `
      /**
       * @typedef {PlainObject} ParentType
       * @property {number} numName
       */
      /* `;
      const jsdoc = schemaToJSDoc(schemas[0], {
        formats: {
          special: {
            object: 'PlainObject'
          }
        }
      });
      // log(jsdoc);
      expect(jsdoc).to.equal(expected);
      */
    }
  );

  it('converts a simple array jsdoc block', function () {
    const arrayTypedef = `
    /**
     * @typedef {GenericArray} SomeType
     * @property {number} 0
     * @property {integer} 1
     * @property {string} [2]
     * @property {boolean} [3=false]
     */
`;
    const schemas = jsdocToJsonSchema(arrayTypedef, {
      types: {
        GenericArray: {
          type: 'array'
        }
      }
    });
    // log(schemas[0]);
    expect(schemas).to.deep.equal([{
      type: 'array',
      minItems: 2,
      maxItems: 4,
      items: [
        {
          type: 'number'
        },
        {
          type: 'integer'
        },
        {
          type: 'string'
        },
        {
          type: 'boolean',
          default: false
        }
      ],
      title: 'SomeType'
    }]);

    // Todo: Support making properties optional (and with defaults) by
    //   `minItems` in json-schema-to-jsdoc
    /*
    const jsdoc = schemaToJSDoc(schemas[0], 4, null, {
      array: 'GenericArray'
    });
    // log(jsdoc);
    expect(jsdoc).to.equal(arrayTypedef);
    */
  });

  it('converts a simple array jsdoc block (no `minItems`)', function () {
    const arrayTypedef = `
    /**
     * @typedef {GenericArray} SomeType
     * @property {number} [0]
     * @property {integer} [1]
     * @property {string} [2]
     * @property {boolean} [3=false]
     */
`;
    const schemas = jsdocToJsonSchema(arrayTypedef, {
      types: {
        GenericArray: {
          type: 'array'
        }
      }
    });
    // log(schemas[0]);
    expect(schemas).to.deep.equal([{
      type: 'array',
      maxItems: 4,
      items: [
        {
          type: 'number'
        },
        {
          type: 'integer'
        },
        {
          type: 'string'
        },
        {
          type: 'boolean',
          default: false
        }
      ],
      title: 'SomeType'
    }]);

    // Todo: Support making properties optional (and with defaults) by
    //   `minItems` in json-schema-to-jsdoc:
    //   https://github.com/n3ps/json-schema-to-jsdoc/pull/46
    /*
    const jsdoc = schemaToJSDoc(schemas[0], 4, null, {
      array: 'GenericArray'
    });
    // log(jsdoc);
    expect(jsdoc).to.equal(arrayTypedef);
    */
  });

  it('converts a nested object jsdoc block', function () {
    const schemas = jsdocToJsonSchema(nestedType);
    // log(schemas[0]);
    const expectedSchema = {
      type: 'object',
      title: 'NestedType',
      properties: {
        cfg: {
          type: 'object',
          properties: {
            requiredProp: {
              type: 'string'
            },
            optionalProp: {
              type: 'number'
            }
          },
          required: [
            'requiredProp'
          ]
        }
      },
      required: [
        'cfg'
      ]
    };
    expect(schemas).to.deep.equal([expectedSchema]);

    const jsdoc = schemaToJSDoc(expectedSchema);
    // log(jsdoc);
    expect(jsdoc).to.equal(nestedType);
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
  it('throws with unsupported jsdoc type error', function () {
    const docWithTypeError = `
      /**
       * @typedef {module:foo/bar} BadType
       */
    `;
    expect(() => {
      jsdocToJsonSchema(docWithTypeError);
    }).to.throw(Error);
  });
  it('throws with no mixed enums error', function () {
    const docWithTypeError = `
      /**
       * @typedef MixedEnumType
       * @property {null|34|"hello"} val
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
      }).to.throw(TypeError, 'Unsupported jsdoc type name Number');
    }
  );
  it(
    'accepts upper-cased JSON-Schema type with default `tolerateCase: true`',
    function () {
      const schemas = jsdocToJsonSchema(docWithUpperCasedJsonSchemaType);
      // log(schemas[0]);
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

      const docWithLowerCasedJsonSchemaType = `
    /**
     * @typedef {PlainObject} UpperCaseType
     * @property {number} val
     */
`;

      const jsdoc = schemaToJSDoc(schemas[0], 4);
      // log(jsdoc);
      expect(jsdoc).to.equal(docWithLowerCasedJsonSchemaType, 0);
    }
  );

  /*
  it('converts two jsdoc blocks together', function () {
    const schemas = jsdocToJsonSchema(parentType + childType);
    // log(schemas);
    expect(schemas).to.deep.equal([{
      $defs: {
        ParentType: {
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
        ChildType: {
          allOf: [
            {$ref: '#/$defs/ParentType'},
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
          ]
        }
      }
    }]);
    */

  // Todo: Use or wait for PR for `json-schema-to-jsdoc` to support `allOf`?
  //  https://github.com/n3ps/json-schema-to-jsdoc/pull/42
  /*
    const jsdoc = schemaToJSDoc(schemas);
    // log(jsdoc);
    expect(jsdoc).to.equal(parentType + childType, 0);
    */

  /*
    const jsdoc = schemaToJSDoc(schemas[0]);
    // log(jsdoc);
    expect(jsdoc).to.equal(parentType, 0);

    const jsdocChild = schemaToJSDoc(schemas[1]);
    // log(jsdocChild);
    expect(jsdocChild).to.equal(childType, 0);
  });
  */
});
