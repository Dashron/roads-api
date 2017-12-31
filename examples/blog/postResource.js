"use strict";

const {
    Resource,
    Response
} = require('../../index.js');

const {
    METHOD_GET,
    METHOD_PUT,
    METHOD_POST,
    METHOD_PATCH,
    METHOD_DELETE,
    MEDIA_JSON,
    AUTH_BEARER,
} = require('../../index.js').CONSTANTS;

const {
    NotFoundError
} = require('../httpErrors.js');

let posts = require('blogStorage.js');

let postResource = module.exports = new Resource({
    uriTemplates: [{
        template: '/posts/{post_id}',
        schema: {
            post_id: {
                type: 'number'
            },
        },
        required: ['post_id'],
        getModels: function (parameters) {
            let post = posts.get(parameters.post_id);
            if (post) {
                return post;
            }

            throw new NotFoundError();
        }
    }],
    // not sure this default config system works as I want it to, what happens if we only replace one action? I don't think the rest fall through
    methods: {
        [METHOD_GET]: {
            action: 'get',
            validSchemes: [AUTH_BEARER],
            representations: {
                [MEDIA_JSON]: require('./postRepresentation.js')
            },
            authRequired: true
        },
        [METHOD_PUT]: {
            action: 'replace',
            validation: 'validateReplace',
            validSchemes: [AUTH_BEARER],
            representations: {
                [MEDIA_JSON]: require('./postRepresentation.js')
            },
            authRequired: true
        },
        [METHOD_POST]: {
            action: 'append',
            validation: 'validateCreate',
            validSchemes: [AUTH_BEARER],
            representations: {
                [MEDIA_JSON]: require('./postRepresentation.js')
            },
            authRequired: true
        },
        [METHOD_PATCH]: {
            action: 'edit',
            validation: 'validateEdit',
            validSchemes: [AUTH_BEARER],
            representations: {
                [MEDIA_JSON]: require('./postRepresentation.js')
            },
            authRequired: true
        },
        [METHOD_DELETE]: {
            action: 'delete',
            validSchemes: [AUTH_BEARER],
            representations: {
                [MEDIA_JSON]: require('./postRepresentation.js')
            },
            authRequired: true
        }
    },
    // try to standardize on one properties format that can be applied to many different media types
    // I should be able to have a toHAL and toSiren system
    defaultMediaType: MEDIA_JSON,
    // accepts token and params
    // returns false on auth error must retry, null on no auth, yet accepted
    authResolvers: {
        [AUTH_BEARER]: require('./tokenResolver.js')
    }
});

postResource.modelsLocator = (uri, method) => {
    // use uri template library as a router
    // each route chooses a block of code which uses the template variables to locate a consistent map of name=>model
};

postResource.get = (
    auth,
    body,
    models,
    selectedRepresentation
) => {
    
    // todo: these shouldn't return status codes. the server should define status codes based on our success/failure messaging
    // maybe it's ok though if this is part of the core, and not part of the postResource
    return new Response(200, selectedRepresentation.render(models.primaryResource));
};

postResource.replace = (
    auth,
    body,
    models,
    selectedRepresentation
) => {
    // use the request body to overwrite the existing resource entirely

    // todo: these shouldn't return status codes. the server should define status codes based on our success/failure messaging
    // maybe it's ok though if this is part of the core, and not part of the postResource
    return new Response(200, selectedRepresentation.render(models.primaryResource));
};

postResource.append = (
    auth,
    body,
    models,
    selectedRepresentation
) => {
    // use the request body to create a new resource

    // todo: these shouldn't return status codes. the server should define status codes based on our success/failure messaging
    // maybe it's ok though if this is part of the core, and not part of the postResource
    return new Response(200, selectedRepresentation.render(models.primaryResource));
};

postResource.patch = (
    auth,
    body,
    models,
    selectedRepresentation
) => {
    // translate the request body to the db

    // todo: these shouldn't return status codes. the server should define status codes based on our success/failure messaging
    // maybe it's ok though if this is part of the core, and not part of the postResource
    return new Response(200, selectedRepresentation.render(models.primaryResource));
};

postResource.delete = (
    auth,
    body,
    models,
    selectedRepresentation
) => {
    models.primaryResource.delete();
    // todo: these shouldn't return status codes. the server should define status codes based on our success/failure messaging
    // maybe it's ok though if this is part of the core, and not part of the postResource
    return new Response(204);
};

postResource.validateSubmit = (requestBody) => {
    
};