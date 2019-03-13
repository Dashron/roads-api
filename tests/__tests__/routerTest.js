"use strict";

let Router = require('../../index.js').Router;
let HTTPErrors = require('../../index.js').HTTPErrors;
let InputValidationError = HTTPErrors.InputValidationError;

let PostResource = require('../data/postResource.js');
let { URL } = require('url');

describe('router tests', () => {

    test('Test hostname only matches root resource', function () {
        expect.assertions(2);

        let router = new Router();
        let resource = new PostResource();

        router.addResource('/', resource);

        return Promise.all([
            router.locateResource(new URL('http://api.dashron.com'))
            .then((response) => {
                expect(response).toEqual({
                    resource: resource,
                    urlParams: {}
                });
            }),
            router.locateResource(new URL('http://api.dashron.com/'))
            .then((response) => {
                expect(response).toEqual({
                    resource: resource,
                    urlParams: {}
                });
            })
        ]);
    });

    test('Test hostname only doesnt match a sub resource', function () {
        expect.assertions(1);

        let router = new Router();
        let resource = new PostResource();

        router.addResource('/', resource);

        expect(router.locateResource(new URL('http://api.dashron.com/test'))).resolves.toEqual(false);
    });

    test('Test sub_route with variable is properly expanded', function () {
        expect.assertions(1);

        let router = new Router();
        let resource = new PostResource();

        router.addResource('/posts/{post_id}', resource, {
            urlParams: {
                schema: {
                    post_id: {
                        type: "number"
                    }
                },
                required: ['post_id']
            }
        });

        return expect(router.locateResource(new URL('http://api.dashron.com/posts/12345'))).resolves.toEqual({
            resource: resource,
            urlParams: {
                post_id: 12345
            }
        });
    });

    test('Test sub_route with invalid parameter fails', function () {
        expect.assertions(1);

        let router = new Router();
        let resource = new PostResource();

        router.addResource('/posts/{post_id}', resource, {
            urlParams: {
                schema: {
                    post_id: {
                        type: "number"
                    }
                },
                required: ['post_id']
            }
        });

        return expect(router.locateResource(new URL('http://api.dashron.com/posts/abcd'))).resolves.toEqual(false);
    });

    test('Test failed parameter validation passes on to subsequent resources', function () {
        expect.assertions(1);

        let router = new Router();
        let resource = new PostResource('number resource');

        router.addResource('/posts/{post_id}', resource, {
            urlParams: {
                schema: {
                    post_id: {
                        type: "number"
                    }
                },
                required: ['post_id']
            }
        });

        let resource2 = new PostResource('string resource');

        router.addResource('/posts/{post_id}', resource2, {
            urlParams: {
                schema: {
                    post_id: {
                        type: "string"
                    }
                },
                required: ['post_id']
            }
        });

        return expect(router.locateResource(new URL('http://api.dashron.com/posts/abcd'))).resolves.toEqual({
            resource: resource2,
            urlParams: {
                post_id: "abcd"
            }
        });
    });

    test('Test sub_route with missing required parameter fails', function () {
        expect.assertions(1);

        let router = new Router();
        let resource = new PostResource();

        router.addResource('/posts/{post_id}', resource, {
            urlParams: {
                schema: {
                    post_id: {
                        type: "number"
                    }
                },
                required: ['post_id']
            }
        });

        // TODO: Ensure we have the correct validation reason, post_id missing, not invalid number
        return expect(router.locateResource(new URL('http://api.dashron.com/posts/'))).resolves.toEqual(false);
    });

    test('Test sub_route with missing optional parameter works', function () {
        expect.assertions(1);

        let router = new Router();
        let resource = new PostResource();

        router.addResource('/posts/{post_id}', resource, {
            urlParams: {
                schema: {
                    post_id: {
                        type: "number"
                    }
                }
            }
        });

        return expect(router.locateResource(new URL('http://api.dashron.com/posts/'))).resolves.toEqual({
            resource: resource,
            urlParams: {}
        });
    });

    test('Test required string sub route fails with empty param', function () {
        let router = new Router();
        let resource = new PostResource();

        router.addResource('/posts/{post_slug}', resource, {
            urlParams: {
                schema: {
                    post_slug: {
                        type: "string"
                    }
                },
                required: ["post_slug"]
            }
        });

        return expect(router.locateResource(new URL('http://api.dashron.com/posts/'))).resolves.toEqual(false);
    });

    test('Test optional string sub route passes with empty param', function () {
        expect.assertions(1);

        let router = new Router();
        let resource = new PostResource();

        router.addResource('/posts/{post_slug}', resource, {
            urlParams: {
                schema: {
                    post_slug: {
                        type: "string"
                    }
                }
            }
        });

        return expect(router.locateResource(new URL('http://api.dashron.com/posts/'))).resolves.toEqual({
            resource: resource,
            // We don't want to indicate that an empty string was provided, we want to indicate that the parameter was left out
            urlParams: {}
        });
    });
});