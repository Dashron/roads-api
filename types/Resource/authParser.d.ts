/**
 * authParser.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 *
 */
/**
 *
 * @param {*} authHeader
 */
export default function authParser(authHeader: string, validSchemes: Array<string>): {
    scheme: any;
    parameters: any;
};
