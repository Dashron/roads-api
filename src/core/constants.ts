/**
 * constants.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * 
 */

export const METHOD_GET = 'GET';
export const METHOD_PUT = 'PUT';
export const METHOD_POST = 'POST';
export const METHOD_PATCH = 'PATCH';
export const METHOD_DELETE = 'DELETE';

export const HEADER_CONTENT_TYPE = 'Content-Type';
export const HEADER_AUTHORIZATION = 'Authorization';
export const HEADER_ACCEPT = 'Accept';
    
export const MEDIA_JSON = 'application/json';
export const MEDIA_JSON_MERGE = 'application/merge-patch+json'; //https://tools.ietf.org/html/rfc7386

export const AUTH_BASIC = 'Basic';
export const AUTH_BEARER = 'Bearer';
export const AUTH_MAC = 'Mac';