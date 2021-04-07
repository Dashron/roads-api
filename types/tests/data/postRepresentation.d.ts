import { JSONRepresentation } from '../../index';
import { Post } from './blogStorage';
import { PostActions } from './postResource';
import { PostCollectionActions } from './postCollectionResource';
import { AuthType } from './tokenResolver';
export interface PostReqBody {
    id: number;
    title: string;
    post: string;
    active: boolean;
    nestingTest: {
        nestedField: string;
    };
}
export default class PostRepresentation extends JSONRepresentation<Post, PostReqBody, AuthType> {
    constructor(action: PostActions | PostCollectionActions);
}
