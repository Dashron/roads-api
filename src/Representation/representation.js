"use strict";

const {
    InvalidRequestError,
    UnprocessableEntityError,
    UnsupportedMediaTypeError
} = require('../httpErrors.js');

const {
    METHOD_PATCH,
    MEDIA_JSON_MERGE
} = require('../constants.js');

//let mergePatch = require('json-merge-patch');
var Ajv = require('ajv');

class ValidationError extends InvalidRequestError {
    constructor(message, fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }
}

let Representation = module.exports.Representation = class Representation {
    constructor (translator) {
        // function with two params, models and auth.
        this._translator = translator;
    }

    render (models, auth)  {
        return this._translator(models, auth);
    }

    parseInput (requestBody, method, auth) {
        console.log('base obj', requestBody);
        return requestBody;
    }
};

module.exports.JSONRepresentation = class JSONRepresentation extends Representation {
    constructor (response, editSchema) {
        super((models, auth) => {
            return this._renderSchema(response, models, auth);
        });

        this._editSchema = editSchema;
    }

    _renderSchema(schema, models, auth) {
        // todo: this is invalid, it can be an array of types. Also it might interact weird with oneOf, allOf, etc.
        switch (schema.type) {
            case undefined:
                return schema.resolve(models, auth);
            case "array":
                return this._renderSchemaArray(schema.items, schema.resolveArrayItems(models, auth), auth);
            case "object":
                return this._renderSchemaProperties(schema.properties, models, auth);
            default:
                throw new Error('Unsupported schema type');
        }
    }

    _renderSchemaArray(schemaItems, modelItems, auth) {
        let items = [];

        modelItems.forEach((item) => {
            items.push(schemaItems.resolve(item));
        });

        return items;
    }

    _renderSchemaProperties(properties, models, auth) {
        let obj = {};

        for (let property in properties) {
            obj[property] = this._renderSchema(properties[property], models, auth);
        }

        return obj;
    }

    async validateInput(requestBody) {
        var ajv = new Ajv({ // todo: this ajv config should be somewhere else
            allErrors: true,
            verbose: true,
            async: "es7",
            removeAdditional: false
        });
        
        let compiledSchema = ajv.compile(this._editSchema);
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

    parseInput (requestBody, method, auth, contentType) {
        if (method === METHOD_PATCH) {
            /*if (contentType === MEDIA_JSON_MERGE) {
                parsedBody = JSON.parse(requestBody);
            } else {
                throw new UnsupportedMediaTypeError();
            }*/

            throw new Error('PATCH Currently unsupported. Coming very soon!');
        }

        let parsedBody = null;

        try {
            parsedBody = JSON.parse(requestBody);
        } catch (e) {
            throw new UnprocessableEntityError('Invalid request body: Could not parse JSON request');
        }

        return this.validateInput(parsedBody);
    }

    /*
    see usage note in resource. We might want to just have special patch representations with add/remove/delete methods
    applyPatch (contentType, models, patch) {
        let representation = this.render(models);
        
        switch (contentType) {
            case MEDIA_JSON_MERGE:
                return mergePatch.apply(representation, patch);
            default:
                throw new UnsupportedMediaTypeError();
        }
    }*/
};