import PostResource from '../data/postResource';
import PostCollectionResource from '../data/postCollectionResource';
import { Response } from 'roads';
import Resource, { ParsedURLParams } from '../../Resource/resource';

const BASE_URL = 'http://dashron.com';
let { URL } = require('url');

// body must be a string
function fixBody(body: any) {
    if (typeof(body) === "object") {
        return JSON.stringify(body);
    }

    if (typeof(body) === "undefined") {
        return undefined;
    }

    return body.toString();
}

function ensureInvalidRequest(resource: Resource, method: string, url: URL, urlParams: ParsedURLParams | undefined, body: any, headers: {[x: string]: string} | undefined, message: string, additionalProblems: Array<object>) {
    body = fixBody(body);
    if (!additionalProblems) {
        additionalProblems = [];
    }

    return resource.resolve(method, url, urlParams, body, headers)
    .then((response: Response) => {
        expect(response).toEqual(new Response(JSON.stringify({ title: message, status: 400, "additional-problems": additionalProblems }), 400, {"content-type": "application/json"}));
    });
}

function ensureValidRequest(resource: Resource, method: string, url: URL, urlParams: ParsedURLParams | undefined, body: any, headers: {[x: string]: string} | undefined, expectedResponse: Response) {
    body = fixBody(body);
    return resource.resolve(method, url, urlParams, body, headers)
    .then((response: Response) => {
        expect(response).toEqual(expectedResponse);
    });
}

describe('blog resource tests', () => {
    test('Test GET Resource execution', function () {
        expect.assertions(1);

        return ensureValidRequest(
            new PostResource('get'),
            'GET', 
            new URL('/posts/12345', BASE_URL), 
            {
                post_id: 12345
            },
            undefined, 
            {
                authorization: 'Bearer abcde'
            }, 
            new Response(JSON.stringify({ id: 12345, title: 'hello', post: "the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}}), 200, {"content-type": "application/json"})
        );
    });

    test('Test GET Collection Resource execution', function () {
        expect.assertions(1);

        return ensureValidRequest(
            new PostCollectionResource('get'),
            'GET', 
            new URL('/posts', BASE_URL), 
            undefined,
            undefined, 
            {
                authorization: 'Bearer abcde'
            }, 
            new Response(JSON.stringify({
                data: [{"id":1,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":2,"title":"hello","post":"the body", "active": false, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":3,"title":"hello","post":"the body", "active": false, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":4,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":12345,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}}],
                perPage: 10,
                page: 1
            }), 200, {"content-type": "application/json"})
        );

    });

    test('Test valid POST Resource execution', function () {
        expect.assertions(1);

        // Edit resource
        return ensureValidRequest(
            new PostCollectionResource('append'),
            'POST',  
            new URL('/posts', BASE_URL), 
            undefined, 
            {
                title: "new title",
                post: "my blog post", 
                nestingTest: {"nestedField": "nestedValue"},
                active: true
            }, {
                "Content-Type": "application/json",
                authorization: 'Bearer abcde'
            },
            new Response(JSON.stringify({"data":[
                {"id":1,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":2,"title":"hello","post":"the body", "active": false, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":3,"title":"hello","post":"the body", "active": false, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":4,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":12345,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":12346,"title":"new title","post":"my blog post", "active": true, "nestingTest": {"nestedField": "nestedValue"}}
            ],"perPage":10,"page":1}), 201, {"content-type": "application/json"})
        );
    });

    test('Test extra fields are dropped before they hit the resource', function () {
        expect.assertions(1);

        // Edit resource
        return ensureValidRequest(
            new PostCollectionResource('append'),
            'POST',  
            new URL('/posts', BASE_URL), 
            undefined, 
            {
                title: "new title",
                post: "my blog post", 
                nestingTest: {"nestedField": "nestedValue"},
                whatever: "stuff",
                active: true
            }, {
                "Content-Type": "application/json",
                authorization: 'Bearer abcde'
            },
            new Response(JSON.stringify({"data":[
                {"id":1,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":2,"title":"hello","post":"the body", "active": false, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":3,"title":"hello","post":"the body", "active": false, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":4,"title":"hello","post":"the body", "active": true, "nestingTest": {"nestedField": "nestedValue"}},
                {"id":12345,"title":"hello","post":"the body","active": true,  "nestingTest": {"nestedField": "nestedValue"}},
                {"id":12346,"title":"new title","post":"my blog post", "active": true, "nestingTest": {"nestedField": "nestedValue"}}
            ]
            ,"perPage":10,"page":1}), 201, {"content-type": "application/json"})
        );
    });

    test('Test invalid POST Resource execution: missing required top level fields', function () {
        expect.assertions(1);

        // Edit resource
        return ensureInvalidRequest(
            new PostCollectionResource('append'),
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
             {"title":"should have required property 'active'", "status":400, "additional-problems":[], "field": '/active'},
             {"title":"should have required property 'nestingTest'", "status": 400, "additional-problems":[], "field": "/nestingTest"}],
        );
    });

    test('Test invalid POST Resource execution: missing required second tier fields', function () {
        expect.assertions(1);

        // Edit resource
        return ensureInvalidRequest(
            new PostCollectionResource('append'),
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
             {"title":"should have required property 'active'", "status":400, "additional-problems":[], "field": '/active'},
             {"title":"should have required property 'nestedField'", "status": 400, "additional-problems":[], "field": "/nestingTest/nestedField"}],
        );
    });

    test('Test Invalid POST Resource execution: setting the id', function () {
        expect.assertions(1);

        return ensureInvalidRequest(
            new PostCollectionResource('append'),
            'POST', 
            new URL('/posts', BASE_URL),
            undefined,
            {
                title: "New Name", 
                id: 5, 
                post:"New post contents", 
                nestingTest: {"nestedField": "nestedValue"},
                active: true
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

        return (new PostResource('append')).resolve('POST', new URL('/posts/12345', BASE_URL), {
            post_id: 12345
        }, JSON.stringify({
            title: "New Name", 
            id: 5, 
            post:"New post contents", 
            nestingTest: {"nestedField": "nestedValue"}
        }), {
            "Content-Type": "application/json",
            authorization: 'Bearer abcde'
        })
        .then((response: Response) => {
            expect(response).toEqual(new Response(JSON.stringify({ title: "GET, DELETE, PATCH", status: 405, "additional-problems": [] }), 405, {"content-type": "application/json"}));
        });
    });

    test('Test valid PATCH Resource execution', function () {
        expect.assertions(1);

        // Edit resource
        return ensureValidRequest(
            new PostResource('edit'),
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
            }, new Response(JSON.stringify({ id: 12345, title: 'new edited title', post: "the body", "active": true, "nestingTest": {"nestedField": "nestedValue"} }), 200, {"content-type": "application/json"})
        );
    });

    test('Test Invalid PATCH Resource execution', function () {
        expect.assertions(1);

        return ensureInvalidRequest(
            new PostResource('edit'),
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
            new PostResource('delete'),
            'DELETE', 
            new URL('/posts/12345', BASE_URL), 
            {
                post_id: 12345
            },
            undefined, 
            {
                "Content-Type": "application/json",
                authorization: 'Bearer abcde'
            }, new Response('', 204, {"content-type": "application/json"})
        );
    });
});
