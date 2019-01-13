"use strict";

const JSONRepresentation = require('../../index.js').JSONRepresentation;

module.exports = function (itemRepresentation, resolveArrayItems) {
    return class CollectionRepresentation extends JSONRepresentation {
        constructor () {
            super({
                "type": "object",
                "properties": {
                    "data": {
                        "type": "array",
                        "items": itemRepresentation,
                        "resolveArrayItems": resolveArrayItems
                    },
                    "perPage": {
                        "type": "number",
                        "resolve": (models) => {
                            return models.perPage;
                        }
                    },
                    "page": {
                        "type": "number",
                        "resolve": (models) => {
                            return models.page;
                        }
                    }
                },
                "additionalProperties": false
            });
        }
    };
};