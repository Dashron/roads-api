import JSONRepresentation from "../../Representation/jsonRepresentation";
import postRepresentation from './postRepresentation';
import { PostCollectionActions } from "./postCollectionResource";


export default class CollectionRepresentation extends JSONRepresentation {
    constructor (action: PostCollectionActions) {
        super();

        this.init({
            "type": "object",
            "properties": {
                "data": {
                    "type": "array",
                    // I would love this class to be more generic, and have items and resolveArrayItems be passed in, but right now it doesn't work.
                    "items": new postRepresentation(action),
                    "resolveArrayItems": (models: any) => {
                        return models.posts;
                    }
                },
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