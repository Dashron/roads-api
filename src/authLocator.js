"use strict";

const Authorization = require('auth-header');

const auth = {
    basic: (token) => {
        let [un, pw] = Buffer(token, 'base64').toString().split(':', 2);
        
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
 * 
 * @param {*} authLocators 
 * @param {*} headers 
 */
function authLocator (authLocators, headers) {
    let {scheme, token, params} = Authorization.parse(headers.authorization);

    if (authLocators[scheme]) {
        let validation = authValidator(scheme, token, params);

        if (validation) {
            return authLocators[scheme](validation);
        } else {
            return false;
        }
    }

    return null;
}


module.exports = authLocator;