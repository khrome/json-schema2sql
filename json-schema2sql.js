const hash = require('object-hash');

const sqlType = (jsonType, pattern, opts)=>{
    switch(jsonType){
        case 'string': return 'VARCHAR(255)';
        case 'number': return 'FLOAT(24)';
        //case 'object': return 'varchar(255)'; //currently unsupported
        case 'integer': return 'INTEGER';
        //case 'array': return 'varchar(255)'; //currently unsupported
        case 'boolean': return 'BOOLEAN';
        default: throw new Error('Unknown type: '+jsonType);
    }
}

const fieldSQL = (f)=>{
    let field = f || {};
    return `${field.name} ${ field.sqlType }${(field.canBeNull?'':' NOT NULL')}`;
}

const sqlAddUpdate = (table, f)=>{
    let field = f || {};
    return {
        up: `ALTER TABLE ${table} ADD ${fieldSQL(field)}`,
        down: `ALTER TABLE ${table} DROP ${field.name}`
    }
}

const sqlDeleteUpdate = (table, f)=>{
    let field = f || {};
    let inverted = sqlAddUpdate(table, field);
    return {
        up : inverted.down,
        down: inverted.up
    }
}

const util = {
    toSQLParts : (name, schema, opts)=>{
        return {
            name: name,
            fields : Object.keys(schema.properties).map((property)=>{
                return {
                    name : property,
                    sqlType : sqlType(
                        schema.properties[property].type,
                        schema.properties[property].pattern,
                        opts
                    ),
                    jsonType : schema.properties[property].type,
                    canBeNull : (schema.required||[]).indexOf(property)==-1
                };
            })
        };
    },
    toSQL : (name, schema, opts)=>{
        let options = opts || {};
        let table = util.toSQLParts(name, schema, opts);
        let serializeKeyword = 'SERIAL';
        let relations = [];
        return [`CREATE TABLE "${table.name}"(\n    ${
            table.fields.map((field)=>{
                let isPrimaryKey = (options.primaryKey && field.name === options.primaryKey);

                let isForeignKey = (
                    options.foreignKey &&
                    options.foreignKey(name, field.name, '::')
                );
                if(['pg', 'postgress', 'postgresql'].indexOf(opts.dialect) !== -1){
                    if(isForeignKey){
                        if(['pg', 'postgress', 'postgresql'].indexOf(opts.dialect) !== -1){
                            return `"${field.name}" ${ field.sqlType } REFERENCES ${
                                isForeignKey.type
                            }(${
                                options.primaryKey
                            })`;
                        }
                        return `"${field.name}" ${ field.sqlType }${
                            (isPrimaryKey)?' PRIMARY KEY':''
                        }${
                            (isPrimaryKey && options.serial)?' '+serializeKeyword:''
                        }${
                            (field.canBeNull?'':' NOT NULL')
                        }`;
                    }
                }else{
                    serializeKeyword = 'AUTO INCREMENT';
                    if(isPrimaryKey){
                        relations.push(`PRIMARY KEY(${field.name})`)
                    }
                    if(isForeignKey){
                        relations.push(`FOREIGN KEY(${field.name}) REFERENCES ${
                            isForeignKey.type
                        }(${
                            options.primaryKey
                        })`)
                    }
                    return `"${field.name}" ${ field.sqlType }${
                        (field.canBeNull?'':' NOT NULL')
                    }${
                        (isPrimaryKey && options.serial)?' '+serializeKeyword:''
                    }`;
                }
            }).concat(relations).join(",\n    ")+"\n"
        })`];
    },
    toSQLUpdates : (name, schemaNew, schemaOld, opts)=>{
        let newTable = util.toSQLParts(name, schemaNew, opts);
        let oldTable = util.toSQLParts(name, schemaOld, opts);
        let ups = [];
        let downs = [];
        newTable.fields.forEach((newField)=>{
            let found = false;
            let newHash = hash(newField);
            oldTable.fields.forEach((oldField)=>{
                let oldHash = hash(oldField);
                if(newHash === oldHash){
                    found = true;
                }
            });
            if(!found){
                let update = sqlAddUpdate(name, newField);
                ups.push(update.up);
                downs.push(update.down)
            }
        });
        oldTable.fields.forEach((oldField)=>{
            let found = false;
            let oldHash = hash(oldField);
            newTable.fields.forEach((newField)=>{
                let newHash = hash(newField);
                if(newHash === oldHash){
                    found = true;
                }
            });
            if(!found){
                let update = sqlDeleteUpdate(name, oldField);
                ups.push(update.up);
                downs.push(update.down)
            }
        });
        return {
            ups, downs
        }
    },
    toSQLInsert : (name, itms, options)=>{
        let items = Array.isArray(itms)?itms:[itms];
        if(!items.length) throw new Error('must have items to create insert');
        return `INSERT INTO ${name}(${
            Object.keys(items[0]).join(', ')
        }) VALUES ${
            items.map(
                i=>'('+Object.keys(i).map(key => typeof i[key] === 'string'?'"'+i[key]+'"':i[key]+''
            ).join(', ')+')').join(', ')
        }`
    }
}

module.exports = util;
