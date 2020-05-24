'use strict';

const commentParser = require('comment-parser');
const {parse: typeParser} = require('jsdoctypeparser');

const jsonSchemaTypes = new Set(
  ['null', 'boolean', 'object', 'array', 'number', 'string', 'integer']
);
const booleanLiterals = new Set(['true', 'false']);

const jsonSchemaTypesAndLiterals = new Set([
  ...jsonSchemaTypes,
  ...booleanLiterals,
  'PlainObject'
]);
// const jsonSchemaParentTypes = new Set(['object', 'array']);

/**
 *
 * @param {string} typeNameVal
 * @returns {boolean}
 */
function parseOtherEnum (typeNameVal) {
  return typeNameVal === 'true';
}

const JSONParse = JSON.parse.bind(JSON);

const recurseCheckType = (
  node, nodeType, property, converter, collector
) => {
  if (node.type === 'UNION' && node.left.type === nodeType) {
    collector.push(converter(node.left[property]));
    return recurseCheckType(
      node.right, nodeType, property, converter, collector
    ) && collector;
  }
  if (node.type === nodeType) {
    collector.push(converter(node[property]));
    return collector;
  }
  return false;
};

/**
* @typedef {PlainObject<string,string>} AliasMap
*/

/**
 *
 * @param {JSDocTypeParserNode} typeNode
 * @param {PlainObject} [opts={}]
 * @param {boolean} opts.preferInteger
 * @param {boolean} [opts.tolerateCase=true]
 * @param {boolean} [opts.throwOnUnrecognizedName=true]
 * @param {AliasMap} [opts.aliasMap={PlainObject: 'object'}]
 * @throws {TypeError}
 * @returns {JSONSchema}
 */
function getSchemaBase (typeNode, {
  preferInteger,
  tolerateCase = true,
  throwOnUnrecognizedName = true,
  aliasMap = {
    PlainObject: 'object'
  }
} = {}) {
  let schema;
  // console.log('typeNode', typeNode);
  switch (typeNode.type) {
  case 'NAME': {
    let {name: typeName} = typeNode;
    if ({}.hasOwnProperty.call(aliasMap, typeName)) {
      typeName = aliasMap[typeName];
    }
    if (tolerateCase) {
      typeName = typeName.toLowerCase();
    }
    if (throwOnUnrecognizedName && !jsonSchemaTypesAndLiterals.has(typeName)) {
      throw new TypeError(`Unsupported jsdoc type name ${typeName}`);
    }
    // Todo: This should be added to a dynamic `properties`,
    //   depending on how nested we are
    schema = {
      type: booleanLiterals.has(typeName) ? 'boolean' : typeName
    };

    if (booleanLiterals.has(typeName)) {
      // While we could add `null` to be set as single `enum`
      //  item also, this would be redundant with type `null` (and also
      //  currently won't round-trip properly with `json-schema-to-jsdoc`
      //  which currently would give it a type of `enum`:
      //  https://github.com/n3ps/json-schema-to-jsdoc/pull/45 )
      const enumArr = recurseCheckType(
        typeNode, 'NAME', 'name', parseOtherEnum, []
      );
      schema.enum = enumArr;
    } /* else if (jsonSchemaParentTypes.has(typeName)) {
      // Allow nested if the next uses them
      // handleType();
    } */
    break;
  }
  case 'NUMBER_VALUE':
    schema = {
      type: preferInteger &&
        Number.isInteger(Number.parseFloat(typeNode.number))
        ? 'integer'
        : 'number',
      enum: [Number.parseFloat(typeNode.number)]
    };
    break;
  case 'STRING_VALUE':
    schema = {
      type: 'string',
      enum: [typeNode.string]
    };
    break;
  case 'UNION': {
    let enumArr = recurseCheckType(
      typeNode, 'STRING_VALUE', 'string', String, []
    );
    schema = {
      type: 'string'
    };
    if (!enumArr) {
      enumArr = recurseCheckType(
        typeNode, 'NUMBER_VALUE', 'number', Number, []
      );
      schema.type = preferInteger && enumArr.every((num) => {
        return Number.isInteger(num);
      })
        ? 'integer'
        : 'number';
    }
    if (!enumArr) {
      throw new TypeError(
        'There is currently no support for mixed-type or ' +
          'non-string/number enums'
      );
    }

    schema.enum = enumArr;
    break;
  } default:
    throw new TypeError(`Unsupported jsdoc type ${typeNode.type}`);
  }

  return schema;
}

/**
 * @param {string} jsdocStr
 * @param {PlainObject} cfg
 * @returns {JSON}
 */
const jsdocToJsonSchema = (jsdocStr, cfg) => {
  const parsed = commentParser(jsdocStr);
  return parsed.map((jsdocAST) => {
    const typedefTag = jsdocAST.tags.find(({tag}) => {
      return tag === 'typedef';
    });
    if (!typedefTag) {
      return null;
    }

    const rootProperties = {};
    const rootRequired = [];
    jsdocAST.tags.forEach(({
      tag, name, description, type, optional, default: dflt}) => {
      if (tag !== 'property') {
        return;
      }
      const parsedType = type === ''
        ? {type: '<UNTYPED>'}
        : typeParser(type);

      /**
       * @typedef {PlainObject} Property
       * @property {string} type
       * @property {string} description
       */
      /**
       * @param {Node} typeNode
       * @param {object<string,Property>} properties
       * @param {string[]} required
       * @throws {TypeError}
       * @returns {void}
       */
      function handleType (typeNode, properties, required) {
        const property = typeNode.type === '<UNTYPED>'
          ? {}
          : getSchemaBase(typeNode, cfg);

        if (description) {
          property.description = description;
        }
        if (dflt) {
          property.default = JSONParse(dflt);
        }
        properties[name] = property;

        if (!optional && !required.includes(name)) {
          required.push(name);
        }
      }

      handleType(parsedType, rootProperties, rootRequired);
      // console.log('parsedType', parsedType);
    });
    let parsedTypedef = {};
    try {
      parsedTypedef = typeParser(typedefTag.type);
    } catch (err) {
      // Ignore
    }

    let schema;
    if (parsedTypedef.type) {
      schema = getSchemaBase(parsedTypedef, {
        ...cfg,
        throwOnUnrecognizedName: false
      });
    }
    if (!schema) {
      schema = {
        type: 'object'
      };
    }

    if (typedefTag.name) {
      schema.title = typedefTag.name;
    }
    if (jsdocAST.description) { // `@typedef` does not have its own description
      schema.description = jsdocAST.description;
    }
    if (Object.keys(rootProperties).length) {
      schema.properties = rootProperties;
    }
    if (rootRequired.length) {
      schema.required = rootRequired;
    }
    return schema;
  }).filter((jsonSchema) => {
    return jsonSchema;
  });
};

exports.jsdocToJsonSchema = jsdocToJsonSchema;
