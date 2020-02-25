import JSONRepresentation from "../../Representation/jsonRepresentation";
import { PostCollectionActions } from "./postCollectionResource";
export default class CollectionRepresentation extends JSONRepresentation {
    constructor(action: PostCollectionActions);
}
