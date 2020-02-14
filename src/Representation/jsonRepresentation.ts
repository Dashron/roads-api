/**
 * jsonRepresentation.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes the JSONRepresentation class that adds some useful functionality for JSON resource representations
 */

import Ajv, { RequiredParams } from 'ajv';
import { ValidationError, FieldError } from './validationError';
import { InvalidRequestError, HTTPError } from '../core/httpErrors';
import { ReadableRepresentation, WritableRepresentation } from './representation';

interface JsonRepresentationDefaults {
    set: (models: any, requestBody: any, auth: any, key?: string) => void,
    resolve: (models: any, auth: any, key?: string) => any
}

type RenderFunction = (item: object, auth: any, stringify: boolean) => string | object

// This is a placeholder. Ideally this will fully map the json schema format
type JSONSchema = {
    [x: string]: any,
    properties?: JSONSchemaProperties 
}

type JSONSchemaProperties = {
    [x: string]: JSONSchema
}

/**
 * 
 * 
 * @todo thorough examples of the representation format
 * @todo tests
*/
export default abstract class JSONRepresentation implements ReadableRepresentation, WritableRepresentation {
    protected schema: JSONSchema;

    protected schemaValidatorOptions: Ajv.Options;
    protected defaults: JsonRepresentationDefaults;

    /**
     * 
     * @param {object} schema - A JSONRepresentation schema.
     * @param {object} schemaValidatorOptions - An object that is provided to the schema validation system to allow for easy expansion. See AJV's options for more details (https://github.com/epoberezkin/ajv#options).
     * @param {object} defaults - An object that allows the implementor to provide some default functionality. Currently this supports a "set" and "resolve" fallback for schemas. 
     */
    init (schema: JSONSchema, schemaValidatorOptions: Ajv.Options, defaults: JsonRepresentationDefaults) {
        this.schema = schema;
        this.schemaValidatorOptions = schemaValidatorOptions || {};

        // These are important for some of the way we interact with AJV
        this.schemaValidatorOptions.allErrors = true;
        this.schemaValidatorOptions.verbose = true;
        this.schemaValidatorOptions.async = "es7";
        this.schemaValidatorOptions.removeAdditional = "failing";
        this.schemaValidatorOptions.jsonPointers = true;
        
        // Fallbacks for various sections of the representation
        this.defaults = defaults;
    }

    /**
     * 
     * @returns {object} The schema passed to the constructor
     */
    getSchema() {
        return this.schema;
    }

