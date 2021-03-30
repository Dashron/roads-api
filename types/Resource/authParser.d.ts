/**
 * authParser.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */
/**
 *
 * @param {*} authHeader
 */
export default function authParser(authHeader: string | Array<string> | undefined, validSchemes: Array<string>): {
    scheme: string;
    parameters: unknown;
};
