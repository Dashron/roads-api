"use strict";
const {
    InvalidRequestError
} = require('../httpErrors.js');

module.exports = class ValidationError extends InvalidRequestError {
    constructor(message, fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }
}