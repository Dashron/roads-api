"use strict";

const Authorization = require('auth-header');

const auth = {
    basic: (token) => {
        try {
            let [un, pw] = Buffer(token, 'base64').toString().split(':', 2);
        } catch (e) {
            return false;
        }
        
        return {
            username: un,
            password: pw
        };
    },
    bearer: (token) => {
        return token;
    },
    mac: (token) => {
        throw new Error('Unsupported');
    }
};

/**
 * 
 * @param {*} scheme 
 * @param {*} token 
 * @param {*} params 
 */
function authValidator (scheme, token, params) {
    if (auth[scheme]) {
        return auth[scheme](token, params);
    }

    return false;
}

/**
 * Parses the authorization header and passes the details to an auth resolver to translate that into 
 * @param {*} authHeader The exact auth header provided by the incoming HTTP request
 * @param {*} auth Should have one resolver function per valid scheme which accepts a single parameter and translates that authentication information usable by your resource 
 * @return {mixed} 
 *     - False if no header and auth is required. 
 *     - Null if no header and auth is optional. 
 *     - False if the scheme is not understood or the token is syntacticly invalid.
 *     - App-defined result if valid and has an appropriate resolver
 */
function authLocator (authHeader, auth) {
    if (!authHeader) {
        return auth.required ? false : null;
    }

    let {scheme, token, params} = Authorization.parse(authHeader);

    if (auth.resolvers[scheme]) {
        let authDetails = authValidator(scheme, token, params);

        if (authDetails) {
            return auth.resolvers[scheme](authDetails);
        }
    }

    return false;
}


module.exports = authLocator;