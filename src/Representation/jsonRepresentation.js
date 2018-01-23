"use strict";

let Ajv = require('ajv');
let Representation = require('./representation.js');
let ValidationError = require('./validationError.js');
let { UnprocessableEntityError } = require('../httpErrors.js');

module.exports = class JSONRepresentation extends Representation {
    constructor (schema) {
        super();
        this._schema = schema;
    }

    parseInput (requestBody, options) {
        let parsedBody = null;

        try {
            parsedBody = JSON.parse(requestBody);
        } catch (e) {
            throw new UnprocessableEntityError('Invalid request body: Could not parse JSON request');
        }

        return this._validateInput(parsedBody, options);
    }

    async _validateInput(requestBody) {
        var ajv = new Ajv({ // todo: this ajv config should be somewhere else
            allErrors: true,
            verbose: true,
            async: "es7",
            removeAdditional: false
        });
        
        let compiledSchema = ajv.compile(this.getInputSchema());
        let isValid = false;

        if (this._editSchema.$async) {
            try {
                return await compiledSchema(requestBody);
            } catch(errors) {
                //console.log('validation errors', errors);
                throw new ValidationError('Invalid request body', errors);
            }
        }

        isValid = compiledSchema(requestBody);

        if (!isValid) {
            //console.log('validation errors', compiledSchema.errors);
            throw new ValidationError('Invalid request body', compiledSchema.errors);
        }

        return requestBody;
    }

    render (models, auth) {
        return JSON.stringify(this._renderSchema(this._schema, models, auth, 'resolve'));
    }

    _renderSchema (schema, models, auth, action) {

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
    
    _renderSchemaArray (schemaItems, modelItems) {
        let items = [];
    
        modelItems.forEach((item) => {
            items.push(schemaItems.resolve(item));
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


    append (requestBody, auth) {
        // create a empty model
        let models = this._schema.append();
        // apply the standard schema edit flow
        return this.edit(models, auth);
    }

    submit (requestBody, models, auth) {
        return this._schema.submit(requestBody, models, auth);
    }

    replace (requestBody, models, auth) {
        // navigate through the request body in parallel with the schema 
        // pass each requestBody value alongwith the models to the schema save method
        return this._schema.save(models);
    }

    delete (models, auth) {
        return this._schema.delete(models, auth);
    }
};