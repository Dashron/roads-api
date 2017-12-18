"use strict";

const Accept = require('accept');

/**
 * Identifies and returns the representation the client finds most acceptable. Returns false if no representations are available
 * 
 * @param {*} acceptHeader 
 * @param {*} representations 
 * @param {*} defaultMediaType 
 * @return {mixed} 
 *     - false if content negotiation fails
 *     - The desired representation if content negotiation succeeds.
 */
function representationLocator(acceptHeader, representations, defaultMediaType) {
    if (acceptHeader) {
        let contentTypes = Accept.charset(acceptHeader, Object.keys(representations));
        
        if (contentTypes) {
            return representations[contentTypes[0]];
        }
    }

    if (defaultMediaType) {
        return representations[defaultMediaType];
    }

    return false;
}

module.exports = representationLocator;