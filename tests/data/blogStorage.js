"use strict";

let Post = class Post {
    constructor(id, title, post, active) {
        this.id = id;
        this.title = title;
        this.post = post;
        this.active = active;
    }

    save() {
        
    }

    delete() {
        
    }
};

let newPosts = function () {
    return {
        1: new Post (1, "hello", "the body", 1),
        2: new Post (2, "hello", "the body", 0),
        3: new Post (3, "hello", "the body", 0),
        4: new Post (4, "hello", "the body", 1),
        12345: new Post (12345, "hello", "the body", 1)
    };
};

module.exports = {
    get: (id) => {
        let posts = newPosts();

        if (posts[id]) {
            return posts[id];
        }

        return null;
    },
    getAll: (page, perPage) => {
        let posts = newPosts();

        return [posts[1], posts[2], posts[3], posts[4], posts[12345]];
    },
    Post: Post
};