"use strict";

let HTTPError = require('../../src/httpErrors.js');
let Response = ('../../src/response.js');

module['test http error response generation'] = function (test) {
    let error = new HTTPError('Hello!');
    let response = error.toResponse();
    test.ok(response instanceof Response);
    test.equal(response.status, 500);
    test.equal(response.body, JSON.stringify({
        title: "Hello!",
        status: 500,
        "additional-problems": []
    }));

}


module['test additional problems generation'] = function (test) {
    let error = new HTTPError('Hello!');
    error.addAdditionalproblem(new HTTPError('Another problem!'));
    error.addAdditionalproblem(new HTTPError('Yet another problem!'));

    let response = error.toResponse();
    test.ok(response instanceof Response);
    test.equal(response.status, 500);
    test.equal(response.body, JSON.stringify({
        title: "Hello!",
        status: 500,
        "additional-problems": [{
            title: "Another problem!",
            status: 500
        }, {
            title: "Yet another problem!",
            status: 500
        }]
    }));
}