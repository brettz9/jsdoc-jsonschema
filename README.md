# jsdoc-jsonschema

Convert standard JSDoc `@typedef` comment blocks into JSON Schema (with
support for nonstandard expansions).

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

## Current features

| JSDoc | JSON Schema | Notes |
|-------|-------------|-------|
| `@typedef` | `{type: 'object'}` |
| `/** Some desc.\n\n* @typedef */` | `{type: 'object', description: 'Some desc.'}` |
| `@typedef typeName` | `{type: 'object', title: 'typeName'}` |
| `@property {integer} propName` | `{properties: {propName: {type: 'integer'}}, required: ['propName']}`
| `@property {3\|4\|5} propName` | `{properties: {propName: {type: 'number', enum: [3, 4, 5]}}, required: ['propName']}` | Can force to `integer` type
| `@typedef {3\|4\|5}` | `{type: 'number', enum: [3, 4, 5]}` | Can force to `integer` type
| `@property {integer} [propName] Prop desc.` | `{properties: {propName: {type: 'integer', description: 'Prop desc.'}}}` | Supported JSON Schema types: 'null', 'boolean', 'object', 'array', 'number', 'string', 'integer'; with `tolerateCase` option not disabled, will allow `Integer`, etc., as well

## FAQ

### Why not just use JSON Schema?

While JSON Schema is nicely structured for consumption by JavaScript,
it is not integrated within one's code.

And when the schema is discoverable within one's code in the context where
it is defined and maintained, one is surely more likely to keep it up to date.

### Won't you become unable to express certain JSON Schema features coming from JSDoc?

JSDoc already has certain standard tags that can express certain JSON schema
features like `type` and `properties`. We want to leverage those standard
features where they exist.

However, JSDoc can support definition of custom tags, so if necessary, we
can add certain features that can be converted into other JSON Schema features.

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

### Options

As a second argument, one can supply an options object with the following
properties:

- `tolerateCase` - Boolean (default `true`) on whether to allow types defined
    in different casing, e.g., `Object`, to avoid throwing and be converted to
    their lower-case counterpart understood by JSON Schema.

## Scope

This project does not aim to convert other similar sources such as TypeScript
definition files (though see the links below for that).

However, it is, for now, using [`jsdoctypeparser`](https://github.com/jsdoctypeparser/jsdoctypeparser/)
(over the standard jsdoc [catharsis](https://github.com/hegemonic/catharsis))
so that, in theory, we could allow conversion of TypeScript-specific types
within jsdoc comments into suitable schema features (e.g., intersections).

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

## To-dos

1. Get working with **nested objects and arrays** (nested with `.`)
1. Allow reference to other `@typedef` types (**`definitions`**?) Probably
    need to also add support in `json-schema-to-jsdoc`
    ([#41](https://github.com/n3ps/json-schema-to-jsdoc/issues/41)

## Lower-priority to-dos

1. Get working with **mixed union types** (and for TS, **intersection types**)
1. Add **mixed literals as `enum`** with `type` array
1. **Nested types**, e.g., nullable
1. Use `title` with `@property` despite being redundant with `properties` key?
1. Convert TS negated type to **`not`**?
1. Option to **read from file**, optionally filtering out only the `@typedef`'s
    of interest (by whitelist and/or blacklist)
1. Option to **save to file** (based on `@typedef` tag name and/or other
    custom tags?)
1. **Binary**
1. Add method to support **parsing entire `import`/`require` pipeline** for
    `@typedef`'s for conversion to schemas (could use
    [es-file-traverse](https://github.com/brettz9/es-file-traverse))
