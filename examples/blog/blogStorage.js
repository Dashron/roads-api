"use strict";

let Post = class Post {
    constructor(id, title, body) {
        this.id = id;
        this.title = title;
        this.body = body;
    }
};

let posts = {
    1: new Post (1, "hello", "the body"),
    2: new Post (2, "hello", "the body"),
    3: new Post (3, "hello", "the body"),
    4: new Post (4, "hello", "the body"),
    5: new Post (5, "hello", "the body"),
};


module.exports = {
    get: (id) => {
        if (posts[id]) {
            return posts;
        }

        return null;
    }
}