import { Resource } from '../../index';
import { Post } from './blogStorage';
export default class PostResource extends Resource {
    protected label: string;
    constructor(label: string);
    modelsResolver(urlParams: {
        "post_id": number;
    }): Post;
}