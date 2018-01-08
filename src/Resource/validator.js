"use strict";

const {
    MEDIA_JSON,
    MEDIA_JSON_MERGE
} = require('../constants.js');

const {
    HTTPError,
    InvalidRequestError
} = require('../httpErrors.js');

class ValidationError extends InvalidRequestError {
    constructor(message, fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }
}

const JSON_SCHEMA = (function() {
    var Ajv = require('ajv');
    var ajv = new Ajv({ // todo: this ajv config should be somewhere else
        allErrors: true,
        verbose: true,
        removeAdditional: "all" // remove parameters in the request body that are not in the schema. should we error instead? probably, but not sure how to make that work.
    });
    
    return (body, schema) => {
        let compiledSchema = ajv.compile(schema);
        let valid = compiledSchema(body);

        if (!valid) {
            console.log('errors', compiledSchema.errors);
            throw new ValidationError('Invalid request body', compiledSchema.errors);
        }

        return true;
    };
})();


const validators = {
    [MEDIA_JSON]: JSON_SCHEMA,
    [MEDIA_JSON_MERGE]: JSON_SCHEMA
}


module.exports = function (contentType) {
    return validators[contentType];
};