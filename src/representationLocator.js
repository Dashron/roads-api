"use strict";

const Accept = require('accept');

/**
 * 
 * @param {*} headers 
 */
function representationLocator(acceptHeader, representations, defaultMediaType) {
    let contentTypes = Accept.charset(acceptHeader, Object.keys(representations));
    
    if (contentTypes) {
        return representations[contentTypes[0]];
    }

    return representations[defaultMediaType];
}

module.exports = representationLocator;