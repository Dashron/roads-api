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
    constructor() {
        //TODO: Make is post change this whole resource to append only
        super({
            authSchemes: {
                [AUTH_BEARER]: require('./tokenResolver.js')
            },
            responseMediaTypes: {
                [MEDIA_JSON]: require('./postRepresentation.js')
            },
            authRequired: true,
            defaultResponseMediaType: MEDIA_JSON
        }, ["get", "delete"]);
        
        this.addAction("partialEdit", {
            requestMediaTypes: {
                [MEDIA_JSON_MERGE]: require('./postInputRepresentation.js'),
            },
            defaultRequestMediaType: MEDIA_JSON_MERGE,
            defaultResponseMediaType: MEDIA_JSON
        });
    }

    modelsResolver(urlParams, searchParams, method, url) {
        let post = posts.get(urlParams.post_id);
        
        if (post) {
            return post;
        }

        throw new NotFoundError();
    }

    // Maybe this should be on the representation?
    get (models, requestBody, auth) {
        // do dee doo. nothing to see here but we need it anyway. Is there a better solution for this?
    }

    // maybe this should just live on the request body?
    partialEdit (models, requestBody, auth) {
        requestBody.applyEdit(models, auth);
        models.save();
    }

    // maybe this should just live on the request body?
    delete (models, requestBody, auth) {
        models.delete();
    }
};