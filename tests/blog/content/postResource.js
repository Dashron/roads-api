"use strict";

const {
    Resource
} = require('../../../index.js');

const {
    METHOD_GET,
    METHOD_PUT,
    METHOD_POST,
    METHOD_PATCH,
    METHOD_DELETE,
    MEDIA_JSON,
    AUTH_BEARER,
} = require('../../../index.js').CONSTANTS;

const {
    NotFoundError
} = require('../../../index.js').httpErrors;

let posts = require('./blogStorage.js');

module.exports = class PostResource extends Resource {
    constructor() {
        super({
            validAuthSchemes: [AUTH_BEARER],
            representations: {
                [MEDIA_JSON]: require('./postRepresentation.js')
            },
            authRequired: true
        });
        
        this.setMethod(METHOD_GET, {
            action: this._get,
        });
        
        this.setMethod(METHOD_PUT, {
            action: this._replace,
            validation: this._validateReplace
        });
        
        this.setMethod(METHOD_POST, {
            action: this._append,
            validation: this._validateCreate
        });
        
        this.setMethod(METHOD_PATCH, {
            action: this._edit,
            validation: this._validateEdit
        });
        
        this.setMethod(METHOD_DELETE, {
            action: this._delete,
            validAuthSchemes: [AUTH_BEARER]
        });
        
        // try to standardize on one properties format that can be applied to many different media types
        // I should be able to have a toHAL and toSiren system
        this.setDefaultMediaType(MEDIA_JSON);
        
        // accepts token and params
        // returns false on auth error must retry, null on no auth, yet accepted
        this.setAuthResolver(AUTH_BEARER, require('./tokenResolver.js'));
    }

    modelsResolver(urlParams, searchParams, method, url) {
        let post = posts.get(urlParams.post_id);
        
        if (post) {
            return post;
        }

        throw new NotFoundError();
    }

    // validate a submission schema
    validateSubmit (requestBody) {

    }
}