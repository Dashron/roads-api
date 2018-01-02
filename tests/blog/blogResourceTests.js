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
        body: body,
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
        testPromises.push(postResource.resolve(test.method, test.url, test.body, test.headers)
        .then((response) => {
            console.log('test ' + index + ' complete', 
                'expected response', 
                test.expectedResponse, 
                'response', 
                response
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
    testDetails('GET', post12345, null, {
        Authorization: 'Bearer abcde'
    }, {}),
    // todo: find a replace action

    // Edit resource
    testDetails('PATCH', post12345, {
        title: "new edited title"
    }, {
        "Content-Type": "application/merge-patch+json"
    }),

    // Invalid edit
    testDetails('PATCH', post12345, JSON.stringify({
        title: "New Name", 
        id: 5, 
        post:"New post contents"
    }), {
        "Content-Type": "application/json"
    }),

    // Delete resource
    testDetails('DELETE', post12345, JSON.stringify({
        title: "New Name", 
        post:"New post contents"
    }), {
        "Content-Type": "application/json"
    })
]);