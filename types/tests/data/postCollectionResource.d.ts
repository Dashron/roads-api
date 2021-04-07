import { Post } from './blogStorage';
import { Resource } from '../../index';
import { ParsedURLParams, ActionList } from '../../Resource/resource';
import { AuthFormat } from './tokenResolver';
export declare type PostCollectionActions = 'get' | 'append';
declare type PostCollectionModels = {
    posts: Array<Post>;
    perPage?: number;
    page?: number;
};
export default class PostCollectionResource extends Resource<PostCollectionModels, AuthFormat> {
    constructor(label: string);
    modelsResolver(urlParams: ParsedURLParams | undefined, searchParams: URLSearchParams | undefined, action: keyof ActionList, pathname: string): PostCollectionModels;
}
export {};
