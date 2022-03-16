json-schema2sql
===============

Just a simple JSON to SQL converter, because I needed it. Not many syntax options, but I expect that to change over time.

Usage
-----

```javascript
const converter = require('json-schema2sql');
converter.toSQL('tableName', jsonSchema, {});
//returns an array of create statements
converter.toSQLUpdates('tableName', newJSONSchema, oldJSONSchema, {});
//returns two arrays of SQL statements in an object as `ups` and `downs
converter.toSQLInsert('tableName', jsonObject, {});
//returns a single insert statement from the object(s) provided
```

Testing

```bash
mocha
```
