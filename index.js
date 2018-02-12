"use strict";
/**
 * index.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * 
 */

module.exports.Resource = require('./src/Resource/resource.js');
module.exports.Response = require('./src/response.js');
module.exports.Router = require('./src/router');
module.exports.Representation = require('./src/Representation/representation.js');
module.exports.JSONRepresentation = require('./src/Representation/jsonRepresentation.js');
module.exports.HTTPErrors = require('./src/httpErrors.js');

module.exports.CONSTANTS = require('./src/constants.js');