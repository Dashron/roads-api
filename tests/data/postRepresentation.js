"use strict";

const JSONRepresentation = require('../../index.js').JSONRepresentation;
let posts = require('./blogStorage.js');
module.exports = class PostRepresentation extends JSONRepresentation {
    constructor (requestBody, requestAuth) {
        super({
            "type": "object",
            "properties": {
                "id": {
                    "type": "number",
                    "readOnly": true,
                    "resolve": (models) => {
                        return models.id;
                    }
                },
                "title": {
                    "type": "string",
                    "resolve": (models) => {
                        return models.title;
                    },
                    "set": (models, title, requestAuth) => {
                        models.title = title;
                    }
                },
                "post": {
                    "type": "string"
                }
            },
            "additionalProperties": false
        }, undefined, {
            resolve: (models, auth, key) => {
                return models[key];
            },
            set: (models, requestBody, auth, key) => {
                models[key] = requestBody;
            }
        });

        this.setRequestBody(requestBody);
    }

    append (models, auth) {
        let post = new posts.Post();
        this.applyEdit(post, auth);
        // Note: this may be auto generated by the db or something. I do this here to mimic that
        post.id = models.posts[models.posts.length - 1].id + 1; 
        models.posts.push(post);
        post.save();
        return post;
    }
};