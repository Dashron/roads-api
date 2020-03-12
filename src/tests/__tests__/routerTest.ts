import Router from '../../core/router';
import PostResource from '../data/postResource';
let postResource = new PostResource('GET');
import { URL } from 'url';
import { Road, Response } from 'roads';

describe('router tests', () => {

    test('Test hostname only matches root resource', function () {
        expect.assertions(2);

        let router = new Router();
        router.addResource('/', postResource);

        return Promise.all([
            router.locateResource(new URL('http://api.dashron.com'))
            .then((response) => {
                expect(response).toEqual({
                    resource: postResource,
                    urlParams: {}
                });
            }),
            router.locateResource(new URL('http://api.dashron.com/'))
            .then((response) => {
                expect(response).toEqual({
                    resource: postResource,
                    urlParams: {}
                });
            })
        ]);
    });

    test('Test hostname only doesnt match a sub resource', function () {
        expect.assertions(1);

        let router = new Router();
        router.addResource('/', postResource);

        expect(router.locateResource(new URL('http://api.dashron.com/test'))).resolves.toEqual(false);
    });

    test('Test sub_route with variable is properly expanded', function () {
        expect.assertions(1);

        let router = new Router();
        router.addResource('/posts/{post_id}', postResource, {
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
            resource: postResource,
            urlParams: {
                post_id: 12345
            }
        });
    });

    test('Test sub_route with invalid parameter fails', function () {
        expect.assertions(1);

        let router = new Router();
        router.addResource('/posts/{post_id}', postResource, {
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
        // This is not ideal, we should send classes not instances
        // This should really be tested by using two different classes
        let resource = new PostResource('number resource');

        router.addResource('/posts/{post_id}', postResource, {
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
        router.addResource('/posts/{post_id}', postResource, {
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
        router.addResource('/posts/{post_id}', postResource, {
            urlParams: {
                schema: {
                    post_id: {
                        type: "number"
                    }
                }
            }
        });

        return expect(router.locateResource(new URL('http://api.dashron.com/posts/'))).resolves.toEqual({
            resource: postResource,
            urlParams: {}
        });
    });

    test('Test required string sub route fails with empty param', function () {
        let router = new Router();
        router.addResource('/posts/{post_slug}', postResource, {
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
        router.addResource('/posts/{post_slug}', postResource, {
            urlParams: {
                schema: {
                    post_slug: {
                        type: "string"
                    }
                }
            }
        });

        return expect(router.locateResource(new URL('http://api.dashron.com/posts/'))).resolves.toEqual({
            resource: postResource,
            // We don't want to indicate that an empty string was provided, we want to indicate that the parameter was left out
            urlParams: {}
        });
    });

    test('Test middleware responds successfully on resource hit', function () {
        expect.assertions(1);

        let road = new Road();
        let router = new Router();

        router.addResource('/posts/{post_id}', postResource);
        road.use(router.middleware('https://', 'dashron.com'));

        return expect(road.request('GET', '/posts/12345', undefined, {
            authorization: 'Bearer abcde'
        })).resolves.toEqual(new Response(JSON.stringify({
            id: 12345,
            title: "hello",
            post: "the body", 
            "active": true, 
            "nestingTest": {"nestedField": "nestedValue"}
        }), 200, {"content-type": "application/json"}));
    });

    test('Test middleware responds successfully on one resource miss', function () {
        expect.assertions(1);

        let road = new Road();
        let router = new Router();

        router.addResource('/posts/{post_id}', postResource, {
            urlParams: {
                schema: {
                    post_id: {
                        type: "number",
                        minimum: 99999
                    }
                },
                required: ["post_id"]
            }
        });

        road.use(router.middleware('https://', 'dashron.com'));

        return expect(road.request('GET', '/posts/1', undefined, {
            authorization: 'Bearer abcde'
        })).resolves.toEqual(new Response(JSON.stringify({
            title: "Not Found",
            status: 404,
            "additional-problems": []
        }), 404, {"content-type": "application/json"}));
    });

    test('Test middleware responds successfully on one resource miss, and one resource hit', function () {
        expect.assertions(1);

        let road = new Road();
        let router = new Router();

        router.addResource('/posts/{post_id}', postResource, {
            urlParams: {
                schema: {
                    post_id: {
                        type: "number",
                        minimum: 99999
                    }
                },
                required: ["post_id"]
            }
        });

        router.addResource('/posts/{post_id}', postResource, {
            urlParams: {
                schema: {
                    post_id: {
                        type: "number"
                    }
                },
                required: ["post_id"]
            }
        });

        road.use(router.middleware('https://', 'dashron.com'));

        return expect(road.request('GET', '/posts/1', undefined, {
            authorization: 'Bearer abcde'
        })).resolves.toEqual(new Response(JSON.stringify({
            id: 1,
            title: "hello",
            post: "the body", 
            "active": true, 
            "nestingTest": {"nestedField": "nestedValue"}
        }), 200, {"content-type": "application/json"}));
    });

    // TODO: Write a test like "test middleware responds successfully on resource hit" that tests if one fails, and then tests again if there are two, the first fails, the second succeeds. test for both urls and just url param validation differences.
});