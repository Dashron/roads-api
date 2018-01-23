"use strict";

const JSONMergePatchRepresentation = require('../../index.js').JSONMergePatchRepresentation;

module.exports = class PostMergeRepresentation extends JSONMergePatchRepresentation {
    constructor (requestBody, requestAuth) {
        super({
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "set": (models, title, requestAuth) => {
                        models.title = title;
                    }
                },
                "post": {
                    "type": "string",
                    "set": (models, post, requestAuth) => {
                        models.post = post;
                    }
                }
            },
            "additionalProperties": false
        });

        this.setRequestBody(requestBody);
    }
};