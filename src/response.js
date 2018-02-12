"use strict";
/**
 * response.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * 
 */

// TODO: Have this match the fetch api for web clients
module.exports = class Response {
    constructor (status, body = '', headers = {}) {
        this.status = status;
        this.body = body;
        this.headers = headers;
    }

    setHeader(header, value) {
        this.headers[header] = value;
    }
};