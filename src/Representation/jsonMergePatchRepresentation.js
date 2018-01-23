"use strict";

let Ajv = require('ajv');
let Representation = require('./representation.js');
let ValidationError = require('./validationError.js');
let { UnprocessableEntityError } = require('../httpErrors.js');

module.exports = class JSONMergePatchRepresentation extends Representation {
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

    async _validateInput(requestBody, options) {
        var ajv = new Ajv({ // todo: this ajv config should be somewhere else
            allErrors: true,
            verbose: true,
            async: "es7",
            removeAdditional: false
        });
        
        let compiledSchema = ajv.compile(this._schema);
        let isValid = false;

        if (this._schema.$async) {
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
};