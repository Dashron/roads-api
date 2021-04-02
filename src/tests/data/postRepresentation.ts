import { JSONRepresentation } from '../../index';
import { Post } from './blogStorage';
import { PostActions } from './postResource';
import { PostCollectionActions } from './postCollectionResource';
import { AuthType } from './tokenResolver';

export interface PostReqBody {
	id: number,
	title: string,
	post: string,
	active: boolean,
	nestingTest: {
		nestedField: string
	}
}

type KeyOfPost = keyof Post;

export default class PostRepresentation extends
	JSONRepresentation<Post, PostReqBody, AuthType> {

	constructor (action: PostActions | PostCollectionActions) {
		super();

		this.init({
			type: 'object',
			properties: {
				id: {
					type: 'number',
					roadsReadOnly: true,
					resolve: (models: Post) => {
						return models.id;
					}
				},
				title: {
					type: 'string',
					resolve: (models: Post) => {
						return models.title;
					},
					set: (models: Post, title: string, requestAuth: AuthType) => {
						models.title = title;
					}
				},
				post: {
					type: 'string'
				},
				active: {
					type: 'boolean',
					resolve: (models: Post) => {
						return models.active === 1 ? true : false;
					},
					set: (models: Post, active: boolean, requestAuth: AuthType) => {
						models.active = active ? 1 : 0;
					}
				},
				nestingTest: {
					type: 'object',
					properties: {
						nestedField: {
							type: 'string',
							resolve: (models: Post) => {
								return 'nestedValue';
							},
							set: (models: Post, nestedField: string, requestAuth: AuthType) => {
								// do nothing, never set this value
							}
						}
					},
					required: action === 'append' ? ['nestedField'] : []
				}
			},
			additionalProperties: false,
			required: action === 'append' ? ['title', 'post', 'nestingTest', 'active'] : []
		}, undefined, {
			resolve: (models: Post, auth: AuthType, key: keyof Post) => {
				return models[key];
			},
			set:<K extends KeyOfPost>(models: Post, requestValue: Post[K], auth: AuthType, key: K) => {
				models[key] = requestValue;
			}
		});
	}
}