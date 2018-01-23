"use strict";

const { Resource } = require('../../index.js');
const { NotFoundError } = require('../../index.js').HTTPErrors;

const {
    METHOD_GET, METHOD_PUT, METHOD_POST, METHOD_PATCH, METHOD_DELETE,
    MEDIA_JSON, MEDIA_JSON_MERGE,
    AUTH_BEARER,
} = require('../../index.js').CONSTANTS;

let posts = require('./blogStorage.js');

module.exports = class PostResource extends Resource {
    constructor(includeRequired) {
        super({
            authSchemes: {
                [AUTH_BEARER]: require('./tokenResolver.js')
            },
            responseMediaTypes: {
                [MEDIA_JSON]: require('./postRepresentation.js')
            },
            authRequired: true,
            defaultRequestMediaType: MEDIA_JSON,
            defaultResponseMediaType: MEDIA_JSON
        }, [METHOD_GET, METHOD_DELETE]);
        
        this.setMethod(METHOD_PATCH, {
            requestMediaTypes: {
                [MEDIA_JSON_MERGE]: require('./postMergeRepresentation.js'),
            },
            defaultRequestMediaType: MEDIA_JSON_MERGE,
            defaultResponseMediaType: MEDIA_JSON
        });
        
        // This is just to simplify tests. It is not recommended as a real resource pattern
        let requiredProperties = includeRequired ? ["requiredProperty"] : undefined;

        this.setSearchSchema({
            per_page: {
                type: "number"
            },
            page: {
                type: "number"
            },
            requiredProperty: {
                type: "boolean"
            }
        }, requiredProperties);
    }

    modelsResolver(urlParams, searchParams, method, url) {
        let post = posts.get(urlParams.post_id);
        
        if (post) {
            return post;
        }

        throw new NotFoundError();
    }

    get (models, requestBody, auth) {
        // do dee doo. nothing to see here but we need it anyway. Is there a better solution for this?
    }

    append (models, requestBody, auth) {
        // todo: I need a submission representation
    }

    partialEdit (models, requestBody, auth) {
        requestBody.applyToModels(models, auth);
    }

    delete (models, requestBody, auth) {
        models.delete();
    }
};