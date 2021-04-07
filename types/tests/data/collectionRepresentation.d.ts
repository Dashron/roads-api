import JSONRepresentation, { ResolveArrayItems } from '../../Representation/jsonRepresentation';
export default class CollectionRepresentation<RepresentationFormat, Model, Auth> extends JSONRepresentation<RepresentationFormat, Model, Auth> {
    constructor(action: string, itemRepresentation: JSONRepresentation<RepresentationFormat, Model, Auth>, resolveArrayItems: ResolveArrayItems);
}
