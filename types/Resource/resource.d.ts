/**
 * resource.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 *
 */
/// <reference types="node" />
import { Response } from 'roads';
import { URLSearchParams, URL } from 'url';
import { WritableRepresentation, ReadableRepresentationConstructor, WritableRepresentationConstructor } from '../Representation/representation';
declare type RequestMediaTypeList = {
    [type: string]: WritableRepresentationConstructor;
};
declare type ResponseMediaTypeList = {
    [type: string]: ReadableRepresentationConstructor;
};
declare type AuthSchemeList = {
    [scheme: string]: Function;
};
export declare type ActionConfig = {
    method?: string;
    status?: number;
    requestMediaTypes?: RequestMediaTypeList;
    allowRequestBody?: boolean;
    defaultResponseMediaType?: string;
    responseMediaTypes?: ResponseMediaTypeList;
    defaultRequestMediaType?: string;
    authRequired?: boolean;
    authSchemes?: AuthSchemeList;
};
export declare type ActionList = {
    [action: string]: Action;
};
export declare type Action = (models: object, requestBody: any, requestMediaHandler: WritableRepresentation | undefined, requestAuth?: any) => Promise<void> | void;
export declare type ParsedURLParams = {
    [x: string]: string | number;
};
export default abstract class Resource {
    protected actionConfigs: {
        [action: string]: ActionConfig;
    };
    protected configDefaults: ActionConfig;
    protected searchSchema: {
        [x: string]: any;
    };
    protected requiredSearchProperties?: Array<string>;
    protected abstract modelsResolver(urlParams: ParsedURLParams | undefined, searchParams: URLSearchParams | undefined, action: keyof ActionList, pathname: string): object;
    protected actions: ActionList;
    /**
     * Creates an instance of Resource.
     *
     * @todo it would be cool if we could expose "expected url parameters" in a way that slots well with the router and raises warnings
     * @param {object} configDefaults
     * @param {array<string>} supportedActions
     */
    constructor(configDefaults: ActionConfig, supportedActions: keyof ActionList | Array<keyof ActionList>);
    /**
     *
     * @param name
     * @param action
     * @param config
     */
    addAction(name: keyof ActionList, action: Action, config?: ActionConfig): void;
    /**
     * Sets the schema of the query parameters this resource accepts
     *
     * @param {object} schema
     * @param {array} requiredProperties
     * @todo: json schema type
     */
    setSearchSchema(schema: {
        [x: string]: any;
    }, requiredProperties?: Array<string>): void;
    /**
     * Performs your API action for a specific HTTP request on this resource
     *
     * @param {string} method HTTP Method
     * @param {URL} urlObject This should be the standard URL object. Search params are located here.
     * @param {object} urlParams This should be an object containing all parameter parts of the url.
     * @param {string} requestBody This should be a string representation of the request body.
     * @param {object} requestHeaders This should be an object containing all request headers.
     */
    resolve(method: string, urlObject: URL, urlParams?: ParsedURLParams, requestBody?: string, requestHeaders?: {
        [x: string]: string;
    }): Promise<Response>;
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
    protected getActionConfig(action: keyof ActionList, field: keyof ActionConfig): string | number | boolean | RequestMediaTypeList | ResponseMediaTypeList | AuthSchemeList | undefined;
    /**
     * This will parse the authorization header and send the resulting data
     * into the configured authResolvers.
     *
     * A clients authResolver should return null if the user is unauthenticated  (TODO: What error?)
     * A clients authResolver should throw an error if the credentials are not valid
     *
     * This method will throw an error if the resource is configured to require authentication (via authRequired), and the user is unauthenticated
     *
     * @param {string} authorizationHeader
     * @param {boolean} authRequired
     * @param {array<string>} validSchemes
     * @returns
     */
    protected getAuth(authorizationHeader: string, authRequired: boolean, authSchemes: {
        [x: string]: Function;
    }): Promise<any>;
    /**
     * Returns the proper representation requested by the client via the accept header
     *
     * @param {*} acceptHeader
     * @param {*} representations
     * @param {*} defaultMediaType
     */
    protected getResponseMediaHandler(acceptedContentType: string, representations: ResponseMediaTypeList): ReadableRepresentationConstructor;
    /**
     * Returns the proper representation provided by the client, as defined by it's contentType
     *
     * @param {*} contentType
     * @param {*} defaultContentType
     * @param {*} representations
     */
    protected getRequestMediaHandler(contentTypeHeader: string | undefined, defaultContentType: string, representations: RequestMediaTypeList): WritableRepresentationConstructor;
    /**
     * Ensures that the search parameters in the request uri match this resources searchSchema
     * @param {*} searchParams
     */
    protected validateSearchParams(searchParams: URLSearchParams): Promise<any>;
    /**
     * Turns an error into a proper Response object.
     * HTTPErrors use their toResponse method.
     * Everything else becomes a 500 error.
     *
     * @param {*} e
     */
    protected buildErrorResponse(e: Error): Response;
}
export {};
