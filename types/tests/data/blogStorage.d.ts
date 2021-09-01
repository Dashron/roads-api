export declare class Post {
    id: number;
    title: string;
    post: string;
    active: number;
    writeOnly: string;
    constructor(id?: number, title?: string, post?: string, active?: number, writeOnly?: string);
    save(): void;
    delete(): void;
}
export declare function createPosts(): Post[];
declare const _default: {
    get: (id: number) => Post | null;
    getAll: (page: number, perPage: number) => Post[];
    Post: typeof Post;
};
export default _default;
