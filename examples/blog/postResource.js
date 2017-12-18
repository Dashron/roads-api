"use strict";

const {Resource} = require('../../index.js');

let postResource = module.exports = new Resource({
    authResolvers: {
        Bearer: require('./tokenResolver.js')
    },
    representations: {
        'application/json': require('./postRepresentation.js')
    }
});


postResource.modelsLocator = (uri, method) => {

};

postResource.add = (
    auth,
    body,
    models
) => {
    // todo: these shouldn't return status codes. the server should define status codes based on our success/failure messaging
    return {
        responseStatus: 200,
        responseModels: {}
    };
};

postResource.replace = (
    auth,
    body,
    models
) => {
    return {
        responseStatus: 200,
        responseModels: {}
    };
};

postResource.append = (
    auth,
    body,
    models
) => {
    return {
        responseStatus: 200,
        responseModels: {}
    };
};

postResource.patch = (
    auth,
    body,
    models
) => {
    return {
        responseStatus: 200,
        responseModels: {}
    };
};

postResource.delete = (
    auth,
    body,
    models
) => {
    return {
        responseStatus: 200,
        responseModels: {}
    };
};

postResource.validateSubmit = (requestBody) => {
    
};