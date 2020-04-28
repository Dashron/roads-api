import JSONRepresentation from "../../Representation/jsonRepresentation";
export default class CollectionRepresentation extends JSONRepresentation {
    constructor(action: string, itemRepresentation: JSONRepresentation, resolveArrayItems: Function);
}