    /**
     * Receives models and auth, and returns the appropriate JSON representation
     * 
     * @param {*} models 
     * @param {*} auth 
     * @param {boolean} stringify 
     * @returns {*} The JSON representation for these models. Stringified if stringify=true
     */
    render (models: any, auth: any, stringify = true) {
        let output = this.renderSchema(this.getSchema(), models, auth);

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
     * @param {string} key this value is included when resolving fields 
     * @todo this is very similar to the applyEdit method, maybe we can merge them
     * @todo schema type is invalid, it can be an array of types. Also it might interact weird with oneOf, allOf, etc.
     * @returns {*} the JSON representation for the provided models
     * @throws {Error} if the schema type is not understood by this library
     */
    protected renderSchema (schema: JSONSchema, models: object, auth: any, key?: string): any {
        switch (schema.type) {
            case "string":
            case "number":
            case "boolean":
            case undefined:
                // If the implementor has a resolve method on the schema, use that
                if (schema.resolve) {
                    return schema.resolve(models, auth);
                // if there is no schema level resolve, but there's a default resolve, use that
                } else if (this.defaults.resolve) {
                    return this.defaults.resolve(models, auth, key);
                // if no resolve function could be found, error
                } else {
                    throw new Error('No resolver found for this schema');
                }
            case "array":
                return this.renderSchemaArray(schema.items, schema.resolveArrayItems(models, auth), auth);
            case "object":
                return this.renderSchemaProperties(schema.properties as JSONSchemaProperties, models, auth);
            default:
                throw new Error('Unsupported schema type: ' + schema.type + ' in schema ' + JSON.stringify(schema));
        }
    }

    protected canBeRendered(schema: JSONSchema): boolean {
        // we can render strings numbers and missing types if there is a resolve method
        return ((["string", "number", "boolean", undefined].indexOf(schema.type) >= 0) && (schema.resolve || (this.defaults && this.defaults.resolve))) || 
        // we can render array items if there is a resolveArrayItems method
            (schema.type === "array" && schema.resolveArrayItems) || 
        // we will attempt to render all objects
            (schema.type === "object");
    }

    /**
     * Turns an array of models into a JSON representation
     * 
     * @param {object} schemaItems 
     * @param {Array<object>} modelItems 
     * @param {any} auth 
     * @returns {array<object>} An array representation of the provided models
     */
    protected renderSchemaArray (schemaItems: { render: RenderFunction }, modelItems: Array<object>, auth: any): Array<object> {
        let items: Array<object> = [];

        modelItems.forEach((item: object) => {
            items.push(schemaItems.render(item, auth, false) as Object);
        });
    
        return items;
    }
    
    /**
     * Turns an object into a JSON representation
     * 
     * @param {object} properties 
     * @param {object} models 
     * @param {any} auth 
     * @returns {object} An object representation of the provided models
     */
    protected renderSchemaProperties (properties: JSONSchemaProperties, models: object, auth: any): object {
        let obj: {[x: string]: any} = {};
    
        for (let property in properties) {
            if (this.canBeRendered(properties[property])) {
                obj[property] = this.renderSchema(properties[property], models, auth, property);
            }
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
    async parseInput (requestBody: string) {
        let parsedBody = null;

        try {
            parsedBody = JSON.parse(requestBody);
        } catch (e) {
            // https://tools.ietf.org/html/rfc5789#section-2.2
            throw new InvalidRequestError('Invalid request body: Could not parse JSON request');
        }

        var ajv = new Ajv(this.schemaValidatorOptions);

        // We want read only fields to be rejected on input, so we add custom validation
        ajv.addKeyword('roadsReadOnly', {
            validate: function (schema: JSONSchema, data: any) {
                if (data) {
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
                return await compiledSchema(parsedBody);
            } catch(errors) {
                //console.log('validation errors', errors);
                throw new ValidationError('Invalid request body', errors);
            }
        } else {
            isValid = compiledSchema(parsedBody) as boolean;

            if (!isValid) {
                if (!compiledSchema.errors) {
                    throw new Error('AJV Interface has likely changed. Please check to see how synchronous errors are reported');
                }

                // https://tools.ietf.org/html/rfc5789#section-2.2
                let errors: Array<HTTPError> = [];

                compiledSchema.errors.forEach((error) => {
                    // if the error is a missing required field, we don't have a data path. the conditional below changes that to the value located in 
                    let dataPath = error.dataPath;

                    if (error.keyword === 'required') {
                        dataPath += '/' + (error.params as RequiredParams).missingProperty;
                    }

                    errors.push(new FieldError(error.message ? error.message : "Could not determine error message as a part of schema validation", dataPath));
                });

                throw new ValidationError('Invalid request body', errors);
            }

            return parsedBody;
        }
    }

    /**
     * Applies the edit requests in the request body to the provided models.
     * The requests are applied via the rules defined in the "set" methods associated with each representation property
     * 
     * @param {*} models 
     * @param {*} auth 
     */
    applyEdit (requestBody: any, models: object, auth: any) {
        this.applyRequest(this.getSchema(), requestBody, models, auth);
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
    protected applyRequest (schema: JSONSchema, requestBody: any, models: object, auth: any, key?: string) {
        if (typeof(requestBody) === "undefined") {
            return;
        }

        switch (schema.type) {
            case "string":
            case "number":
            case "boolean":
            case undefined:
                // If the implementor has a set method on the schema, use that
                if (schema.set) {
                    return schema.set(models, requestBody, auth);
                // if there is no schema level set, but there's a default set, use that
                } else if (this.defaults.set) {
                    return this.defaults.set(models, requestBody, auth, key);
                // if no set function could be found, error
                } else {
                    throw new Error('No set found for this schema');
                }
                schema
                break;
            case "array":
                throw new Error('Arrays are yet supported in input schemas');
                //return this._renderSchemaArray(schema.items, schema.resolveArrayItems(models, auth), auth);
            case "object":
                this.applyRequestProperties(schema.properties as JSONSchemaProperties, requestBody, models, auth);
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
    
    protected canBeEdited(schema: JSONSchema) {
        // we can set strings, numbers, booleans and missing types if there is a set method
        return ((["string", "number", "boolean", undefined].indexOf(schema.type) >= 0) && (schema.set || (this.defaults && this.defaults.set))) || 
        // we can render array items if there is a resolveArrayItems method
            //(schema.type === "array" && schema.resolveArrayItems) || 
        // we will attempt to set all objects properties
            (schema.type === "object");
    }

    /**
     * Applies the edit requests in the provided object to the models based on the set methods in the properties
     * 
     * @param {object} properties 
     * @param {object} requestBody 
     * @param {*} models 
     * @param {*} auth 
     */
    protected applyRequestProperties (properties: JSONSchemaProperties, requestBody: any, models: object, auth: any) {    
        for (let property in properties) {
            if (this.canBeEdited(properties[property])) {
                this.applyRequest(properties[property], requestBody[property], models, auth, property);
            }
        }
    }
};
