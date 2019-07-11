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

function ensureInvalidRequest(resource, method, url, urlParams, body, headers, message, additionalProblems) {
    body = fixBody(body);
    if (!additionalProblems) {
        additionalProblems = [];
    }

    return resource.resolve(method, url, urlParams, body, headers)
    .then((response) => {
        expect(response).toEqual({
            status: 400,
            body: JSON.stringify({ title: message, status: 400, "additional-problems": additionalProblems }),
            headers: {"content-type": "application/json"} 
        });
    });
}

function ensureValidRequest(resource, method, url, urlParams, body, headers, expectedResponse) {
    body = fixBody(body);
    return resource.resolve(method, url, urlParams, body, headers)
    .then((response) => {
        expect(response).toEqual(expectedResponse);
    });
}

describe('blog resource tests', () => {
    test('Test GET Resource execution', function () {
        expect.assertions(1);

        return ensureValidRequest(
            new PostResource(),
            'GET', 
            new URL('/posts/12345', BASE_URL), 
            {
                post_id: 12345
            },
            undefined, 
            {
                authorization: 'Bearer abcde'
            }, {
                status: 200,
                body: JSON.stringify({ id: 12345, title: 'hello', post: "the body", "nestingTest": {"nestedField": "nestedValue"}}),
                headers: {"content-type": "application/json"}
            }
        );
    });

    test('Test GET Collection Resource execution', function () {
        expect.assertions(1);

        return ensureValidRequest(
            new PostCollectionResource(),
            'GET', 
            new URL('/posts', BASE_URL), 
            undefined,
            undefined, 
            {
                authorization: 'Bearer abcde'
            }, {
                status: 200,
                body: JSON.stringify({
                    data: [{"id":1,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":2,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":3,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":4,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":12345,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}}],
                    perPage: 10,
                    page: 1
                }),
                headers: {"content-type": "application/json"}
            }
        );

    });

    test('Test valid POST Resource execution', function () {
        expect.assertions(1);

        // Edit resource
        return ensureValidRequest(
            new PostCollectionResource(),
            'POST',  
            new URL('/posts', BASE_URL), 
            undefined, 
            {
                title: "new title",
                post: "my blog post", 
                nestingTest: {"nestedField": "nestedValue"}
            }, {
                "Content-Type": "application/json",
                authorization: 'Bearer abcde'
            }, {
                status: 201,
                body: JSON.stringify({"data":[
                    {"id":1,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":2,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":3,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":4,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":12345,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":12346,"title":"new title","post":"my blog post", "nestingTest": {"nestedField": "nestedValue"}}
                ],"perPage":10,"page":1}),
                headers: {"content-type": "application/json"}
            }
        );
    });

    test('Test extra fields are dropped before they hit the resource', function () {
        expect.assertions(1);

        // Edit resource
        return ensureValidRequest(
            new PostCollectionResource(),
            'POST',  
            new URL('/posts', BASE_URL), 
            undefined, 
            {
                title: "new title",
                post: "my blog post", 
                nestingTest: {"nestedField": "nestedValue"},
                whatever: "stuff"
            }, {
                "Content-Type": "application/json",
                authorization: 'Bearer abcde'
            }, {
                status: 201,
                body: JSON.stringify({"data":[
                    {"id":1,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":2,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":3,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":4,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":12345,"title":"hello","post":"the body", "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":12346,"title":"new title","post":"my blog post", "nestingTest": {"nestedField": "nestedValue"}}
                ]
                ,"perPage":10,"page":1}),
                headers: {"content-type": "application/json"}
            }
        );
    });

    test('Test invalid POST Resource execution: missing required top level fields', function () {
        expect.assertions(1);

        // Edit resource
        return ensureInvalidRequest(
            new PostCollectionResource(),
            'POST',  
            new URL('/posts', BASE_URL), 
            undefined, 
            { }, {
                "Content-Type": "application/json",
                authorization: 'Bearer abcde'
            }, 
            "Invalid request body",
            [{"title":"should have required property 'title'", "status":400,"additional-problems":[], "field": '/title'},
             {"title":"should have required property 'post'", "status":400, "additional-problems":[], "field": '/post'},
             {"title":"should have required property 'nestingTest'", "status": 400, "additional-problems":[], "field": "/nestingTest"}],
        );
    });

    test('Test invalid POST Resource execution: missing required second tier fields', function () {
        expect.assertions(1);

        // Edit resource
        return ensureInvalidRequest(
            new PostCollectionResource(),
            'POST',  
            new URL('/posts', BASE_URL), 
            undefined, 
            {
                "nestingTest": {

                }
            }, {
                "Content-Type": "application/json",
                authorization: 'Bearer abcde'
            }, 
            "Invalid request body",
            [{"title":"should have required property 'title'", "status":400,"additional-problems":[], "field": '/title'},
             {"title":"should have required property 'post'", "status":400, "additional-problems":[], "field": '/post'},
             {"title":"should have required property 'nestedField'", "status": 400, "additional-problems":[], "field": "/nestingTest/nestedField"}],
        );
    });

    test('Test Invalid POST Resource execution: setting the id', function () {
        expect.assertions(1);

        return ensureInvalidRequest(
            new PostCollectionResource(),
            'POST', 
            new URL('/posts', BASE_URL),
            undefined,
            {
                title: "New Name", 
                id: 5, 
                post:"New post contents", 
                nestingTest: {"nestedField": "nestedValue"}
            }, {
                "Content-Type": "application/json",
                authorization: 'Bearer abcde'
            }, 
            "Invalid request body",
            [{"title":"should pass \"roadsReadOnly\" keyword validation","status":400, "additional-problems":[], "field": "/id"}]
        );
    });

    test('Test Invalid POST Resource execution: method not allowed', function () {
        expect.assertions(1);

        return (new PostResource()).resolve('POST', new URL('/posts/12345', BASE_URL), {
            post_id: 12345
        }, {
            title: "New Name", 
            id: 5, 
            post:"New post contents", 
            nestingTest: {"nestedField": "nestedValue"}
        }, {
            "Content-Type": "application/json",
            authorization: 'Bearer abcde'
        })
        .then((response) => {
            expect(response).toEqual({
                status: 405,
                body: JSON.stringify({ title: "GET, DELETE, PATCH", status: 405, "additional-problems": [] }),
                headers: {"content-type": "application/json"} 
            });
        });
    });

    test('Test valid PATCH Resource execution', function () {
        expect.assertions(1);

        // Edit resource
        return ensureValidRequest(
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
                authorization: 'Bearer abcde'
            }, {
                status: 200,
                body: JSON.stringify({ id: 12345, title: 'new edited title', post: "the body", "nestingTest": {"nestedField": "nestedValue"} }),
                headers: {"content-type": "application/json"}
            }
        );
    });

    test('Test Invalid PATCH Resource execution', function () {
        expect.assertions(1);

        return ensureInvalidRequest(
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
                authorization: 'Bearer abcde'
            }, 
            "Invalid request body",
            [{"title":"should pass \"roadsReadOnly\" keyword validation","status":400,"additional-problems":[], "field": "/id"}]
        );
    });

    test('Test Valid DELETE Resource execution passes', function () {
        expect.assertions(1);

        // Delete resource
        return ensureValidRequest(
            new PostResource(),
            'DELETE', 
            new URL('/posts/12345', BASE_URL), 
            {
                post_id: 12345
            },
            undefined, 
            {
                "Content-Type": "application/json",
                authorization: 'Bearer abcde'
            }, {
                status: 204,
                body: '',
                headers: {"content-type": "application/json"}
            }
        );
    });
});

