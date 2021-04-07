import { Resource } from '../../index';
import { AuthType } from './tokenResolver';
import { PostReqBody } from './postRepresentation';
import { Post } from './blogStorage';
export declare type PostActions = 'get' | 'delete' | 'partialEdit';
export default class PostResource extends Resource<Post, PostReqBody, AuthType> {
    protected label: string;
    constructor(label: string);
    modelsResolver(urlParams: {
        'post_id': number;
    }): Post;
}
