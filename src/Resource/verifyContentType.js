"use strict";



/**
 * Ensures that the content type of the request body is allowed by the server
 * @param {*} contentTypeHeader 
 * @param {*} validMediaTypes 
 */
function verifyContentType (contentTypeHeader, validMediaTypes) {
    let parsedContentType = contentType.parse(contentTypeHeader);

    if (validMediaTypes.indexOf(parsedContentType.type) !== -1) {
        return true;
    }

    return false;
}

module.exports = verifyContentType;