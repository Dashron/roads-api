import { JSONRepresentation } from '../../index';
import { PostActions } from './postResource';
import { PostCollectionActions } from './postCollectionResource';
export default class PostRepresentation extends JSONRepresentation {
    constructor(action: PostActions | PostCollectionActions);
}
