import PostCollectionResource from '../data/postCollectionResource';
const BASE_URL = 'http://dashron.com';
import { URL } from 'url';
import { Response } from 'roads';
import Resource, { ParsedURLParams } from '../../Resource/resource';
import { HTTPErrors } from '../../index';

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

function ensureInvalidRequest(resource: Resource, method: string, url: URL, urlParams: ParsedURLParams | undefined, body: any, headers: {[x: string]: string}, message: string, additionalProblems?: Array<HTTPErrors.HTTPError>) {
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

function ensureValidRequest(resource: Resource, method: string, url: URL, urlParams: ParsedURLParams, body: any, headers: {[x: string]: string}, expectedResponse: Response) {
    body = fixBody(body);
    return resource.resolve(method, url, urlParams, body, headers)
    .then((response: Response) => {
        expect(response).toEqual(expectedResponse);
    });
}

describe('queryValidationTests', () => {

    test('Test query validation single parameters', function () {
        expect.assertions(1);

        return ensureValidRequest(
            new PostCollectionResource('get'),
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
                ],"perPage":10,"page":5}),
                headers: {"content-type": "application/json"} 
            }
        );
    });

    test('Test query validation fails on single parameters', function () {
        expect.assertions(1);
        
        return ensureInvalidRequest(
            new PostCollectionResource('get'),
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
            new PostCollectionResource('get'),
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
            new PostCollectionResource('requiredProperty'),
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
            new PostCollectionResource('requiredProperty'),
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