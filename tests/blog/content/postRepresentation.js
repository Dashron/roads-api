"use strict";

const Representation = require('../../../index.js').Representation;

let postRepresentation = module.exports = new Representation((model, auth) => {
    let postModel = model;

    return {
        id: postModel.id,
        title: postModel.title,
        post: postModel.post
    };
});
/*
postRepresentation.schema = {
    "type": "object",
    "properties": {
        "id": {
            "type": "number",
            "readOnly": true // once this is supported in the validator we can use this schema instead of edit
        },
        "title": {
            "type": "string",
            "resolver": (models) => {
                return models.blogPost.title;
            },
        },
        "post": {
            "type": "string"
        }
    },
    "required": ["id", "title", "post"]
};*/

postRepresentation.editSchema = {
    "type": "object",
    "properties": {
        "id": {
            "type": "number",
            "blah": "testing" // once this is supported in the validator we can use this schema instead of edit
        },
        "title": {
            "type": "string"
        },
        "post": {
            "type": "string"
        }
    },
    "additionalProperties": false
};

postRepresentation.createSchema = postRepresentation.editSchema;
postRepresentation.replaceSchema = postRepresentation.editSchema;

postRepresentation.edit = function (postModel, requestBody) {
    if (requestBody.title) {
        postModel.title = requestBody.title;
    }

    if (requestBody.post) {
        postModel.post = requestBody.post;
    }

    return postModel.save();
};

/*
postRepresentation.validateEdit = (requestBody) => {
    // use json schema library to validate the request boddy against blogSchema.editSchema
};

postRepresentation.validateCreate = (requestBody) => {
    // use json schema library to validate the request boddy against blogSchema.createSchema
};*/