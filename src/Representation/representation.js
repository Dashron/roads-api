"use strict";
/**
 * representation.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * 
 */

module.exports = class Representation {
    constructor () {
    }

    append (requestBody, models) {

    }

    submit (requestBody, models) {

    }

    edit (requestBody, models) {

    }

    delete (requestBody, models) {

    }

    replace (requestBody, models) {

    }

    parseInput (requestBody, options) {
        return requestBody;
    }

    render (models, auth) {
        return new Representation (models.toString());
    }
};