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

function ensureInvalidRequest(resource, method, url, urlParams, body, headers, message, additionalProblems) {
    body = fixBody(body);
    if (!additionalProblems) {
        additionalProblems = [];
    }
    
    return resource.resolve(method, url, urlParams, body, headers)
    .then((response) => {
        expect(response).toEqual({
            status: 400,
            body: JSON.stringify({ title: message, status: 400, "additional-problems": additionalProblems  }),
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

describe('queryValidationTests', () => {

    test('Test query validation single parameters', function () {
        expect.assertions(1);

        return ensureValidRequest(
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
                body: JSON.stringify({"data":[
                    {"id":1,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":2,"title":"hello","post":"the body", "active": false, "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":3,"title":"hello","post":"the body", "active": false, "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":4,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":12345,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}}
                ],"perPage":10,"page":1}),
                headers: {"content-type": "application/json"} 
            }
        );
    });

    test('Test query validation fails on single parameters', function () {
        expect.assertions(1);
        
        return ensureInvalidRequest(
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
            "Invalid Search Query"
        );
    });

    test('Test query validation fails for additional properties', function () {
        expect.assertions(1);
        
        return ensureInvalidRequest(
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
            "Invalid Search Query"
        );
    });

    test('Test query validation passes for required properties', function () {
        expect.assertions(1);
        
        return ensureValidRequest(
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
                body: JSON.stringify({"data":[
                    {"id":1,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":2,"title":"hello","post":"the body", "active": false, "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":3,"title":"hello","post":"the body", "active": false, "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":4,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                    {"id":12345,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}}
                ],"perPage":10,"page":1}),
                headers: {"content-type": "application/json"} 
            }
        );
    });

    test('Test query validation fails for missing required properties', function () {
        expect.assertions(1);
        
        return ensureInvalidRequest(
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
            "Invalid Search Query"
        );
    });
});