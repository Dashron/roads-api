import { Post } from './blogStorage';
import { Resource } from '../../index';
import { MEDIA_JSON, MEDIA_JSON_MERGE, AUTH_BEARER } from '../../core/constants';
import { ParsedURLParams, ActionList } from '../../Resource/resource';
import tokenResolver, { AuthFormat } from './tokenResolver';

import CollectionRepresentation from './collectionRepresentation';
import PostRepresentation, { PostFormat } from './postRepresentation';
import posts, { createPosts } from './blogStorage';

export type PostCollectionActions = 'get' | 'append';
type PostCollectionModels = {
	posts: Array<Post>,
	perPage?: number,
	page?: number
};


export default class PostCollectionResource extends Resource<PostFormat, Post | PostCollectionModels, AuthFormat> {

	constructor(label: string) {
		super();

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.addAction('get', () => {}, {
			authSchemes: { [AUTH_BEARER]: tokenResolver },
			responseMediaTypes: {
				[MEDIA_JSON]: new CollectionRepresentation(
					'get', new PostRepresentation('get'), (models: PostCollectionModels) => {
						return models.posts;
					}
				)
			},
			authRequired: true,
			defaultResponseMediaType: MEDIA_JSON
		});

		this.addAction('append',
			(models: PostCollectionModels, requestBody, requestMediaHandler, auth) => {

				const directPosts = createPosts();

				//Generally you don't want to do this. This is just so the test ensures invalid params don't come through
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				if ((requestBody as any)['whatever']) {
				// this helps with a test
					throw new Error('unwanted extra parameter made it through validation.');
				}

				const post = new Post();
				requestMediaHandler?.applyEdit(requestBody, post, auth);
				// Note: this may be auto generated by the db or something. I do this here to mimic that
				post.id = directPosts[directPosts.length - 1].id + 1;
				directPosts.push(post);
				post.save();
				models.posts = directPosts;
			}, {
				authSchemes: { [AUTH_BEARER]: tokenResolver },
				requestMediaTypes: { [MEDIA_JSON_MERGE]: new PostRepresentation('append') },
				responseMediaTypes: {
					[MEDIA_JSON]: new CollectionRepresentation('append', new PostRepresentation('append'),
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(models: any)  => {
							return models.posts;
						}
					)
				},
				defaultRequestMediaType: MEDIA_JSON_MERGE,
				defaultResponseMediaType: MEDIA_JSON,
				authRequired: true
			});


		// This is just to simplify tests. It is not recommended as a real resource pattern
		const requiredProperties = label === 'requiredProperty' ? ['requiredProperty'] : undefined;

		this.setSearchSchema({
			per_page: {
				type: 'number'
			},
			page: {
				type: 'number'
			},
			requiredProperty: {
				type: 'boolean'
			}
		}, requiredProperties);
	}

	// TODO: I don't like this. why doesn't the abstract class know the parameter types?
	async modelsResolver(
		urlParams: ParsedURLParams | undefined,
		searchParams: URLSearchParams | undefined,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		action: keyof ActionList, pathname: string): Promise<PostCollectionModels> {

		const models: PostCollectionModels = {
			posts: []
		};

		if (searchParams === undefined || searchParams.get('per_page') === null) {
			models.perPage = 10;
		} else {
			models.perPage = Number(searchParams.get('per_page'));
		}

		if (searchParams === undefined || searchParams.get('page') === null) {
			models.page = 1;
		} else {
			models.page = Number(searchParams.get('page'));
		}

		models.posts = posts.getAll(models.page, models.perPage);
		return models;
	}
}