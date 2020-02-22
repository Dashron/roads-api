/**
 * contentTypeRespolver.ts
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */
import contentType, { ParsedMediaType } from 'content-type';
/**
 *
 * @param {*} contentTypeHeader
 */
export declare function parseHeader(contentTypeHeader: string): contentType.ParsedMediaType;
/**
 *
 * @param {*} contentType
 * @param {*} requestBody
 */
export declare function parseBody(requestBody: string, parsedContentType: ParsedMediaType): any;
/**
 * Ensures that the content type of the request body is allowed by the server.
 *
 * TODO from spec: application/octet-stream can be assumed if no type is provided, or we can try to infer from the content (which should be configurable). https://tools.ietf.org/html/rfc7231#section-3.1.1.5
 * @param {*} contentType
 */
export declare function isAllowed(contentType: string): boolean;
