"use strict";
/**
 * jsonRepresentation.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes the JSONRepresentation class that adds some useful functionality for JSON resource representations
 */

let Ajv = require('ajv');
let Representation = require('./representation.js');
let ValidationError = require('./validationError.js');
let { InvalidRequestError } = require('../httpErrors.js');

/**
 * 
 * 
 * @todo thorough examples of the representation format
*/
module.exports = class JSONRepresentation extends Representation {
    /**
     * Creates a new JSON Representation.
     * 
     * Currently the schema is a subset of JSON schema (top level must be an object, no references, adds resolve and set methods)
     * 
     * @param {object} schema - A JSONRepresentation schema.
     */
    constructor (schema) {
        super();
        this._schema = schema;
        this._requestBody = '';
    }

    /**
     * 
     * @returns {object} The schema passed to the constructor
     */
    getSchema() {
        return this._schema;
    }

    /**
     * Assigns the input request body for proper input parsing
     * 
     * @param {string} requestBody 
     */
    setRequestBody (requestBody) {
        this._requestBody = requestBody;
    }

    /**
     * Receives models and auth, and returns the appropriate JSON representation
     * 
     * @param {*} models 
     * @param {*} auth 
     * @param {boolean} stringify 
     * @returns {*} The JSON representation for these models. Stringified if stringify=true
     */
    render (models, auth, stringify = true) {
        let output = this._renderSchema(this.getSchema(), models, auth, 'resolve');
        
        if (stringify) {
            output = JSON.stringify(output);
        }

        return output;
    }

    /**
     * Turns models and auth into a JSON representation based on the resolve methods found in the provided schema
     * 
     * @param {object} schema 
     * @param {*} models 
     * @param {*} auth 
     * @todo this is very similar to the applyEdit method, maybe we can merge them
     * @todo schema type is invalid, it can be an array of types. Also it might interact weird with oneOf, allOf, etc.
     * @returns {*} the JSON representation for the provided models
     * @throws {Error} if the schema type is not understood by this library
     */
    _renderSchema (schema, models, auth) {
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

    /**
     * Turns an array of models into a JSON representation
     * 
     * @param {array} schemaItems 
     * @param {array} modelItems 
     * @param {*} auth 
     * @returns {array} An array representation of the provided models
     */
    _renderSchemaArray (schemaItems, modelItems, auth) {
        let items = [];

        modelItems.forEach((item) => {
            items.push(this._renderSchema(schemaItems, item, auth));
        });
    
        return items;
    }
    
    /**
     * Turns an object into a JSON representation
     * 
     * @param {object} properties 
     * @param {*} models 
     * @param {*} auth 
     * @returns {object} An object representation of the provided models
     */
    _renderSchemaProperties (properties, models, auth) {
        let obj = {};
    
        for (let property in properties) {
            obj[property] = this._renderSchema(properties[property], models, auth);
        }
    
        return obj;
    }

    /**
     * Ensure the JSON can be parsed, and then validate it against the JSON schema.
     * If everything works out, the request body is replaced with the final,
     * parsed, validated (and possibly sanitized) input
     * 
     * @param {*} options 
     * @todo should this set the request body back into the representation, or just return it, or both?
     */
    async parseInput (options) {
        let parsedBody = null;

        try {
            parsedBody = JSON.parse(this._requestBody);
        } catch (e) {
            // https://tools.ietf.org/html/rfc5789#section-2.2
            throw new InvalidRequestError('Invalid request body: Could not parse JSON request');
        }

        this.setRequestBody(await this._validateInput(parsedBody));
    }

    /**
     * Validates the request input JSON string against the schema
     * 
     * @param {string} requestBody 
     * @todo better readonly handling
     * @todo compiled schema caching
     * @return {*} the validated request body
     * @throws {ValidationError} if the request body is not valid against the schema
     */
    async _validateInput(requestBody) {
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
            // is this the better way to do read only? The following didn't work on the first attempt, will come back later
            //valid: false
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
     * Applies the edit requests in the request body to the provided models.
     * The requests are applied via the rules defined in the "set" methods associated with each representation property
     * 
     * @param {*} models 
     * @param {*} auth 
     */
    applyEdit (models, auth) {
        this._applyRequest(this.getSchema(), this._requestBody, models, auth);
    }

    /**
     * Applies the edit requests in the request body to the provided models.
     * The requests are applied via the rules defined in the "set" methods associated with each representation property
     * 
     * @param {*} schema 
     * @param {*} requestBody 
     * @param {*} models 
     * @param {*} auth 
     * @todo this is very similar to the render method, maybe we can merge them
     * @todo schema type is invalid, it can be an array of types. Also it might interact weird with oneOf, allOf, etc.
     */
    _applyRequest (schema, requestBody, models, auth) {
        if (typeof(requestBody) === "undefined") {
            return;
        }

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
    
    /**
     * Applies the edit requests in the provided object to the models based on the set methods in the properties
     * 
     * @param {object} properties 
     * @param {object} requestBody 
     * @param {*} models 
     * @param {*} auth 
     */
    _applyRequestProperties (properties, requestBody, models, auth) {    
        for (let property in properties) {
            this._applyRequest(properties[property], requestBody[property], models, auth);
        }
    }
};