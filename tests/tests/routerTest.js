"use strict";

let Router = require('../../index.js').Router;
let PostResource = require('../data/postResource.js');
let { URL } = require('url');

exports['Test hostname only matches root resource'] = function (test) {
    let router = new Router();
    let resource = new PostResource();

    router.addResource('/', resource);

    test.deepEqual(router._locateResource(new URL('http://api.dashron.com')), {
        resource: resource,
        urlParams: {}
    });

    test.deepEqual(router._locateResource(new URL('http://api.dashron.com/')), {
        resource: resource,
        urlParams: {}
    });
    test.done();
};

exports['Test hostname only doesnt match a sub resource'] = function (test) {
    let router = new Router();
    let resource = new PostResource();

    router.addResource('/', resource);

    test.deepEqual(router._locateResource(new URL('http://api.dashron.com/test')), false);
    test.done();
};

exports['Test sub_route with variable is properly expanded'] = function (test) {
    let router = new Router();
    let resource = new PostResource();

    router.addResource('/posts/{post_id}', resource);

    test.deepEqual(router._locateResource(new URL('http://api.dashron.com/posts/12345')), {
        resource: resource,
        urlParams: {
            post_id: 12345
        }
    });
    test.done();
};