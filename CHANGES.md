# CHANGES for jsdoc-jsonschema

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
