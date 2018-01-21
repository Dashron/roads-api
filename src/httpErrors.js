let Response = require('./response.js');

let HTTPError = class HTTPError extends Error {
    constructor (message) {
        super(message);
        this.status = 500;
    }

    toResponse() {
        // Problem details JSON format: https://tools.ietf.org/html/rfc7807
        return new Response(this.status, {
            // URI identifier, should resolve to human readable documentation
            //type: '',
            // Short, human readable message
            title: this.message,
            // HTTP Status code
            status: this.status,
            // Human readable explanation
            //details: '',
            // URI Identifier that may or may not resolve to docs
            //instance: ''
        });
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
    // 406
    NotAcceptableError: class NotAcceptableError extends HTTPError {
        constructor (message) {
            super(message);
            this.status = 406;
        }
    },
    //404
    NotFoundError: class NotFoundError extends HTTPError {
        constructor (message) {
            super(message);
            this.status = 404;
        }
    },
    // 400
    InvalidRequestError: class InvalidRequestError extends HTTPError {
        constructor (message) {
            super(message);
            this.status = 400;
        }
    },

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