'use strict';

const commentParser = require('comment-parser');
const {parse: typeParser, traverse} = require('jsdoctypeparser');

const jsonSchemaTypes = new Set(
  ['null', 'boolean', 'object', 'array', 'number', 'string', 'integer']
);

/**
 * @param {string} jsdocStr
 * @returns {JSON}
 */
const jsdocToJsonSchema = (jsdocStr) => {
  const parsed = commentParser(jsdocStr);
  return parsed.map((jsdocAST) => {
    if (!jsdocAST.tags.some(({tag}) => {
      return tag === 'typedef';
    })) {
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
        case 'NAME':
          if (!jsonSchemaTypes.has(node.name)) {
            throw new TypeError('Unknown type');
          }
          // Todo: This should be added to a dynamic `properties`,
          //   depending on how nested we are
          properties[name] = {
            type: node.name
          };
          break;
        case 'UNION': // Todo: Will need handling
        default:
          break;
        }
      }, (node, ...args) => {
        // console.log('exited', node, args);
      });
      // console.log('parsedType', parsedType);
    });
    return {
      type: 'object',
      properties
    };
  }).filter((jsonSchema) => {
    return jsonSchema;
  });
};

exports.jsdocToJsonSchema = jsdocToJsonSchema;
