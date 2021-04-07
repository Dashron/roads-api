import { JSONRepresentation } from '../../index';
import { Post } from './blogStorage';
import { PostActions } from './postResource';
import { PostCollectionActions } from './postCollectionResource';
import { AuthFormat } from './tokenResolver';
export interface PostFormat {
    id: number;
    title: string;
    post: string;
    active: boolean;
    nestingTest: {
        nestedField: string;
    };
}
export default class PostRepresentation extends JSONRepresentation<PostFormat, Post, AuthFormat> {
    constructor(action: PostActions | PostCollectionActions);
}
