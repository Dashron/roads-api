import { Resource } from '../../index';
import tokenResolver, { AuthFormat } from './tokenResolver';
import PostRepresentation, { PostFormat } from './postRepresentation';
import { Post, createPosts } from './blogStorage';
import { NotFoundError } from '../../core/httpErrors';
import { MEDIA_JSON, MEDIA_JSON_MERGE, AUTH_BEARER } from '../../core/constants';
export type PostActions = 'get' | 'delete' | 'partialEdit';

const posts = createPosts();

export default class PostResource extends Resource<PostFormat, Post, AuthFormat> {
	protected label: string;

	constructor(label: string) {
		super();

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.addAction('get', () => {}, {
			authSchemes: { [ AUTH_BEARER ]: tokenResolver },
			responseMediaTypes: { [ MEDIA_JSON ]: new PostRepresentation('get') },
			defaultResponseMediaType: MEDIA_JSON,
			defaultRequestMediaType: MEDIA_JSON,
			authRequired: true,
		});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.addAction('get-noauth', () => {}, {
			method: 'GETNOAUTH',
			// Intentionally left out for testing purposes
			// authSchemes: { [ AUTH_BEARER ]: tokenResolver },
			responseMediaTypes: { [ MEDIA_JSON ]: new PostRepresentation('get') },
			defaultResponseMediaType: MEDIA_JSON,
			defaultRequestMediaType: MEDIA_JSON,
			authRequired: true,
		});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.addAction('get-noresponse', () => {}, {
			method: 'GETNORESPONSE',
			authSchemes: { [ AUTH_BEARER ]: tokenResolver },
			// Intentionally left out for testing purposes
			// responseMediaTypes: { [ MEDIA_JSON ]: new PostRepresentation('get') },
			// defaultResponseMediaType: MEDIA_JSON,
			defaultRequestMediaType: MEDIA_JSON,
			authRequired: true,
		});

		this.addAction('delete', (models) => {
			models.delete();
		}, {
			authSchemes: { [ AUTH_BEARER ]: tokenResolver },
			responseMediaTypes: { [ MEDIA_JSON ]: new PostRepresentation('delete') },
			defaultResponseMediaType: MEDIA_JSON,
			defaultRequestMediaType: MEDIA_JSON,
			authRequired: true,
		});

		this.addAction('partialEdit', (
			models,
			requestBody,
			RequestMediaHandler,
			auth) => {

			if (RequestMediaHandler && auth) {
				RequestMediaHandler.applyEdit(requestBody, models, auth);
				models.save();
			}
		}, {
			authSchemes: { [ AUTH_BEARER ]: tokenResolver },
			requestMediaTypes: { [MEDIA_JSON_MERGE]: new PostRepresentation('partialEdit') },
			responseMediaTypes: { [ MEDIA_JSON ]: new PostRepresentation('partialEdit') },
			defaultRequestMediaType: MEDIA_JSON_MERGE,
			defaultResponseMediaType: MEDIA_JSON,
			authRequired: true
		});



		// This is a quick hack to easily differentiate between two differenet post resources
		if (label) {
			this.label = label;
		}
	}

	async modelsResolver(urlParams: { 'post_id': number }): Promise<Post> {
		const post = posts[urlParams.post_id];

		if (post) {
			return post;
		}

		throw new NotFoundError('Can not find Post');
	}
}