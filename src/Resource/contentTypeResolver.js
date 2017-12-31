"use strict";
const contentType = require('content-type');

const {
    MEDIA_JSON_MERGE,
    MEDIA_JSON
} = require('../constants.js');

const {
    UnsupportedMediaTypeError,
    InvalidParameterError
} = require('../httpErrors.js');

const parsers = {
    [MEDIA_JSON_MERGE]: JSON.parse,
    [MEDIA_JSON]: JSON.parse
};

/**
 * 
 * @param {*} contentTypeHeader 
 */
module.exports.parseHeader = (contentTypeHeader) => {
    return contentType.parse(contentTypeHeader);
};

/**
 * 
 * @param {*} contentType 
 * @param {*} requestBody 
 */
module.exports.parseBody = (contentType, requestBody) => {
    // todo: does defaults do this for us now?
    if (typeof(requestBody) !== "string") {
        throw new InvalidParameterError('Content type resolver\'s parseBody function only supports strings for the requestBody parameter');
    }

    if (this.isAllowed(contentType)) {
        return parsers[contentType](requestBody);
    }

    throw new UnsupportedMediaTypeError();
};

/**
 * Ensures that the content type of the request body is allowed by the server.
 * 
 * TODO from spec: application/octet-stream can be assumed if no type is provided, or we can try to infer from the content (which should be configurable). https://tools.ietf.org/html/rfc7231#section-3.1.1.5
 * @param {*} contentType
 */
module.exports.isAllowed = (contentType) => {
    if (parsers[contentType]) {
        return true;
    }

    return false;
};