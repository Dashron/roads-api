"use strict";

let mergePatch = require('json-merge-patch');

const {
    MEDIA_JSON_MERGE,
} = require('../constants.js');

const {
    UnsupportedMediaTypeError
} = require('../errors.js');


const patchFunctions = {
    [MEDIA_JSON_MERGE]: (patch, target) => {
        return mergePatch.apply(target, patch);
    }
    //content type: function name
};


module.exports = function (patch, target, contentType) {
    if (patchFunctions[contentType]) {
        return patchFunctions[contentType](patch, target);
    }
    
    throw new UnsupportedMediaTypeError();
};

