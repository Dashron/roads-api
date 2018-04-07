"use strict";

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

exports['Test query validation single parameters'] = function (test) {
    ensureValidRequest(
        new PostCollectionResource(),
        'GET', 
        new URL('/posts/12345?page=5', BASE_URL),
        {
            post_id: 12345
        },
        undefined,
        {
            "Content-Type": "application/json",
            authorization: 'Bearer abcde'
        },
        {
            status: 200,
            body: JSON.stringify({"data":[{"id":1,"title":"hello","post":"the body"},{"id":2,"title":"hello","post":"the body"},{"id":3,"title":"hello","post":"the body"},{"id":4,"title":"hello","post":"the body"},{"id":12345,"title":"hello","post":"the body"}],"perPage":10,"page":1}),
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
        new PostCollectionResource(),
        'GET', 
        new URL('/posts/12345?page=abc', BASE_URL),
        {
            post_id: 12345
        },
        undefined,
        {
            "Content-Type": "application/json",
            authorization: 'Bearer abcde'
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
        new PostCollectionResource(),
        'GET', 
        new URL('/posts/12345?bogusProperty=abc', BASE_URL),
        {
            post_id: 12345
        },
        undefined,
        {
            "Content-Type": "application/json",
            authorization: 'Bearer abcde'
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
        new PostCollectionResource(true),
        'GET',
        new URL('/posts/12345?requiredProperty=true', BASE_URL),
        {
            post_id: 12345
        },
        undefined,
        {
            "Content-Type": "application/json",
            authorization: 'Bearer abcde'
        },
        {
            status: 200,
            body: JSON.stringify({"data":[{"id":1,"title":"hello","post":"the body"},{"id":2,"title":"hello","post":"the body"},{"id":3,"title":"hello","post":"the body"},{"id":4,"title":"hello","post":"the body"},{"id":12345,"title":"hello","post":"the body"}],"perPage":10,"page":1}),
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
        new PostCollectionResource(true),
        'GET', 
        new URL('/posts/12345', BASE_URL),
        {
            post_id: 12345
        },
        undefined,
        {
            "Content-Type": "application/json",
            authorization: 'Bearer abcde'
        },
        "Invalid Search Query",
        test
    )
    .then(() => {
        test.done();
    });
};