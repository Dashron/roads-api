let Response = require('./response.js');

let HTTPError = class HTTPError extends Error {
    constructor () {
        super();
        this.status = 500;
    }

    toResponse() {
        return new Response(this.status);
    }
};

module.exports = {
    HTTPError: HTTPError,
    // 415
    UnsupportedMediaTypeError: class UnsupportedMediaTypeError extends HTTPError {
        constructor () {
            this.status = 415;
        }
    },
    // 401
    // return one www-authenticate header per authResolver type
    // 'WWW-Authenticate': authorization.format(authType));
    UnauthorizedError: class UnauthorizedError extends HTTPError {
        constructor (type, realm, charset) {
            super();
            this.type = type;
            this.realm = realm;
            this.charset = charset;
            this.status = 401;
        }

        toResponse() {
            return new Response(this.status, null, {
                'WWW-Authenticate': this.buildWWWAuthenticateHeader()
            });
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
        constructor () {
            this.status = 406;
        }
    }
};