import { Resource } from '../../index';
import { AuthFormat } from './tokenResolver';
import { PostFormat } from './postRepresentation';
import { Post } from './blogStorage';
export declare type PostActions = 'get' | 'delete' | 'partialEdit';
export default class PostResource extends Resource<PostFormat, Post, AuthFormat> {
    protected label: string;
    constructor(label: string);
    modelsResolver(urlParams: {
        'post_id': number;
    }): Post;
}
