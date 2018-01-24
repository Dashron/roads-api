"use strict";

let PostResource = require('../data/postResource.js');
let PostCollectionResource = require('../data/postCollectionResource.js');

const BASE_URL = 'http://dashron.com';
let { URL } = require('url');

// body must be a string
function fixBody(body) {
    if (typeof(body) === "object") {
        return JSON.stringify(body);
    }

    if (typeof(body) === "undefined") {
        return undefined;
    }

    return body.toString();
}

function ensureInvalidRequest(resource, method, url, urlParams, body, headers, message, test) {
    body = fixBody(body);
    return resource.resolve(method, url, urlParams, body, headers)
    .then((response) => {
        test.deepEqual(response, {
            status: 400,
            body: JSON.stringify({ title: message, status: 400 }),
            headers: {} 
        });
    })
    .catch((e) => {
        test.fail(e.stack);
    });
}

function ensureValidRequest(resource, method, url, urlParams, body, headers, expectedResponse, test) {
    body = fixBody(body);
    return resource.resolve(method, url, urlParams, body, headers)
    .then((response) => {
        test.deepEqual(response, expectedResponse);
    })
    .catch((e) => {
        test.fail(e.stack);
    });
}


exports['Test GET Resource execution'] = function (test) {
    ensureValidRequest(
        new PostResource(),
        'GET', 
        new URL('/posts/12345', BASE_URL), 
        {
            post_id: 12345
        },
        undefined, 
        {
            Authorization: 'Bearer abcde'
        }, {
            status: 200,
            body: JSON.stringify({ id: 12345, title: 'hello', post: "the body" }),
            headers: {} 
        },
        test
    )
    .then(() => {
        test.done();
    });
};

exports['Test GET Collection Resource execution'] = function (test) {
    ensureValidRequest(
        new PostCollectionResource(),
        'GET', 
        new URL('/posts', BASE_URL), 
        undefined,
        undefined, 
        {
            Authorization: 'Bearer abcde'
        }, {
            status: 200,
            body: JSON.stringify({
                data: [{"id":1,"title":"hello","post":"the body"},{"id":2,"title":"hello","post":"the body"},{"id":3,"title":"hello","post":"the body"},{"id":4,"title":"hello","post":"the body"},{"id":12345,"title":"hello","post":"the body"}],
                perPage: 10,
                page: 1
            }),
            headers: {} 
        },
        test
    )
    .then(() => {
        test.done();
    });

};

exports['Test valid POST Resource execution'] = function (test) {
    // Edit resource
    ensureValidRequest(
        new PostCollectionResource(),
        'POST',  
        new URL('/posts', BASE_URL), 
        undefined, 
        {
            title: "new title",
            post: "my blog post"
        }, {
            "Content-Type": "application/json",
            Authorization: 'Bearer abcde'
        }, {
            status: 201,
            body: JSON.stringify({"data":[{"id":1,"title":"hello","post":"the body"},{"id":2,"title":"hello","post":"the body"},{"id":3,"title":"hello","post":"the body"},{"id":4,"title":"hello","post":"the body"},{"id":12345,"title":"hello","post":"the body"},{"id":12346,"title":"new title","post":"my blog post"}],"perPage":10,"page":1}),
            headers: {} 
        },
        test
    )
    .then(() => {
        test.done();
    });
};

exports['Test Invalid POST Resource execution'] = function (test) {
    ensureInvalidRequest(
        new PostCollectionResource(),
        'POST', 
        new URL('/posts/12345', BASE_URL), 
        {
            post_id: 12345
        }, 
        {
            title: "New Name", 
            id: 5, 
            post:"New post contents"
        }, {
            "Content-Type": "application/json",
            Authorization: 'Bearer abcde'
        }, 
        "Invalid request body",
        test
    )
    .then(() => {
        test.done();
    });
};

exports['Test valid PATCH Resource execution'] = function (test) {
    // Edit resource
    ensureValidRequest(
        new PostResource(),
        'PATCH',  
        new URL('/posts/12345', BASE_URL), 
        {
            post_id: 12345
        }, 
        {
            title: "new edited title"
        }, {
            "Content-Type": "application/merge-patch+json",
            Authorization: 'Bearer abcde'
        }, {
            status: 200,
            body: JSON.stringify({ id: 12345, title: 'new edited title', post: "the body" }),
            headers: {} 
        },
        test
    )
    .then(() => {
        test.done();
    });
};

exports['Test Invalid PATCH Resource execution'] = function (test) {
    ensureInvalidRequest(
        new PostResource(),
        'PATCH', 
        new URL('/posts/12345', BASE_URL), 
        {
            post_id: 12345
        }, 
        {
            title: "New Name", 
            id: 5, 
            post:"New post contents"
        }, {
            "Content-Type": "application/merge-patch+json",
            Authorization: 'Bearer abcde'
        }, 
        "Invalid request body",
        test
    )
    .then(() => {
        test.done();
    });
};

exports['Test Valid DELETE Resource execution passes'] = function (test) {
    // Delete resource
    ensureValidRequest(
        new PostResource(),
        'DELETE', 
        new URL('/posts/12345', BASE_URL), 
        {
            post_id: 12345
        },
        undefined, 
        {
            "Content-Type": "application/json",
            Authorization: 'Bearer abcde'
        }, {
            status: 204,
            body: '',
            headers: {} 
        },
        test
    )
    .then(() => {
        test.done();
    });
};

