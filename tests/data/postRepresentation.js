"use strict";

const JSONRepresentation = require('../../index.js').JSONRepresentation;

module.exports = class PostRepresentation extends JSONRepresentation {
    constructor () {
        super({
            "type": "object",
            "properties": {
                "id": {
                    "type": "number",
                    "resolve": (models) => {
                        return models.id;
                    }
                },
                "title": {
                    "type": "string",
                    "resolve": (models) => {
                        return models.title;
                    }
                },
                "post": {
                    "type": "string",
                    "resolve": (models) => {
                        return models.post;
                    }
                }
            }
        });
    }
};