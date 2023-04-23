# CHANGES for jsdoc-jsonschema

## 0.13.0

BREAKING CHANGE: Requires Node 16.9+

- chore: Bump Node `engines` to 16.9+

## 0.12.0

- feat: support simple array

## 0.11.0

BREAKING CHANGE: Requires Node 14

- refactor: ESM
- chore: updates `command-line-basics`, `comment-parser`, devDeps.
- chore: switch to pnpm
- Testing: Switch to stable version of `mocha-multi-reporters`

## 0.10.1

- Fix: Apply propr JSON references
- Testing: Point to nested schema testing branch
- Testing: Enable most `json-schema-to-jsdoc` tests
- npm: Update `package-lock.json` with latest on `json-schema-to-jsdoc`
    `master`
- npm: Update devDeps.

## 0.10.0

- Enhancement: Add binary

## 0.9.0

- Enhancement: Support `allOf` and `anyOf` with `classRelation: 'is-a'`
- Docs: Add badges (license, mocha, coverage; npm, build, lgtm, snyk)
- Ci: Add `travis.yml`

## 0.8.0

- Enhancement: Support nested objects and arrays (nested with `.`)
- npm: Update devDeps.

## 0.7.0

- Enhancement: Allow arrays/items

## 0.6.0

- Breaking change: Change undocumented `aliasMap` to `types` and expect object
    with optional `type` or `format`
- Fix: If present as a replacement in `types`, ensure won't err

## 0.5.0

- Breaking change: Error: "Unsupported jsdoc name <name>" ->
    "Unsupported jsdoc type name <name>"
- Enhancement: string and number unions -> enums
- Enhancement: single string and number
- Enhancement: Support `@property` without type portion
- Enhancement: `preferInteger` option to force `integer` type when possible
- Linting: As per latest ash-nazg
- Testing: Use lcov reporter for nyc
- npm: Ignore coverage
- npm: Update jsdoctypeparser, comment-parser, devDeps.

## 0.4.0

- Enhancement: "Unkown type" -> "Unsupported jsdoc name <name>"
- Enhancement: Throw "Unsupported jsdoc type <type>"
- Refactoring: Begin UNION work (commented out and with skipped test)

## 0.3.0

- Enhancement: Support `typedef` and `property` description conversions
- Enhancement: Add `required`

## 0.2.0

- Enhancement: Adds `title` (from `@typedef name`)
- Enhancment: Only add `properties` if some present
- Enhancement: Add `tolerateCase` option (default now `true`)
- Docs: Features, organize q's into FAQ; add q. re: becoming unable to
    express features from jsdoc

## 0.1.2

- Fix: Throw with non-JSON-Schema type

## 0.1.1

- Build: Remove nyc output

## 0.1.0

- Initial version
