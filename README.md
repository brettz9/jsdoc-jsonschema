# jsdoc-jsonschema

Convert standard JSDoc `@typedef` comment blocks into JSON Schema (with support
for nonstandard expansions).

**This project is not yet complete; it currently only works with
single simple types!**

## Installation

```sh
npm i jsdoc-jsonschema
```

## Usage

```js
const {jsdocToJsonSchema} = require('jsdoc-jsonschema');

jsdocToJsonSchema(`
    /**
     * @typedef {PlainObject} ParentType
     * @property {number} numName
     */
`);
```

```json
{
  "type": "object",
  "properties": {
    "numName": {
      "type": "number"
    }
  }
}
```

## Scope

This project does not aim to convert other similar sources such as TypeScript
definition files (though see [typescript-json-schema](https://github.com/YousefED/typescript-json-schema) and [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator), and for the other direction, [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript)).

However, it is, for now, using [`jsdoctypeparser`](https://github.com/jsdoctypeparser/jsdoctypeparser/)
(over the standard jsdoc [catharsis](https://github.com/hegemonic/catharsis)) so that, in theory, we
could allow conversion of TypeScript-specific types within jsdoc comments
into suitable schema features (e.g., intersections).
