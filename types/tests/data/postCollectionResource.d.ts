import { Resource } from '../../index';
import { ParsedURLParams, ActionList } from '../../Resource/resource';
export declare type PostCollectionActions = 'get' | 'append';
export default class PostCollectionResource extends Resource {
    constructor(label: string);
    modelsResolver(urlParams: ParsedURLParams | undefined, searchParams: URLSearchParams | undefined, action: keyof ActionList, pathname: string): {
        [x: string]: any;
    };
}
