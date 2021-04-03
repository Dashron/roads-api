import JSONRepresentation from '../../Representation/jsonRepresentation';

export default class CollectionRepresentation<Post, PostReqBody, AuthType> extends
	JSONRepresentation<Post, PostReqBody, AuthType> {

	constructor (
		action: string, itemRepresentation: JSONRepresentation<Post, PostReqBody, AuthType>, resolveArrayItems: Function) {

		super();

		this.init({
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: itemRepresentation.getSchema(),
					representation: itemRepresentation,
					resolveArrayItems: resolveArrayItems
				},
				perPage: {
					type: 'number',
					resolve: (models: {perPage: number}) => {
						return models.perPage;
					}
				},
				page: {
					type: 'number',
					resolve: (models: {page: number}) => {
						return models.page;
					}
				}
			},
			additionalProperties: false
		});
	}
}