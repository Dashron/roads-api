"use strict";

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