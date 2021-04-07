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
interface RequestMediaTypeList<ModelsType, ReqBodyType, AuthType> {
    [type: string]: WritableRepresentation<ModelsType, ReqBodyType, AuthType>;
}
interface ResponseMediaTypeList<ModelsType, AuthType> {
    [type: string]: ReadableRepresentation<ModelsType, AuthType>;
}
interface AuthScheme<AuthType> {
    (parameters: unknown): AuthType;
}
interface AuthSchemeList<AuthType> {
    [scheme: string]: AuthScheme<AuthType>;
}
export interface ActionConfig {
    method?: string;
    status?: number;
    requestMediaTypes?: RequestMediaTypeList<unknown, unknown, unknown>;
    allowRequestBody?: boolean;
    defaultResponseMediaType?: string;
    responseMediaTypes?: ResponseMediaTypeList<unknown, unknown>;
    defaultRequestMediaType?: string;
    authRequired?: boolean;
    authSchemes?: AuthSchemeList<unknown>;
}
export interface ActionList {
    [action: string]: Action<unknown, unknown, unknown>;
}
export interface Action<ModelsType, ReqBodyType, AuthType> {
    (models: ModelsType, requestBody: ReqBodyType, requestMediaHandler: WritableRepresentation<ModelsType, ReqBodyType, AuthType> | undefined, requestAuth?: AuthType): Promise<unknown> | void;
}
export interface ParsedURLParams {
    [x: string]: string | number;
}
export default abstract class Resource<ModelsType, ReqBodyType, AuthType> {
    protected actionConfigs: {
        [action: string]: ActionConfig;
    };
    protected searchSchema: SchemaProperties;
    protected requiredSearchProperties?: Array<string>;
    protected abstract modelsResolver(urlParams: ParsedURLParams | undefined, searchParams: URLSearchParams | undefined, action: keyof ActionList, pathname: string, requestAuth: AuthType | null): ModelsType;
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
    addAction(name: keyof ActionList, action: Action<unknown, unknown, unknown>, config?: ActionConfig): void;
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
     * @todo I hate this. Ideally we could have the config value checking happen in the IDE thanks to typescript
     * @param {string} action
     * @param {string} field
     */
    protected getActionConfig(action: keyof ActionList, field: keyof ActionConfig): unknown;
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
    protected getAuth(authorizationHeader: string | Array<string> | undefined, authRequired: boolean, authSchemes: AuthSchemeList<AuthType>): Promise<AuthType | null>;
    /**
     * Returns the proper representation requested by the client via the accept header
     *
     * @param {*} acceptHeader
     * @param {*} representations
     * @param {*} defaultMediaType
     */
    protected getResponseMediaHandler(acceptedContentType: string | Array<string> | undefined, representations: ResponseMediaTypeList<ModelsType, AuthType>): ReadableRepresentation<ModelsType, AuthType>;
    /**
     * Returns the proper representation provided by the client, as defined by it's contentType
     *
     * @param {*} contentType
     * @param {*} defaultContentType
     * @param {*} representations
     */
    protected getRequestMediaHandler(contentTypeHeader: string | undefined, defaultContentType: string, representations: RequestMediaTypeList<ModelsType, ReqBodyType, AuthType>): WritableRepresentation<ModelsType, ReqBodyType, AuthType>;
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
