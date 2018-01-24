"use strict";

let Ajv = require('ajv');
let Representation = require('./representation.js');
let ValidationError = require('./validationError.js');
let { InvalidRequestError } = require('../httpErrors.js');

module.exports = class JSONMergePatchRepresentation extends Representation {
    constructor (schema) {
        super();
        this._schema = schema;
        this._requestBody = '';
    }

    getSchema() {
        return this._schema;
    }

    setRequestBody (requestBody) {
        this._requestBody = requestBody;
    }

    async parseInput (options) {
        let parsedBody = null;

        try {
            parsedBody = JSON.parse(this._requestBody);
        } catch (e) {
            // https://tools.ietf.org/html/rfc5789#section-2.2
            throw new InvalidRequestError('Invalid request body: Could not parse JSON request');
        }

        this.setRequestBody(await this._validateInput(parsedBody, options));
    }

    async _validateInput(requestBody, options) {
        var ajv = new Ajv({ // todo: this ajv config should be somewhere else
            allErrors: true,
            verbose: true,
            async: "es7",
            removeAdditional: false
        });
        
        let compiledSchema = ajv.compile(this.getSchema());
        let isValid = false;

        if (this.getSchema().$async) {
            try {
                return await compiledSchema(requestBody);
            } catch(errors) {
                //console.log('validation errors', errors);
                throw new ValidationError('Invalid request body', errors);
            }
        }

        isValid = compiledSchema(requestBody);

        if (!isValid) {
            // https://tools.ietf.org/html/rfc5789#section-2.2
            throw new ValidationError('Invalid request body', compiledSchema.errors);
        }

        return requestBody;
    }

    /**
     * 
     * @param {*} models 
     * @param {*} auth 
     */
    applyEdit (models, auth) {
        return this._applyRequest(this.getSchema(), this._requestBody, models, auth);
    }

    _applyRequest (schema, requestBody, models, auth) {
        if (typeof(requestBody) === "undefined") {
            return;
        }

        // todo: this is invalid, it can be an array of types. Also it might interact weird with oneOf, allOf, etc.
        switch (schema.type) {
            case "string":
            case "number":
            case undefined:
                schema.set(models, requestBody, auth);
                break;
            case "array":
                throw new Error('Arrays are yet supported in rendered schemas');
                //return this._renderSchemaArray(schema.items, schema.resolveArrayItems(models, auth), auth);
            case "object":
                this._applyRequestProperties(schema.properties, requestBody, models, auth);
                break;
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
    
    _applyRequestProperties (properties, requestBody, models, auth) {    
        for (let property in properties) {
            this._applyRequest(properties[property], requestBody[property], models, auth);
        }
    }
};