"use strict";

const { Resource } = require('../../index.js');

const { MEDIA_JSON, MEDIA_JSON_MERGE, AUTH_BEARER } = require('../../index.js').CONSTANTS;

let posts = require('./blogStorage.js');

module.exports = class PostResource extends Resource {
    constructor(includeRequired) {
        //TODO: Make is post change this whole resource to append only
        super({
            authSchemes: { [AUTH_BEARER]: require('./tokenResolver.js') },
            responseMediaTypes: { 
                [MEDIA_JSON]: require('./collectionRepresentation.js')(new (require('./postRepresentation.js'))(), 
                (models) => {
                    return models.posts;
                })
            },
            authRequired: true,
            defaultResponseMediaType: MEDIA_JSON
        }, ["get"]);

        this.addAction("append", {
            requestMediaTypes: { [MEDIA_JSON]: require('./postInputRepresentation.js') },
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
        let models = {};

        if (typeof (searchParams.per_page) === "undefined") {
            models.perPage = 10;
        } else {
            models.perPage = searchParams.per_page;
        }

        if (typeof (searchParams.page) === "undefined") {
            models.page = 1;
        } else {
            models.page = searchParams.page;
        }

        models.posts = posts.getAll();

        return models;
    }

    // Maybe this should be on the representation?
    get (models, requestBody, auth) {
        // do dee doo. nothing to see here but we need it anyway. Is there a better solution for this?
    }

    // maybe this should just live on the request body?
    append (models, requestBody, auth) {
        models = requestBody.append(models, auth);
        models.save();
    }
};