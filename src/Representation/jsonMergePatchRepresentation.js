"use strict";

let Representation = require('./representation.js');
let { UnprocessableEntityError } = require('../httpErrors.js');
let jsonMergePatch = require('json-merge-patch');

module.exports = class JSONMergePatchRepresentation extends Representation {
    constructor () {
        super();
    }

    parseInput (requestBody, options) {
        //todo: how to properly validate this? Is there a schema? How can we tie in the target representation schema for business rules?
        let parsedBody = null;

        try {
            parsedBody = JSON.parse(requestBody);
        } catch (e) {
            console.log(e);
            throw new UnprocessableEntityError('Invalid request body: Could not parse JSON request');
        }

        return parsedBody;
    }

    edit (requestBody, models, requestAuth) {
        // how do we pass in merge patch? how do we make this work?
        //return jsonMergePatch.apply(oldRepresentation, diff);
    }
}