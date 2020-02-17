import { Resource } from '../../index';
import { ParsedURLParams, ActionList } from "../../Resource/resource";
export default class PostCollectionResource extends Resource {
    constructor(action: string);
    modelsResolver(urlParams: ParsedURLParams | undefined, searchParams: URLSearchParams | undefined, action: keyof ActionList, pathname: string): {
        [x: string]: any;
    };
}
