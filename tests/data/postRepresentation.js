"use strict";

const JSONRepresentation = require('../../index.js').JSONRepresentation;

module.exports = new JSONRepresentation({
    "type": "object",
    "properties": {
        "id": {
            //TODO: Disallow writes on id
            "resolve": (models) => {
                return models.id;
            }
        },
        "title": {
            "type": "string",
            "resolve": (models) => {
                return models.title;
            },
            "save": (models, title) => {
                models.title = title;
            }
        },
        "post": {
            "type": "string",
            "resolve": (models) => {
                return models.post;
            },
            "save": (models, post) => {
                models.post = post;
            }
        }
    },
    "append": () => {
        return new PostModel();
    },
    "submit": (requestBody, models, auth) => {
        // free form submission
    },
    "save": (models) => {
        models.save();
    },
    "delete": (models) => {
        models.delete();
    },
    "additionalProperties": false
});