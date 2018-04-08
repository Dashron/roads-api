"use strict";
/**
 * validationError.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * 
 */

const {
    InvalidRequestError,
    HTTPError
} = require('../httpErrors.js');

module.exports = class ValidationError extends InvalidRequestError {
    constructor(message, fieldErrors) {
        super(message);

        if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((error) => {
                this.addAdditionalProblem(error);
            });
        } else {
            this.fieldName = fieldErrors;
        }
    }

    _buildPayload() {
        let payload = super._buildPayload();
        payload.field = this.fieldName;
        return payload;
    }
}
