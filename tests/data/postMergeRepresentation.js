"use strict";

const JSONMergePatchRepresentation = require('../../index.js').JSONMergePatchRepresentation;

module.exports = class PostMergeRepresentation extends JSONMergePatchRepresentation {
    constructor (requestBody, requestAuth) {
        super({
            "type": "object",
            "properties": {
                "title": {
                    "type": "string"
                },
                "post": {
                    "type": "string"
                }
            },
            "additionalProperties": false
        });
    }
};