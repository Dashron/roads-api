"use strict";

const Representation = require('../../index.js').Representation;

let postRepresentation = module.exports = new Representation((models, auth) => {
    models;
    auth;

    return {
        responseBody: {
            name: "Hi!"
        }, 
        responseHeaders: {}
    };
});

postRepresentation.validateEdit = (requestBody) => {

};

postRepresentation.validateReplace = (requestBody) => {
    return false;
};


postRepresentation.validateCreate = (requestBody) => {
    
};