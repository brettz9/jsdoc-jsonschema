'use strict';

const commentParser = require('comment-parser');
const {parse: typeParser, traverse} = require('jsdoctypeparser');

const jsonSchemaTypes = new Set(
  ['null', 'boolean', 'object', 'array', 'number', 'string', 'integer']
);

/**
 * @param {string} jsdocStr
 * @param {PlainObject} cfg
 * @param {boolean} cfg.tolerateCase
 * @returns {JSON}
 */
const jsdocToJsonSchema = (jsdocStr, {
  tolerateCase = true
} = {}) => {
  const parsed = commentParser(jsdocStr);
  return parsed.map((jsdocAST) => {
    const typedefTag = jsdocAST.tags.find(({tag}) => {
      return tag === 'typedef';
    });
    if (!typedefTag) {
      return null;
    }
    const properties = {};
    jsdocAST.tags.forEach(({tag, name, type}) => {
      if (tag !== 'property') {
        return;
      }
      const parsedType = typeParser(type); // May throw
      traverse(parsedType, (node, ...args) => {
        // console.log('entered', node, args);
        switch (node.type) {
        case 'NAME': {
          let {name: nodeName} = node;
          if (tolerateCase) {
            nodeName = nodeName.toLowerCase();
          }
          if (!jsonSchemaTypes.has(nodeName)) {
            throw new TypeError('Unknown type');
          }
          // Todo: This should be added to a dynamic `properties`,
          //   depending on how nested we are
          properties[name] = {
            type: nodeName
          };
          break;
        } case 'UNION': // Todo: Will need handling
        default:
          break;
        }
      }, (node, ...args) => {
        // console.log('exited', node, args);
      });
      // console.log('parsedType', parsedType);
    });
    const schema = {
      type: 'object'
    };
    if (typedefTag.name) {
      schema.title = typedefTag.name;
    }
    if (Object.keys(properties).length) {
      schema.properties = properties;
    }
    return schema;
  }).filter((jsonSchema) => {
    return jsonSchema;
  });
};

exports.jsdocToJsonSchema = jsdocToJsonSchema;
