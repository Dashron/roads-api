import { JSONRepresentation } from '../../index';
import { Post } from './blogStorage';
import { PostActions } from './postResource';
import { PostCollectionActions } from './postCollectionResource';
import { AuthFormat } from './tokenResolver';

export interface PostFormat {
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
	JSONRepresentation<PostFormat, Post, AuthFormat> {

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
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					set: (models: Post, title: string, requestAuth: AuthFormat) => {
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
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					set: (models: Post, active: boolean, requestAuth: AuthFormat) => {
						models.active = active ? 1 : 0;
					}
				},
				nestingTest: {
					type: 'object',
					properties: {
						nestedField: {
							type: 'string',
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							resolve: (models: Post) => {
								return 'nestedValue';
							},
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							set: (models: Post, nestedField: string, requestAuth: AuthFormat) => {
								// do nothing, never set this value
							}
						}
					},
					required: action === 'append' ? ['nestedField'] : []
				},
				writeOnlyTest: {
					type: 'string',
					// This is undefined instead of not included to mirror when you might want to
					//		exclude a specific field in read mode, but keep it for write
					resolve: undefined,
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					set: (models: Post, writeOnly: string, requestAuth: AuthFormat) => {
						models.writeOnly = writeOnly;
					}
				},
			},
			additionalProperties: false,
			required: action === 'append' ? ['title', 'post', 'nestingTest', 'active'] : []
		}, undefined, {
			resolve: (models: Post, auth: AuthFormat, key: keyof Post) => {
				return models[key];
			},
			set:<K extends KeyOfPost>(models: Post, requestValue: Post[K], auth: AuthFormat, key: K) => {
				models[key] = requestValue;
			}
		});
	}
}