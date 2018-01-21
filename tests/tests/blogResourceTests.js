"use strict";

let PostResource = require('../data/postResource.js');
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
            body: { title: message, status: 400 },
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
            body: { id: 12345, title: 'hello', post: "the body" },
            headers: {} 
        },
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
            body: { id: 12345, title: 'new edited title', post: "the body" },
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

exports['Test query validation single parameters'] = function (test) {
    ensureValidRequest(
        new PostResource(),
        'GET', 
        new URL('/posts/12345?page=5', BASE_URL),
        {
            post_id: 12345
        },
        undefined,
        {
            "Content-Type": "application/json",
            Authorization: 'Bearer abcde'
        },
        {
            status: 200,
            body: { id: 12345, title: 'hello', post: 'the body' },
            headers: {} 
        },
        test
    )
    .then(() => {
        test.done();
    });
};

exports['Test query validation fails on single parameters'] = function (test) {
    ensureInvalidRequest(
        new PostResource(),
        'GET', 
        new URL('/posts/12345?page=abc', BASE_URL),
        {
            post_id: 12345
        },
        undefined,
        {
            "Content-Type": "application/json",
            Authorization: 'Bearer abcde'
        },
        "Invalid Search Query",
        test
    )
    .then(() => {
        test.done();
    });
};

exports['Test query validation fails for additional properties'] = function (test) {
    ensureInvalidRequest(
        new PostResource(),
        'GET', 
        new URL('/posts/12345?bogusProperty=abc', BASE_URL),
        {
            post_id: 12345
        },
        undefined,
        {
            "Content-Type": "application/json",
            Authorization: 'Bearer abcde'
        },
        "Invalid Search Query",
        test
    )
    .then(() => {
        test.done();
    });
};

exports['Test query validation passes for required properties'] = function (test) {
    ensureValidRequest(
        new PostResource(true),
        'GET',
        new URL('/posts/12345?requiredProperty=true', BASE_URL),
        {
            post_id: 12345
        },
        undefined,
        {
            "Content-Type": "application/json",
            Authorization: 'Bearer abcde'
        },
        {
            status: 200,
            body: { id: 12345, title: 'hello', post: 'the body' },
            headers: {} 
        },
        test
    )
    .then(() => {
        test.done();
    });
};

exports['Test query validation fails for missing required properties'] = function (test) {
    ensureInvalidRequest(
        new PostResource(true),
        'GET', 
        new URL('/posts/12345', BASE_URL),
        {
            post_id: 12345
        },
        undefined,
        {
            "Content-Type": "application/json",
            Authorization: 'Bearer abcde'
        },
        "Invalid Search Query",
        test
    )
    .then(() => {
        test.done();
    });
};