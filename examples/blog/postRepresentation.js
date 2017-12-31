"use strict";

const Representation = require('../../index.js').Representation;
var Ajv = require('ajv');
var ajv = new Ajv({ // todo: this ajv config should be somewhere else
    allErrors: true,
    verbose: true,
    removeAdditional: "all" // remove parameters in the request body that are not in the schema. should we error instead? probably, but not sure how to make that work.
});

let postRepresentation = module.exports = new Representation((models, auth) => {
    let postModel = models.primaryResource;

    return {
        id: postModel.id,
        title: postModel.title,
        post: postModel.post
    };
});

postRepresentation.schema = {
    "type": "object",
    "properties": {
        "id": {
            "type": "number",
            "readOnly": true // once this is supported in the validator we can use this schema instead of edit
        },
        "title": {
            "type": "string"
        },
        "post": {
            "type": "string"
        }
    },
    "required": ["id", "title", "post"]
};

postRepresentation.editSchema = {
    "type": "object",
    "properties": {
        "title": {
            "type": "string"
        },
        "post": {
            "type": "string"
        }
    },
    "required": ["title", "post"]
};

postRepresentation.createSchema = postRepresentation.editSchema;
postRepresentation.replaceSchema = postRepresentation.editSchema;

postRepresentation.validateReplace = function (requestBody) {
    let validate = ajv.compile(this.replaceSchema);
    let valid = validate(requestBody);
    
    if (!valid) {
        console.log(validate.errors);
        return false;
    }

    // use json schema library to validate the request boddy against blogSchema.editSchema
    return true;
};

/*
postRepresentation.validateEdit = (requestBody) => {
    // use json schema library to validate the request boddy against blogSchema.editSchema
};

postRepresentation.validateCreate = (requestBody) => {
    // use json schema library to validate the request boddy against blogSchema.createSchema
};*/