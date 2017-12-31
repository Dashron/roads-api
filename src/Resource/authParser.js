"use strict";

const Authorization = require('auth-header');
const {
    UnauthorizedError
} = require('../httpErrors.js');

const schemeParser = {
    basic: (token) => {
        let username = null;
        let password = null;

        try {
            [username, password] = Buffer(token, 'base64').toString().split(':', 2);
        } catch (e) {
            throw new UnauthorizedError('basic');
        }
        
        return {
            username: username,
            password: password
        };
    },
    bearer: (token) => {
        return token;
    },
    mac: (token) => {
        throw new UnauthorizedError('mac');
    }
};

/**
 * 
 * @param {*} authHeader 
 */
function authParser (authHeader, validSchemes) {
    let {scheme, token, params} = Authorization.parse(authHeader);

    if (schemeParser[scheme] && (validSchemes.indexOf(scheme) !== -1)) {
        return {
            scheme: scheme,
            parameters: schemeParser[scheme](token, params)
        };
    }

    throw new UnauthorizedError(validSchemes[0]);
}


module.exports = authParser;