"use strict";

let Representation = require('./representation.js');

module.exports = class JSONRepresentation extends Representation {
    constructor (schema) {
        super();
        this._schema = schema;
    }

    render (models, auth, stringify = true) {
        let output = this._renderSchema(this.getSchema(), models, auth, 'resolve');
        
        if (stringify) {
            output = JSON.stringify(output);
        }

        return output;
    }

    _renderSchema (schema, models, auth) {
        // todo: this is invalid, it can be an array of types. Also it might interact weird with oneOf, allOf, etc.
        switch (schema.type) {
            case "string":
            case "number":
            case undefined:
                return schema.resolve(models, auth);
            case "array":
                return this._renderSchemaArray(schema.items, schema.resolveArrayItems(models, auth), auth);
            case "object":
                return this._renderSchemaProperties(schema.properties, models, auth);
            default:
                throw new Error('Unsupported schema type: ' + schema.type + ' in schema ' + JSON.stringify(schema));
        }
    }
    
    getSchema() {
        return this._schema;
    }

    _renderSchemaArray (schemaItems, modelItems, auth) {
        let items = [];

        modelItems.forEach((item) => {
            items.push(this._renderSchema(schemaItems, item, auth));
        });
    
        return items;
    }
    
    _renderSchemaProperties (properties, models, auth) {
        let obj = {};
    
        for (let property in properties) {
            obj[property] = this._renderSchema(properties[property], models, auth);
        }
    
        return obj;
    }
};