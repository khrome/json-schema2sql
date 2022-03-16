// from: https://json-schema.org/learn/miscellaneous-examples.html
const common = {
    schema : {
        "$id": "https://example.com/person.schema.json",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Person",
        "type": "object",
        "properties": {
            "firstName": {
                "type": "string",
                "description": "The person's first name."
            },
            "lastName": {
                "type": "string",
                "description": "The person's last name."
            },
            "age": {
                "description": "Age in years which must be equal to or greater than zero.",
                "type": "integer",
                "minimum": 0
            }
        }
    },
    instance : {
        "firstName": "Ed",
        "lastName": "Beggler",
        "age": 999
    },
    create : `CREATE TABLE tableName(
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    age INTEGER
)`,
    insert : `INSERT INTO tableName(firstName, lastName, age) VALUES ("Ed", "Beggler", 999)`,
    update : {
        ups: [
            'ALTER TABLE tableName ADD score INTEGER',
            'ALTER TABLE tableName DROP age'
        ],
        downs: [
            'ALTER TABLE tableName DROP score',
            'ALTER TABLE tableName ADD age INTEGER'
        ]
    }
};

module.exports = common;
