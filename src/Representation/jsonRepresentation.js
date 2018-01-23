"use strict";

let Representation = require('./representation.js');

module.exports = class JSONRepresentation extends Representation {
    constructor (schema) {
        super();
        this._schema = schema;
    }

    render (models, auth) {
        return JSON.stringify(this._renderSchema(this._schema, models, auth, 'resolve'));
    }

    _renderSchema (schema, models, auth) {
        // todo: this is invalid, it can be an array of types. Also it might interact weird with oneOf, allOf, etc.
        switch (schema.type) {
            case "string":
            case "number":
            case undefined:
                return schema.resolve(models, auth);
            case "array":
                throw new Error('Arrays are yet supported in rendered schemas');
                //return this._renderSchemaArray(schema.items, schema.resolveArrayItems(models, auth), auth);
            case "object":
                return this._renderSchemaProperties(schema.properties, models, auth);
            default:
                throw new Error('Unsupported schema type: ' + schema.type + ' in schema ' + JSON.stringify(schema));
        }
    }
    
    /*_renderSchemaArray (schemaItems, modelItems) {
        let items = [];
    
        modelItems.forEach((item) => {
            items.push(schemaItems.resolve(item));
        });
    
        return items;
    }*/
    
    _renderSchemaProperties (properties, models, auth) {
        let obj = {};
    
        for (let property in properties) {
            obj[property] = this._renderSchema(properties[property], models, auth);
        }
    
        return obj;
}
};