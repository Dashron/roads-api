"use strict";

let Post = class Post {
    constructor(id, title, post) {
        this.id = id;
        this.title = title;
        this.post = post;
    }

    save() {
        
    }

    delete() {
        
    }
};

let newPosts = function () {
    return {
        1: new Post (1, "hello", "the body"),
        2: new Post (2, "hello", "the body"),
        3: new Post (3, "hello", "the body"),
        4: new Post (4, "hello", "the body"),
        12345: new Post (12345, "hello", "the body")
    };
};

module.exports = {
    get: (id) => {
        let posts = newPosts();

        if (posts[id]) {
            return posts[id];
        }

        return null;
    }
}