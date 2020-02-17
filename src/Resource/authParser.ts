/**
 * authParser.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * 
 */

const Authorization = require('auth-header');

import { AUTH_BASIC, AUTH_BEARER, AUTH_MAC } from '../core/constants';
import { UnauthorizedError } from '../core/httpErrors';

interface SchemeParser { (token: string): any };

const schemeParsers: { [x: string]: SchemeParser } = {
    [AUTH_BASIC]: (token: string) => {
        let username = null;
        let password = null;

        try {
            [username, password] = Buffer.from(token, 'base64').toString().split(':', 2);
        } catch (e) {
            throw new UnauthorizedError('Invalid basic authorization syntax', AUTH_BASIC);
        }
        
        return {
            username: username,
            password: password
        };
    },
    [AUTH_BEARER]: (token: string) => {
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
export default function authParser (authHeader: string, validSchemes: Array<string>) {
    let {scheme, token, params} = Authorization.parse(authHeader);

    if (schemeParsers[scheme] && (validSchemes.indexOf(scheme) !== -1)) {
        return {
            scheme: scheme,
            parameters: schemeParsers[scheme](token)
        };
    }

    throw new UnauthorizedError('Unsupported authorization scheme: ' + scheme, validSchemes[0]);
}