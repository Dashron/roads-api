"use strict";

const Authorization = require('auth-header');

const {
    AUTH_BASIC,
    AUTH_BEARER,
    AUTH_MAC
} = require('../constants.js');

const {
    UnauthorizedError
} = require('../httpErrors.js');

const schemeParser = {
    [AUTH_BASIC]: (token) => {
        let username = null;
        let password = null;

        try {
            [username, password] = Buffer(token, 'base64').toString().split(':', 2);
        } catch (e) {
            throw new UnauthorizedError('Invalid basic authorization syntax', AUTH_BASIC);
        }
        
        return {
            username: username,
            password: password
        };
    },
    [AUTH_BEARER]: (token) => {
        return token;
    }/*,
    [AUTH_MAC]: (token) => {
        todo
    }*/
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

    throw new UnauthorizedError('Unsupported authorization scheme: ' + scheme, validSchemes[0]);
}


module.exports = authParser;