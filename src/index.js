'use strict';

const commentParser = require('comment-parser');
const {parse: typeParser} = require('jsdoctypeparser');

const hasOwn = (obj, prop) => {
  return {}.hasOwnProperty.call(obj, prop);
};

const isA = (typ) => {
  return {
    classRelation: 'is-a',
    $ref: `$defs/${typ}`
  };
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

const compoundTypes = new Set(['UNION', 'INTERSECTION']);

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
  if (node.type === 'PARENTHESIS') {
    const nestedCollector = [];
    recurseCheckType(
      node.value, nodeType, property, converter, nestedCollector
    );
    const prop = node.value.type === 'UNION' ? 'anyOf' : 'allOf';
    collector.push({
      [prop]: nestedCollector
    });
    return collector;
  }
  if (compoundTypes.has(node.type) && node.left.type === nodeType) {
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
* @typedef {PlainObject} Config
* @property {boolean} [preferInteger=false]
* @property {boolean} [tolerateCase=true]
* @property {boolean} [throwOnUnrecognizedName=true]
* @property {boolean} [$defs=false]
* @property {TypeConversion} [types={PlainObject: {type: 'object'}}]
*/

/**
 *
 * @param {string} type
 * @param {JSDocTypeParserNode} typeNode
 * @param {Config} [cfg]
 * @throws {TypeError}
 * @returns {JSONSchema}
 */
function getSchemaBase (type, typeNode, {
  preferInteger,
  tolerateCase,
  throwOnUnrecognizedName,
  $defs,
  types
}) {
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
      throwOnUnrecognizedName && !$defs && !hasCustomType &&
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
      if (enumArr) {
        schema.type = preferInteger && enumArr.every((num) => {
          return Number.isInteger(num);
        })
          ? 'integer'
          : 'number';
      } else {
        const anyOf = recurseCheckType(
          typeNode, 'NAME', 'name', isA, []
        );
        if (!anyOf) {
          throw new TypeError(
            'There is currently no support for mixed-type or ' +
              'non-string/number enums'
          );
        }

        return {
          type: 'object',
          anyOf
        };
      }
    }

    schema.enum = enumArr;
    break;
  } case 'INTERSECTION': {
    const allOf = recurseCheckType(
      typeNode, 'NAME', 'name', isA, []
    );
    if (!allOf) {
      throw new TypeError(
        'There is currently no support for mixed-type or ' +
          'non-string/number enums'
      );
    }
    schema = {
      type: 'object',
      allOf
    };
    break;
  } default:
    throw new TypeError(`Unsupported jsdoc type ${typeNode.type}`);
  }

  return schema;
}

/**
 * @param {string} jsdocStr
 * @param {Config} cfg
 * @returns {JSON}
 */
const jsdocToJsonSchema = (
  jsdocStr,
  cfg = {}
) => {
  const {
    preferInteger = false,
    tolerateCase = true,
    throwOnUnrecognizedName = true,
    $defs = false,
    types = {
      PlainObject: {
        type: 'object'
      }
    }
  } = cfg;
  const parsed = commentParser(jsdocStr);

  const results = parsed.map((jsdocAST) => {
    const typedefTag = jsdocAST.tags.find(({tag}) => {
      return tag === 'typedef';
    });
    if (!typedefTag) {
      return null;
    }

    const {type: typ} = typedefTag;
    let parsedTypedef = {};
    try {
      parsedTypedef = typeParser(typ);
    } catch (err) {
      // Ignore
    }

    let rootSchema;
    if (parsedTypedef.type) {
      rootSchema = getSchemaBase(typ, parsedTypedef, {
        preferInteger,
        tolerateCase,
        $defs,
        types,
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
          : getSchemaBase(type, typeNode, {
            preferInteger,
            tolerateCase,
            throwOnUnrecognizedName,
            $defs,
            types
          });

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

  if ($defs) {
    const resultsCopy = JSON.parse(JSON.stringify(results));
    const ret = resultsCopy.reduce((obj, result, i) => {
      if (!hasOwn(result, 'title')) {
        throw new Error(
          'It is currently necessary to have a `title` on all schema ' +
          'items in order to use the `$defs` option.'
        );
      }

      if (!jsonSchemaTypesAndLiterals.has(result.type)) {
        const referent = results.find(({title}, j) => {
          return i !== j && result.type === (tolerateCase
            ? title.toLowerCase()
            : title);
        });
        if (referent) {
          // Todo: Could be an array
          result.type = 'object'; // referent.type;
          result.allOf = [
            {
              classRelation: 'is-a',
              $ref: `$defs/${referent.title}`
            }
          ];
        } else if (throwOnUnrecognizedName) {
          throw new TypeError(`Unsupported jsdoc type name ${result.type}`);
        } else {
          result.type = 'object';
        }
      }
      obj.$defs[result.title] = result;
      return obj;
    }, {$defs: {}});

    const defs = Object.values(ret.$defs);

    const rootType = [...results].reverse().find((result) => {
      if (result.allOf) {
        return !defs.find(({allOf}) => {
          return allOf && allOf.find(({$ref}) => {
            return $ref === `$defs/${result.title}`;
          });
        });
      }
      if (result.anyOf) {
        return !defs.find(({anyOf}) => {
          return anyOf && anyOf.find(({$ref}) => {
            return $ref === `$defs/${result.title}`;
          });
        });
      }
      return !jsonSchemaTypesAndLiterals.has(result.type) &&
        !defs.find(({allOf}) => {
          return allOf && allOf.find(({$ref}) => {
            return $ref === `$defs/${result.title}`;
          });
        });
    });
    if (!rootType) {
      throw new Error(
        'Missing root type; must have non-plain type not-referenced by others'
      );
    }
    ret.allOf = [
      {
        classRelation: 'is-a',
        $ref: `$defs/${rootType.title}`
      }
    ];
    return ret;
  }

  return results;
};

exports.jsdocToJsonSchema = jsdocToJsonSchema;
