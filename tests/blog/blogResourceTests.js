"use strict";

let PostResource = require('./content/postResource.js');
let postResource = new PostResource();
let {URL} = require('url');

function buildUrlObject (url, urlParams) {
    return {
        urlParams: urlParams,
        parsedUrl: new URL(url, "http://localhost")
    };
}

function testDetails (method, url, body, headers, expectedResponse) {
    return {
        method: method,
        url: url,
        body: JSON.stringify(body),
        headers: headers,
        expectedResponse: expectedResponse
    };
}

// todo: use the router
/*router.addURITemplate('/posts/{post_id}', {
    schema: {
        parameters: {
            post_id: {
                type: 'number'
            },
            required: ['post_id'],
        }
    }
});*/

let runTests = function (tests) {
    let testPromises = [];

    tests.forEach((test, index) => {
        console.log('test ' + index + ' starting\n');
        testPromises.push(postResource.resolve(test.method, test.url, test.body, test.headers)
        .then((response) => {
            console.log('test ' + index + ' complete\n', 
                'expected response', 
                test.expectedResponse, 
                '\nactual', 
                response,
                '\n'
            );
        }));
    });

    return Promise.all(testPromises);
};

let post12345 = buildUrlObject('/posts/12345', {
    post_id: 12345
});

runTests([
    // GET resource
    testDetails('GET', post12345, undefined, {
        Authorization: 'Bearer abcde'
    }, {
        status: 200,
        body: { id: 12345, title: 'hello', post: "the body" },
        headers: {} 
    }),
    // todo: find a replace action

    // Edit resource
    testDetails('PATCH', post12345, {
        title: "new edited title"
    }, {
        "Content-Type": "application/merge-patch+json",
        Authorization: 'Bearer abcde'
    }, {
        status: 200,
        body: { id: 12345, title: 'new edited title', post: "the body" },
        headers: {} 
    }),

    // Invalid edit. Note, this is not currently working because the json schema we use
    // will not error on, or exclude unexpected fields
    testDetails('PATCH', post12345, {
        title: "New Name", 
        id: 5, 
        post:"New post contents"
    }, {
        "Content-Type": "application/merge-patch+json",
        Authorization: 'Bearer abcde'
    }, {
        status: 400,
        body: { },
        headers: {} 
    }),

    // Delete resource
    testDetails('POST', post12345, {
        title: "New Name", 
        post:"Even post contents"
    }, {
        "Content-Type": "application/json"
    })
]);