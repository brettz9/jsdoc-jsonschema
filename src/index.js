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
    const required = [];
    jsdocAST.tags.forEach(({tag, name, description, type, optional}) => {
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
            throw new TypeError(`Unsupported jsdoc name ${nodeName}`);
          }
          // Todo: This should be added to a dynamic `properties`,
          //   depending on how nested we are
          const property = {
            type: nodeName
          };
          if (description) {
            property.description = description;
          }
          properties[name] = property;
          if (!optional && !required.includes(name)) {
            required.push(name);
          }
          break;
        /* } case 'UNION': { // Todo: Will need handling
          const checkForEnums = () => {
            const foundType = [
              ['STRING_VALUE', 'string']
            ].find(([astType, jsonSchemaType]) => {
              if (
                // eslint-disable-next-line valid-typeof
                typeof node.left.type === astType &&
                // eslint-disable-next-line valid-typeof
                typeof node.right.type === astType
                // Todo: Also check recursively if node.right is a UNION
              ) {
                return true;
              }
              return false;
            });
            if (foundType) {
              // Todo: Need to populate `enum` recursively and add to property
              const enumArr = [];
              enumArr.push(foundType);
            }
          };
          checkForEnums();
          break; */
        } default:
          throw new TypeError(`Unsupported jsdoc type ${node.type}`);
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
    if (jsdocAST.description) { // `@typedef` does not have its own description
      schema.description = jsdocAST.description;
    }
    if (Object.keys(properties).length) {
      schema.properties = properties;
    }
    if (required.length) {
      schema.required = required;
    }
    return schema;
  }).filter((jsonSchema) => {
    return jsonSchema;
  });
};

exports.jsdocToJsonSchema = jsdocToJsonSchema;
