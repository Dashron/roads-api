/**
 * index.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */

export { default as Resource } from './Resource/resource';
export { default as Router } from './core/router';
export { default as JSONRepresentation } from './Representation/jsonRepresentation';

import * as HTTPErrors from './core/httpErrors';
export { HTTPErrors };

import * as CONSTANTS from './core/constants';
export { CONSTANTS };