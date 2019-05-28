"use strict";
/**
 * httpErrors.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * 
 */

let Response = require('./response.js');

let HTTPError = class HTTPError extends Error {
    constructor (message) {
        super(message);
        this.status = 500;
        this._additionalProblems = [];
    }

    toResponse() {
        let payload = this._buildPayload();

        // Problem details JSON format: https://tools.ietf.org/html/rfc7807
        return new Response(this.status, JSON.stringify(payload));
    }

    addAdditionalProblem(problem) {
        if (!(problem instanceof HTTPError)) {
            throw new Error('Invalid additional problem');
        }

        this._additionalProblems.push(problem);
    }

    _buildPayload() {
        return {
            // URI identifier, should resolve to human readable documentation
            //type: '',
            // Short, human readable message
            title: this.message,
            // HTTP Status code
            status: this.status,
            // Human readable explanation
            //details: '',
            // URI Identifier that may or may not resolve to docs
            //instance: '',
            "additional-problems": this._buildAdditionalProblems()
        };
    }

    _buildAdditionalProblems() {
        if (this._additionalProblems.length === 0) {
            return [];
        }

        let problems = [];
        for (let i = 0; i < this._additionalProblems.length; i++) {
            problems.push(this._additionalProblems[i]._buildPayload());
        }

        return problems;
    }
};

module.exports = {
    HTTPError: HTTPError,
    // 415
    UnsupportedMediaTypeError: class UnsupportedMediaTypeError extends HTTPError {
        constructor (message) {
            super(message);
            this.status = 415;
        }
    },
    // 401
    // return one www-authenticate header per authResolver type
    // 'WWW-Authenticate': authorization.format(authType));
    UnauthorizedError: class UnauthorizedError extends HTTPError {
        constructor (message, type, realm, charset) {
            super(message);
            this.type = type;
            this.realm = realm;
            this.charset = charset;
            this.status = 401;
        }

        toResponse() {
            let response = super.toResponse.apply(this);
            response.setHeader('WWW-Authenticate', this.buildWWWAuthenticateHeader());
            return response;
        }

        buildWWWAuthenticateHeader() {
            let header = this.type;
            
            if (this.realm) {
                header = header + 'realm=' + this.realm;
            }

            if (this.charset) {
                header = header + 'realm=' + this.charset;
            }

            return header;
        }
    },
    
    // 400
    InvalidRequestError: class InvalidRequestError extends HTTPError {
        constructor (message) {
            super(message);
            this.status = 400;
        }
    },

    // 403
    ForbiddenError: class ForbiddenError extends HTTPError {
        constructor (message) {
            super(message);
            this.status = 403;
        }
    },

    //404
    NotFoundError: class NotFoundError extends HTTPError {
        constructor (message) {
            super(message);
            this.status = 404;
        }
    },

    // 405
    MethodNotAllowedError: class MethodNotAllowedError extends HTTPError {
        constructor (validMethods) {
            super(validMethods.join(', '));
            this.status = 405;
        }
    },
    
    // 406
    NotAcceptableError: class NotAcceptableError extends HTTPError {
        constructor (message) {
            super(message);
            this.status = 406;
        }
    },

    // 422
    UnprocessableEntityError: class UnprocessableEntityError extends HTTPError {
        constructor (message) {
            super(message);
            this.status = 422;
        }
    }
};

module.exports.InputValidationError = class InputValidationError extends module.exports.InvalidRequestError {
    constructor(message, fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }
}