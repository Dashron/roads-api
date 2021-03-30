/**
 * router.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */
/// <reference types="node" />
import { URL } from 'url';
import uriTemplate = require('uri-templates');
import Resource from '../Resource/resource';
import { Middleware } from 'roads/types/core/road';
import { JSONSchemaType } from 'ajv';
interface RouteConfig {
    urlParams: {
        schema: JSONSchemaType<unknown>;
        required?: Array<string>;
    };
}
interface Route {
    compiledTemplate: uriTemplate.URITemplate;
    config?: RouteConfig;
    resource: Resource;
}
export default class Router {
    protected routes: Array<Route>;
    constructor();
    /**
     * Assign a resource to a URI template for the middleware, or locateResource method to locate in the future
     *
     * @param {string} template URI template
     * @param {Resource} resource Resource object
     * @param {object} config Additional configuration for this route. Currently supports a urlParams object
     * 		with "schema" and "required" properties. These properties are used alongside the standard
     * 		objectValidator to validate any URI params.
     */
    addResource(template: string, resource: Resource, config?: RouteConfig): void;
    /**
     * Attempts to locate a resource for the provided url.
     * @param {string} url - a URL object
     * @throws {TypeError} if the URI is not a valid URL
     * @throws {InputValidationError} if we located a matching route, but the urls uri params did not match the url schema
     * @return An object with two properties. Resource, which is the relevant Resource object for this route.
     * 		urlParams which is an object containing all the url params and values in url.
     */
    locateResource(url: URL): Promise<false | {
        resource: Resource;
        urlParams: {
            [key: string]: string;
        };
    }>;
    middleware(protocol: string, hostname: string): Middleware;
}
export {};
