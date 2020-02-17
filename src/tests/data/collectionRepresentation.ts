"use strict";

import JSONRepresentation from "../../Representation/jsonRepresentation";


//module.exports = function (itemRepresentation, resolveArrayItems) {
export default class CollectionRepresentation extends JSONRepresentation {
    constructor (action: string) {
        super();

        this.init({
            "type": "object",
            "properties": {
                /*"data": {
                    "type": "array",
                    "items": itemRepresentation,
                    "resolveArrayItems": resolveArrayItems
                },*/
                "perPage": {
                    "type": "number",
                    "resolve": (models: {perPage: number}) => {
                        return models.perPage;
                    }
                },
                "page": {
                    "type": "number",
                    "resolve": (models: {page: number}) => {
                        return models.page;
                    }
                }
            },
            "additionalProperties": false
        });
    }
};