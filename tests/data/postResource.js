"use strict";

const { Resource } = require('../../index.js');
const { NotFoundError } = require('../../index.js').HTTPErrors;

const {
    METHOD_GET, METHOD_PUT, METHOD_POST, METHOD_PATCH, METHOD_DELETE,
    MEDIA_JSON,
    AUTH_BEARER,
} = require('../../index.js').CONSTANTS;

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
        
        this.setMethods({
            [METHOD_GET]: {},
            [METHOD_PATCH]: {},
            [METHOD_PUT]: {},
            [METHOD_POST]: {},
            [METHOD_DELETE]: {}
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
};