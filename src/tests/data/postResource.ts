import { Resource } from '../../index';
import tokenResolver from './tokenResolver';
import postRepresentation from './postRepresentation';
import { Post, createPosts } from './blogStorage';
import { WritableRepresentation } from '../../Representation/representation';
import { NotFoundError } from '../../core/httpErrors';
import { MEDIA_JSON, MEDIA_JSON_MERGE, AUTH_BEARER } from '../../core/constants';

let posts = createPosts();

export default class PostResource extends Resource {
    protected label: string;

    constructor(label: string) {
        //TODO: Make is post change this whole resource to append only
        super({
            authSchemes: { [ AUTH_BEARER ]: tokenResolver },
            responseMediaTypes: { [ MEDIA_JSON ]: postRepresentation },
            defaultResponseMediaType: MEDIA_JSON,
            defaultRequestMediaType: MEDIA_JSON,
            authRequired: true,
        }, ["get", "delete"]);
        
        this.addAction("partialEdit", (models: Post, requestBody: any, RequestMediaHandler: WritableRepresentation, auth: any) => {
            RequestMediaHandler.applyEdit(requestBody, models, auth);
            models.save();
        }, {
            requestMediaTypes: { [MEDIA_JSON_MERGE]: postRepresentation },
            defaultRequestMediaType: MEDIA_JSON_MERGE,
            defaultResponseMediaType: MEDIA_JSON
        });

        this.addAction("delete", (models: Post) => {
            models.delete();
        });

        this.addAction("get", () => {});

        // This is a quick hack to easily differentiate between two differenet post resources
        if (label) {
            this.label = label;
        }
    }

    modelsResolver(urlParams: { "post_id": number }) {
        let post = posts[urlParams.post_id];
        
        if (post) {
            return post;
        }

        throw new NotFoundError('Can not find Post');
    }
};