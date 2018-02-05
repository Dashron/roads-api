"use strict";

let Ajv = require('ajv');
let Representation = require('./representation.js');
let ValidationError = require('./validationError.js');
let { InvalidRequestError } = require('../httpErrors.js');

module.exports = class JSONRepresentation extends Representation {
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

    /**
     * Translate models into a JSON structure
     * 
     * @param {*} models 
     * @param {*} auth 
     * @param {*} stringify 
     */
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

    /**
     * Verify and validate 
     * 
     * @param {*} options 
     */
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

        // We want read only fields to be rejected on input, so we add custom validation
        ajv.addKeyword('readOnly', {
            validate: function (sch, parentSchema) {
                if (sch) {
                    return false;
                }
                return true;
            }
            // is this the better way to do this? It didn't work on the first attempt, will come back later
            //valid: false
        });
        
        // todo: caching
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

    // this is very similar to the render method, maybe we can merge them
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
                throw new Error('Arrays are yet supported in input schemas');
                //return this._renderSchemaArray(schema.items, schema.resolveArrayItems(models, auth), auth);
            case "object":
                this._applyRequestProperties(schema.properties, requestBody, models, auth);
                break;
            default:
                throw new Error('Unsupported schema type: ' + schema.type + ' in schema ' + JSON.stringify(schema));
        }
    }
    
    // this is very similar to the render method, maybe we can merge them
    /*_applySchemaArray (schemaItems, modelItems) {
        let items = [];
    
        modelItems.forEach((item) => {
            items.push(schemaItems.resolve(item));
        });
    
        return items;
    }*/
    
    // this is very similar to the render method, maybe we can merge them
    _applyRequestProperties (properties, requestBody, models, auth) {    
        for (let property in properties) {
            this._applyRequest(properties[property], requestBody[property], models, auth);
        }
    }
};