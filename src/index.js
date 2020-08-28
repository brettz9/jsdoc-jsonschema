'use strict';

const commentParser = require('comment-parser');
const {parse: typeParser} = require('jsdoctypeparser');

const hasOwn = (obj, prop) => {
  return {}.hasOwnProperty.call(obj, prop);
};

const jsonSchemaTypes = new Set(
  ['null', 'boolean', 'object', 'array', 'number', 'string', 'integer']
);
const booleanLiterals = new Set(['true', 'false']);

const jsonSchemaTypesAndLiterals = new Set([
  ...jsonSchemaTypes,
  ...booleanLiterals
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
* @typedef {PlainObject} FormatType
* @property {string} [format]
* @property {string} [type]
*/

/**
* @typedef {PlainObject<string,FormatType>} TypeConversion
*/

/**
 *
 * @param {JSDocTypeParserNode} typeNode
 * @param {PlainObject} [opts={}]
 * @param {boolean} opts.preferInteger
 * @param {boolean} [opts.tolerateCase=true]
 * @param {boolean} [opts.throwOnUnrecognizedName=true]
 * @param {TypeConversion} [opts.types={PlainObject: {type: 'object'}}]
 * @throws {TypeError}
 * @returns {JSONSchema}
 */
function getSchemaBase (typeNode, {
  preferInteger,
  tolerateCase = true,
  throwOnUnrecognizedName = true,
  types = {
    PlainObject: {
      type: 'object'
    }
  }
} = {}) {
  let schema;
  // console.log('typeNode', typeNode);
  switch (typeNode.type) {
  case 'NAME': {
    let {name: typeName} = typeNode;
    const typeObject = hasOwn(types, typeName) && types[typeName];
    const hasCustomType = typeObject && typeObject.type;
    if (hasCustomType) {
      typeName = types[typeName].type;
    }
    if (tolerateCase) {
      typeName = typeName.toLowerCase();
    }
    if (
      throwOnUnrecognizedName && !hasCustomType &&
      !jsonSchemaTypesAndLiterals.has(typeName)
    ) {
      throw new TypeError(`Unsupported jsdoc type name ${typeName}`);
    }
    schema = {
      type: booleanLiterals.has(typeName) ? 'boolean' : typeName
    };

    if (typeObject && hasOwn(typeObject, 'format')) {
      schema.format = typeObject.format;
    }

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

    let parsedTypedef = {};
    try {
      parsedTypedef = typeParser(typedefTag.type);
    } catch (err) {
      // Ignore
    }

    let rootSchema;
    if (parsedTypedef.type) {
      rootSchema = getSchemaBase(parsedTypedef, {
        ...cfg,
        throwOnUnrecognizedName: false
      });
    }
    if (!rootSchema) {
      rootSchema = {
        type: 'object'
      };
    }

    if (typedefTag.name) {
      rootSchema.title = typedefTag.name;
    }
    if (jsdocAST.description) { // `@typedef` does not have its own description
      rootSchema.description = jsdocAST.description;
    }

    const rootProperties = rootSchema.type === 'array' ? [] : {};
    const rootRequired = [];
    const nameMap = new Map();

    jsdocAST.tags.forEach(({
      tag, name, description, type, optional, default: dflt}) => {
      if (tag !== 'property') {
        return;
      }

      /**
       * @typedef {PlainObject} Property
       * @property {string} type
       * @property {string} description
       */
      /**
       * @param {string} nme
       * @param {string} namePath
       * @param {Node} typeNode
       * @param {object<string,Property>} properties
       * @param {string[]} required
       * @param {JSONSchema} parentSchema
       * @throws {TypeError}
       * @returns {void}
       */
      function handleType (
        nme, namePath, typeNode, properties, required, parentSchema
      ) {
        const property = typeNode.type === '<UNTYPED>'
          ? {}
          : getSchemaBase(typeNode, cfg);

        if (description) {
          property.description = description;
        }
        if (dflt) {
          property.default = JSONParse(dflt);
        }

        if (namePath) {
          nameMap.set(`${namePath}.${nme}`, property);
        } else {
          nameMap.set(nme, property);
        }

        const isArray = parentSchema.type === 'array';
        if (isArray) {
          if (!optional) {
            if (!parentSchema.minItems) {
              parentSchema.minItems = 0;
            }
            parentSchema.minItems++;
          }
          properties.push(property);
        } else {
          properties[nme] = property;

          if (!optional && !required.includes(nme)) {
            required.push(nme);
          }
        }
      }

      const parsedType = type === ''
        ? {type: '<UNTYPED>'}
        : typeParser(type);

      const nameParts = name.split('.');

      nameParts.forEach((nme, i, arr) => {
        if (i === arr.length - 1) {
          const namePath = nameParts.slice(0, i).join('.');
          let schema, properties, required;
          if (i === 0) {
            schema = rootSchema;
            properties = rootProperties;
            required = rootRequired;
          } else {
            schema = nameMap.get(namePath);
            properties =
              (schema.type === 'array' ? schema.items : schema.properties) ||
              (schema.type === 'array' ? [] : {});
            required = schema.required || [];
          }

          const isArray = schema.type === 'array';

          handleType(
            nme, namePath, parsedType, properties, required, schema
          );
          if (required.length) {
            schema.required = required;
          }
          if (isArray) {
            schema.items = properties;
            schema.maxItems = properties.length;
          } else { // if (Object.keys(properties).length) {
            schema.properties = properties;
          }

          // console.log('schema', schema);

          if (!nameMap.has(namePath)) {
            nameMap.set(namePath, schema);
          }
        }
      });
    });
    // console.log('nameMap', nameMap);

    return rootSchema;
  }).filter((jsonSchema) => {
    return jsonSchema;
  });
};

exports.jsdocToJsonSchema = jsdocToJsonSchema;
