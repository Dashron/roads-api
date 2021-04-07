/**
 * resource.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */
/// <reference types="node" />
import { SchemaProperties } from '../core/objectValidator';
import { Response } from 'roads';
import { URLSearchParams, URL } from 'url';
import { WritableRepresentation, ReadableRepresentation } from '../Representation/representation';
import { IncomingHeaders } from 'roads/types/core/road';
interface RequestMediaTypeList<RepresentationFormat, Models, Auth> {
    [type: string]: WritableRepresentation<RepresentationFormat, Models, Auth>;
}
interface ResponseMediaTypeList<Models, Auth> {
    [type: string]: ReadableRepresentation<Models, Auth>;
}
export interface AuthScheme<Auth> {
    (parameters: unknown): Auth;
}
interface AuthSchemeList<Auth> {
    [scheme: string]: AuthScheme<Auth>;
}
export interface ActionConfig<RepresentationFormat, Models, Auth> {
    method?: string;
    status?: number;
    requestMediaTypes?: RequestMediaTypeList<RepresentationFormat, Models, Auth>;
    allowRequestBody?: boolean;
    defaultResponseMediaType?: string;
    responseMediaTypes?: ResponseMediaTypeList<Models, Auth>;
    defaultRequestMediaType?: string;
    authRequired?: boolean;
    authSchemes?: AuthSchemeList<unknown>;
}
export interface ActionList {
    [action: string]: Action<unknown, unknown, unknown>;
}
export interface Action<RepresentationFormat, Models, Auth> {
    (models: Models, requestBody: RepresentationFormat, requestMediaHandler?: WritableRepresentation<RepresentationFormat, unknown, Auth>, requestAuth?: Auth): Promise<unknown> | void;
}
export interface ParsedURLParams {
    [x: string]: string | number;
}
export default abstract class Resource<Models, Auth> {
    protected actionConfigs: {
        [action: string]: ActionConfig<unknown, unknown, unknown>;
    };
    protected searchSchema: SchemaProperties;
    protected requiredSearchProperties?: Array<string>;
    protected abstract modelsResolver(urlParams: ParsedURLParams | undefined, searchParams: URLSearchParams | undefined, action: keyof ActionList, pathname: string, requestAuth: Auth | null): Models;
    protected actions: ActionList;
    /**
     * Creates an instance of Resource.
     *
     * @todo it would be cool if we could expose "expected url parameters" in a way that
     * 		slots well with the router and raises warnings
     * @param {object} configDefaults
     * @param {array<string>} supportedActions
     */
    constructor();
    /**
     *
     * @param name
     * @param action
     * @param config
     */
    addAction<RepresentationFormat>(name: keyof ActionList, action: Action<RepresentationFormat, Models, Auth>, config?: ActionConfig<RepresentationFormat, Models, Auth>): void;
    /**
     * Sets the schema of the query parameters this resource accepts
     *
     * @param {object} schema
     * @param {array} requiredProperties
     * @todo: json schema type
     */
    setSearchSchema(schema: SchemaProperties, requiredProperties?: Array<string>): void;
    /**
     * Performs your API action for a specific HTTP request on this resource
     *
     * @param {string} method HTTP Method
     * @param {URL} urlObject This should be the standard URL object. Search params are located here.
     * @param {object} urlParams This should be an object containing all parameter parts of the url.
     * @param {string} requestBody This should be a string representation of the request body.
     * @param {object} requestHeaders This should be an object containing all request headers.
     */
    resolve(method: string, urlObject: URL, urlParams?: ParsedURLParams, requestBody?: string, requestHeaders?: IncomingHeaders): Promise<Response>;
    /**
     * Find the appropriate resource action for this HTTP method
     *
     * @param {string} method
     */
    getActionForMethod(method: string): string | undefined;
    /**
     * Find all methods that have been enabled for this resource
     */
    getValidMethods(): Array<string>;
    /**
     * Find a configuration setting for an action.
     * If there is not one explicitly set, it checks the cross-action config defaults configured via the resource constructor
     * If there is not one in the cross-action config defaults it checks global defaults
     *
     * @param {string} action
     * @param {string} field
     */
    protected getActionConfig<K extends keyof ActionConfig<unknown, unknown, unknown>>(action: keyof ActionList, field: K): ActionConfig<unknown, unknown, unknown>[K];
    /**
     * This will parse the authorization header and send the resulting data
     * into the configured authResolvers.
     *
     * A clients authResolver should return null if the user is unauthenticated  (TODO: What error?)
     * A clients authResolver should throw an error if the credentials are not valid
     *
     * This method will throw an error if the resource is configured to require authentication (via authRequired),
     * 		and the user is unauthenticated
     *
     * @param {string} authorizationHeader
     * @param {boolean} authRequired
     * @param {array<string>} validSchemes
     * @returns
     */
    protected getAuth(authorizationHeader: string | Array<string> | undefined, authRequired?: boolean, authSchemes?: AuthSchemeList<unknown>): Promise<unknown | null>;
    /**
     * Returns the proper representation requested by the client via the accept header
     *
     * @param {*} acceptHeader
     * @param {*} representations
     * @param {*} defaultMediaType
     */
    protected getResponseMediaHandler(acceptedContentType: string | Array<string> | undefined, representations?: ResponseMediaTypeList<unknown, unknown>): ReadableRepresentation<unknown, unknown>;
    /**
     * Returns the proper representation provided by the client, as defined by it's contentType
     *
     * @param {*} contentType
     * @param {*} defaultContentType
     * @param {*} representations
     */
    protected getRequestMediaHandler(contentTypeHeader?: string, defaultContentType?: string, representations?: RequestMediaTypeList<unknown, unknown, unknown>): WritableRepresentation<unknown, unknown, unknown>;
    /**
     * Ensures that the search parameters in the request uri match this resources searchSchema
     * @param {*} searchParams
     */
    protected validateSearchParams(searchParams: URLSearchParams): Promise<boolean>;
    /**
     * Turns an error into a proper Response object.
     * HTTPErrors use their toResponse method.
     * Everything else becomes a 500 error.
     *
     * @param {*} e
     */
    protected buildErrorResponse(e: unknown): Response;
}
export {};
