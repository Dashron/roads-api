/**
 * contentTypeRespolver.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */
import { ParsedMediaType } from 'content-type';
/**
 *
 * @param {*} contentTypeHeader
 */
export declare function parseHeader(contentTypeHeader: string): ParsedMediaType;
/**
 *
 * @param {*} contentType
 * @param {*} requestBody
 * todo: should this be a generic where you can pass the expected body format?
 */
export declare function parseBody(requestBody: string, parsedContentType: ParsedMediaType): unknown;
/**
 * Ensures that the content type of the request body is allowed by the server.
 *
 * TODO from spec: application/octet-stream can be assumed if no type is provided, or we can try to
 * 		infer from the content (which should be configurable). https://tools.ietf.org/html/rfc7231#section-3.1.1.5
 * @param {*} contentType
 */
export declare function isAllowed(contentType: string): boolean;
