import { Resource } from '../../index';
import tokenResolver, { AuthType } from './tokenResolver';
import PostRepresentation, { PostReqBody } from './postRepresentation';
import { Post, createPosts } from './blogStorage';
import { WritableRepresentation } from '../../Representation/representation';
import { NotFoundError } from '../../core/httpErrors';
import { MEDIA_JSON, MEDIA_JSON_MERGE, AUTH_BEARER } from '../../core/constants';
export type PostActions = 'get' | 'delete' | 'partialEdit';

const posts = createPosts();

export default class PostResource extends Resource<Post, PostReqBody, AuthType> {
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

		this.addAction('delete', (models: Post) => {
			models.delete();
		}, {
			authSchemes: { [ AUTH_BEARER ]: tokenResolver },
			responseMediaTypes: { [ MEDIA_JSON ]: new PostRepresentation('delete') },
			defaultResponseMediaType: MEDIA_JSON,
			defaultRequestMediaType: MEDIA_JSON,
			authRequired: true,
		});

		this.addAction('partialEdit', ( models: Post,  requestBody: PostReqBody,
			RequestMediaHandler: WritableRepresentation<Post, PostReqBody, AuthType>, auth: AuthType) => {

			RequestMediaHandler.applyEdit(requestBody, models, auth);
			models.save();
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

	modelsResolver(urlParams: { 'post_id': number }): Post {
		const post = posts[urlParams.post_id];

		if (post) {
			return post;
		}

		throw new NotFoundError('Can not find Post');
	}
}