"use strict";

let Router = require('../../index.js').Router;
let HTTPErrors = require('../../index.js').HTTPErrors;
let InputValidationError = HTTPErrors.InputValidationError;

let PostResource = require('../data/postResource.js');
let { URL } = require('url');

exports['Test hostname only matches root resource'] = function (test) {
    let router = new Router();
    let resource = new PostResource();

    router.addResource('/', resource);

    Promise.all([
        router.locateResource(new URL('http://api.dashron.com'))
        .then((response) => {
            test.deepEqual(response, {
                resource: resource,
                urlParams: {}
            });
        }),
        router.locateResource(new URL('http://api.dashron.com/'))
        .then((response) => {
            test.deepEqual(response, {
                resource: resource,
                urlParams: {}
            });
        })
    ])
    .then(() => {
        test.done();
    })
    .catch((e) => {
        test.fail(e.stack);
        test.done();
    });
};

exports['Test hostname only doesnt match a sub resource'] = function (test) {
    let router = new Router();
    let resource = new PostResource();

    router.addResource('/', resource);

    test.deepEqual(router.locateResource(new URL('http://api.dashron.com/test')), false);
    test.done();
};

exports['Test sub_route with variable is properly expanded'] = function (test) {
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

    router.locateResource(new URL('http://api.dashron.com/posts/12345'))
    .then((response) => {
        test.deepEqual(response, {
            resource: resource,
            urlParams: {
                post_id: 12345
            }
        });
        test.done();
    })
    .catch((e) => {
        test.fail(e.stack);
        test.done();
    });
};

exports['Test sub_route with invalid parameter fails'] = function (test) {
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

    router.locateResource(new URL('http://api.dashron.com/posts/abcd'))
    .then((response) => {
        test.fail('This method should have failed');
        test.done();
    })
    .catch((e) => {
        test.ok(e instanceof InputValidationError);
        test.done();

    });
};

exports['Test sub_route with missing required parameter fails'] = function (test) {
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

    router.locateResource(new URL('http://api.dashron.com/posts/'))
    .then((response) => {
        test.fail('This method should have failed');
        test.done();
    })
    .catch((e) => {
        // TODO: Ensure we have the correct validation reason, post_id missing, not invalid number
        test.ok(e instanceof InputValidationError);
        test.done();

    });
};

exports['Test sub_route with missing optional parameter works'] = function (test) {
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

    router.locateResource(new URL('http://api.dashron.com/posts/'))
    .then((response) => {
        test.deepEqual(response, {
            resource: resource,
            urlParams: {}
        });
        test.done();
    })
    .catch((e) => {
        test.fail(e.stack);
        test.done();
    });
};

exports['Test required string sub route fails with empty param'] = function (test) {
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

    router.locateResource(new URL('http://api.dashron.com/posts/'))
    .then((response) => {
        test.fail('This method should have failed');
        test.done();
    })
    .catch((e) => {
        test.ok(e instanceof InputValidationError);
        test.done();

    });
};

exports['Test optional string sub route passes with empty param'] = function (test) {
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

    router.locateResource(new URL('http://api.dashron.com/posts/'))
    .then((response) => {
        test.deepEqual(response, {
            resource: resource,
            // We don't want to indicate that an empty string was provided, we want to indicate that the parameter was left out
            urlParams: {}
        });
        test.done();
    })
    .catch((e) => {
        test.fail(e.stack);
        test.done();
    });
};