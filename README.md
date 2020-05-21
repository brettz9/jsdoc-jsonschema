# jsdoc-jsonschema

Convert standard JSDoc `@typedef` comment blocks into JSON Schema (with support
for nonstandard expansions).

**This project is not yet complete; it currently only works with
single simple types!**

## Use cases

- Validating the arguments passed to one's code at run-time
- For command-line scripts, one may need to apply schemas to the strings
    passed in in order to get typed info back out.

JSDoc is needed within code for good API docs anyways (one could build them
from JSON Schema, but then they wouldn't be integrated into one's code),
but since the information is redundant with JSON Schema, it can save time
from having to build both.

## Why not just use JSON Schema?

While JSON Schema is nicely structured for consumption by JavaScript,
it is not integrated within one's code.

And when the schema is discoverable within one's code in the context where
it is defined and maintained, one is surely more likely to keep it up to date.

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
definition files (though see the links below for that).

However, it is, for now, using [`jsdoctypeparser`](https://github.com/jsdoctypeparser/jsdoctypeparser/)
(over the standard jsdoc [catharsis](https://github.com/hegemonic/catharsis)) so that, in theory, we
could allow conversion of TypeScript-specific types within jsdoc comments
into suitable schema features (e.g., intersections).

## See also

- Converting from JSON Schema to jsdoc:
    [json-schema-to-jsdoc](https://github.com/n3ps/json-schema-to-jsdoc).
- jsdoc to Typescript:
    - [typescript-json-schema](https://github.com/YousefED/typescript-json-schema)
    - [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator)
- TypeScript to jsdoc:
    [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript)
- Linting your JSDoc comments:
    [eslint-plugin-jsdoc](https://github.com/gajus/eslint-plugin-jsdoc)
