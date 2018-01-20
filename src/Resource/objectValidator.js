"use strict";
let Ajv = require('ajv');

const {
    InvalidRequestError
} = require('../httpErrors.js');

class ValidationError extends InvalidRequestError {
    constructor(message, fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }
}

function buildSchema(propertiesSchema, requiredProperties) {
    let schema = {
        $async: true,
        type: "object",
        properties: propertiesSchema,
        additionalProperties: false
    };

    if (requiredProperties) {
        schema.required = requiredProperties;
    }

    return schema;
}

/**
 * 
 * @param {*} propertiesSchema the "properties" section of a JSON schema document. Array or object subschemas will fail
 * @param {*} searchParams 
 */
module.exports = async function validateObject(obj, propertiesSchema, requiredProperties) {
    var ajv = new Ajv({ // todo: this ajv config should be somewhere else
        allErrors: true,
        verbose: true,
        async: "es7",
        removeAdditional: false,
        coerceTypes: true
    });

    let schema = buildSchema(propertiesSchema, requiredProperties);
    // todo: caching
    let compiledSchema = ajv.compile(schema);

    try {
        return await compiledSchema(obj);
    } catch(errors) {
        throw new ValidationError('Invalid search query', errors);
    }
}