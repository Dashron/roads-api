"use strict";

import { JSONRepresentation } from '../../index';
import { Post } from './blogStorage';
import { PostActions } from './postResource';
import { PostCollectionActions } from './postCollectionResource';

export default class PostRepresentation extends JSONRepresentation {
    constructor (action: PostActions | PostCollectionActions) {
        super();

        this.init({
            "type": "object",
            "properties": {
                "id": {
                    "type": "number",
                    "roadsReadOnly": true,
                    "resolve": (models: Post) => {
                        return models.id;
                    }
                },
                "title": {
                    "type": "string",
                    "resolve": (models: Post) => {
                        return models.title;
                    },
                    "set": (models: Post, title: string, requestAuth: any) => {
                        models.title = title;
                    }
                },
                "post": {
                    "type": "string"
                },
                "active": {
                    "type": "boolean",
                    "resolve": (models: Post) => {
                        return models.active === 1 ? true : false;
                    },
                    "set": (models: Post, active: boolean, requestAuth: any) => {
                        models.active = active ? 1 : 0;
                    }
                },
                "nestingTest": {
                    "type": "object",
                    "properties": {
                        "nestedField": {
                            "type": "string",
                            "resolve": (models: Post) => {
                                return "nestedValue";
                            },
                            "set": (models: Post, nestedField: string, requestAuth: any) => {
                                // do nothing, never set this value
                            }
                        }
                    },
                    "required": action === "append" ? ['nestedField'] : []
                }
            },
            "additionalProperties": false,
            "required": action === "append" ? ['title', 'post', 'nestingTest', 'active'] : []
        }, undefined, {
            resolve: (models: Post, auth: any, key: keyof Post) => {
                return models[key];
            },
            set: (models: Post, requestValue: string | number, auth: any, key: keyof Post) => {
                // todo: I don't like this :/. https://github.com/microsoft/TypeScript/issues/31663
                (models[key] as any) = requestValue;
            }
        });
    }
};