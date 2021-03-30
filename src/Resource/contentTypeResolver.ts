/**
 * contentTypeRespolver.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */

import contentType, { ParsedMediaType } from 'content-type';

import {
	MEDIA_JSON_MERGE,
	MEDIA_JSON
} from '../core/constants';

import {
	UnsupportedMediaTypeError
} from '../core/httpErrors';

//const jsonParse = (body) => JSON.parse(body);
const parsers: {[contentType: string]: (reqBody: string) => unknown} = {
	[MEDIA_JSON_MERGE]: JSON.parse,
	[MEDIA_JSON]: JSON.parse,
};

/**
 *
 * @param {*} contentTypeHeader
 */
export function parseHeader (contentTypeHeader: string): ParsedMediaType {
	return contentType.parse(contentTypeHeader);
}

/**
 *
 * @param {*} contentType
 * @param {*} requestBody
 * todo: should this be a generic where you can pass the expected body format?
 */
export function parseBody (requestBody: string, parsedContentType: ParsedMediaType): unknown {
	const contentType = parsedContentType.type;

	if (isAllowed(contentType)) {
		return parsers[contentType](requestBody);
	}

	throw new UnsupportedMediaTypeError(contentType);
}

/**
 * Ensures that the content type of the request body is allowed by the server.
 *
 * TODO from spec: application/octet-stream can be assumed if no type is provided, or we can try to
 * 		infer from the content (which should be configurable). https://tools.ietf.org/html/rfc7231#section-3.1.1.5
 * @param {*} contentType
 */
export function isAllowed (contentType: string): boolean {
	if (parsers[contentType]) {
		return true;
	}

	return false;
}