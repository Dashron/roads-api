export class Post {
    id: number;
    title: string;
    post: string;
    active: number;

    constructor(id?: number, title?: string, post?: string, active: number = 1) {
        if (id) {
            this.id = id;
        }

        if (title) {
            this.title = title;
        }

        if (post) {
            this.post = post;
        }
        
        this.active = active;
    }

    save() {
        
    }

    delete() {
        
    }
};

export function createPosts () {
    let posts: Array<Post> = [];
    
    posts[1] = new Post (1, "hello", "the body", 1);
    posts[2] = new Post (2, "hello", "the body", 0);
    posts[3] = new Post (3, "hello", "the body", 0);
    posts[4] = new Post (4, "hello", "the body", 1);
    posts[12345] = new Post (12345, "hello", "the body", 1);

    return posts;
};

export default {
    get: (id: number) => {
        let posts = createPosts();

        if (posts[id]) {
            return posts[id];
        }

        return null;
    },
    getAll: (page: number, perPage: number) => {
        let posts = createPosts();

        return [posts[1], posts[2], posts[3], posts[4], posts[12345]];
    },
    Post: Post
};