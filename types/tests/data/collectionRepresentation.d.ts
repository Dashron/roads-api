import JSONRepresentation, { ResolveArrayItems } from '../../Representation/jsonRepresentation';
export default class CollectionRepresentation<ModelType, ReqBodyType, AuthType> extends JSONRepresentation<ModelType, ReqBodyType, AuthType> {
    constructor(action: string, itemRepresentation: JSONRepresentation<ModelType, ReqBodyType, AuthType>, resolveArrayItems: ResolveArrayItems);
}
