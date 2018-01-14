"use strict";

const JSONRepresentation = require('../../../index.js').JSONRepresentation;

let responseRepresentation = {
    "type": "object",
    "properties": {
        "id": {
            "resolve": (models) => {
                return models.id;
            }
        },
        "title": {
            "resolve": (models) => {
                return models.title;
            },
        },
        "post": {
            "resolve": (models) => {
                return models.post;
            }
        }
    }
};

let editRepresentation = {
    "type": "object",
    "properties": {
        "title": {
            "type": "string",
        },
        "post": {
            "type": "string",
        }
    },
    // Required is weird. It doesn't really work well with readOnly. We want the id field 
    // to be required for read, but not write. Check here for an answer: check in on stack overflow question: https://stackoverflow.com/questions/48153961/how-to-validate-input-and-output-on-a-single-json-schema-edge-cases-with-readon
    // "required": ["id", "title", "post"], 
    "additionalProperties": false
};

let postRepresentation = module.exports = new JSONRepresentation(responseRepresentation, editRepresentation);



postRepresentation.saveRepresentation = function (postModel, requestBody) {
    if (requestBody.title) {
        postModel.title = requestBody.title;
    }

    if (requestBody.post) {
        postModel.post = requestBody.post;
    }

    return postModel.save();
};

postRepresentation.deleteRepresentation = function (postModel) {
    return postModel.delete();
}