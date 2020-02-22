/**
 * resource.ts
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 */

// Things this should support
// 1. if-modified-since
// 2. etag
// 3. translate data to one of many media types
// 4. accept input via one of many media types
// 5. patch media types (configurable)

import authParser from './authParser';
import { parse as parseContentType } from 'content-type';
import * as Accept from '@hapi/accept';
import validateObj from '../core/objectValidator';
import { Response } from 'roads';

import { 
    URLSearchParams,
    URL
} from 'url';

import {
    METHOD_GET,
    METHOD_PUT,
    METHOD_POST,
    METHOD_PATCH,
    METHOD_DELETE,
    HEADER_CONTENT_TYPE,
    HEADER_AUTHORIZATION,
    HEADER_ACCEPT
} from '../core/constants';

import {
    UnauthorizedError,
    NotAcceptableError,
    HTTPError,
    InputValidationError,
    UnsupportedMediaTypeError,
    MethodNotAllowedError
} from '../core/httpErrors';

import { WritableRepresentation, ReadableRepresentationConstructor, WritableRepresentationConstructor } from '../Representation/representation';

const globalDefaults: { [action: string]: ActionConfig } = {
    get: {
        method: METHOD_GET,
        status: 200,
        requestMediaTypes: {},
        allowRequestBody: false
    },
    append: {
        method: METHOD_POST,
        status: 201,
        requestMediaTypes: {},
        allowRequestBody: true
    },
    submit: {
        method: METHOD_POST,
        status: 201,
        requestMediaTypes: {},
        allowRequestBody: true
    },
    fullReplace: {
        method: METHOD_PUT,
        status: 200,
        requestMediaTypes: {},
        allowRequestBody: true
    },
    partialEdit: {
        method: METHOD_PATCH,
        status: 200,
        requestMediaTypes: {},
        allowRequestBody: true
    },
    "delete": {
        method: METHOD_DELETE,
        status: 204,
        requestMediaTypes: {},
        allowRequestBody: true
    }
};

type RequestMediaTypeList = { [type: string]: WritableRepresentationConstructor }
type ResponseMediaTypeList = { [type: string]: ReadableRepresentationConstructor }
type AuthSchemeList = { [scheme: string]: Function };

export type ActionConfig = {
    method?: string,
    status?: number,
    requestMediaTypes?: RequestMediaTypeList,
    allowRequestBody?: boolean,
    defaultResponseMediaType?: string,
    responseMediaTypes?: ResponseMediaTypeList,
    defaultRequestMediaType?: string,
    authRequired?: boolean,
    authSchemes?: AuthSchemeList
}

export type ActionList = { 
    [action: string]: Action;
}

export type Action = (models: object, requestBody: any, requestMediaHandler: WritableRepresentation | undefined, requestAuth?: any) => Promise<void> | void;

export type ParsedURLParams = {[x: string]: string | number};

export interface ResourceConstructor {
    new(configDefaults: ActionConfig, supportedActions: keyof ActionList | Array<keyof ActionList>): Resource;
}

export default abstract class Resource {
    protected actionConfigs: {[action: string]: ActionConfig}
    protected configDefaults: ActionConfig;
    protected searchSchema: {[x: string]: any} = {};
    protected requiredSearchProperties?: Array<string>;
    protected abstract modelsResolver(urlParams: ParsedURLParams | undefined, searchParams: URLSearchParams | undefined, action: keyof ActionList, pathname: string): object;
    protected actions: ActionList = {};

    /**
     * Creates an instance of Resource.
     * 
     * @todo it would be cool if we could expose "expected url parameters" in a way that slots well with the router and raises warnings
     * @param {object} configDefaults 
     * @param {array<string>} supportedActions 
     */
    constructor (configDefaults: ActionConfig, supportedActions: keyof ActionList | Array<keyof ActionList>) {

        if (!Array.isArray(supportedActions)) {
            supportedActions = [supportedActions];
        }

        this.actionConfigs = {};

        supportedActions.forEach((action) => {
            // Technically I could assign configDefaults here, but it would
            // get a little weird with the other setActions, so I keep this simple
            this.actionConfigs[action] = {};
        });

        // TODO: If you add both the submit and append actions, you have two POST actions. We should error in that case
        this.configDefaults = configDefaults;
    }

    /**
     * 
     * @param name 
     * @param action 
     * @param config 
     */
    addAction (name: keyof ActionList, action: Action, config: ActionConfig = {}) {
        this.actionConfigs[name] = config;
        this.actions[name] = action;
    }

    /**
     * Sets the schema of the query parameters this resource accepts
     * 
     * @param {object} schema 
     * @param {array} requiredProperties 
     * @todo: json schema type
     */
    setSearchSchema (schema: {[x: string]: any}, requiredProperties?: Array<string>) {
        this.searchSchema = schema;
        this.requiredSearchProperties = requiredProperties;
    }

    /**
     * Performs your API action for a specific HTTP request on this resource
     * 
     * @param {string} method HTTP Method
     * @param {URL} urlObject This should be the standard URL object. Search params are located here.
     * @param {object} urlParams This should be an object containing all parameter parts of the url.
     * @param {string} requestBody This should be a string representation of the request body.
     * @param {object} requestHeaders This should be an object containing all request headers.
     */
    async resolve (method: string, urlObject: URL, urlParams?: ParsedURLParams, requestBody?: string, requestHeaders: {[x: string]: string} = {}) {
        try {
            let action = this.getActionForMethod(method);

            if (!action || typeof(this.actions[action]) !== "function") {
                throw new MethodNotAllowedError(this.getValidMethods());
            }

            /*
             * Identify authentication information so we can provide it to all further actions
             * If the authentication credentials are valid, the API developer should assume that 
             * they can do whatever they want with the result of getModels, and assume that
             * the action and representation will receive those models untouched.
             * 
             * If the credentials are not provided, the client should return "null"
             * If the credentials are invalid, the client should throw an error (TODO: What error?)
             */
            let requestAuth = await this.getAuth(requestHeaders[HEADER_AUTHORIZATION.toLowerCase()], 
                this.getActionConfig(action, 'authRequired') as boolean, 
                this.getActionConfig(action, 'authSchemes') as AuthSchemeList);
            
            let parsedRequestBody: any;
            let RequestMediaHandler: WritableRepresentationConstructor | undefined = undefined;

            if (requestBody && this.getActionConfig(action, 'allowRequestBody')) {
                /*
                * Identify the proper request representation from the accept header
                */
                RequestMediaHandler = this.getRequestMediaHandler(requestHeaders[HEADER_CONTENT_TYPE], 
                    this.getActionConfig(action, 'defaultRequestMediaType') as string, 
                    this.getActionConfig(action, 'requestMediaTypes') as RequestMediaTypeList);

                parsedRequestBody = await (new RequestMediaHandler(action)).parseInput(requestBody);
            } else {
                /*
                * Here's a safe short cut if we want the request to still work even though we
                * can't locate a proper requestRepresentation. In the current code this might
                * never happen, but I put it here so I don't forget if we want it in the future
                */
                parsedRequestBody = undefined;
            }

            /*
             * Initates the validation of the query parameters, and if valid sends those parameters to this resources "modelsResolver" function.
             */
            await this.validateSearchParams(urlObject.searchParams);
``
            /*
             * Locte a collection of models for this request. These models are provided to the action, and are not manipulated in any way by this framework.
             * The API developer should assume that they can do whatever they want with provided models
             */
            let models = await this.modelsResolver(urlParams, urlObject.searchParams, action, urlObject.pathname);

            /*
             * Find the appropriate resource representation for this resource, and the client's request
             */
            let acceptedContentType = Accept.charset(requestHeaders[HEADER_ACCEPT] || 
                this.getActionConfig(action, 'defaultResponseMediaType') as string, Object.keys(this.getActionConfig(action, 'responseMediaTypes') as ResponseMediaTypeList));

            let ResponseMediaHandler = this.getResponseMediaHandler(acceptedContentType, this.getActionConfig(action, 'responseMediaTypes') as ResponseMediaTypeList);
            let responseMediaHandler = new ResponseMediaHandler(action);

            /**
             * Perform the HTTP action and get the response
             */
            await this.actions[action](models, parsedRequestBody, RequestMediaHandler ? new RequestMediaHandler(action): undefined, requestAuth);
            // todo: find a less janky way to handle this method===delete response handler
            return new Response(method === METHOD_DELETE ? '': responseMediaHandler.render(models, requestAuth, true), this.getActionConfig(action, 'status') as number, {
                "content-type": acceptedContentType
            });
        } catch (e) {
            return this.buildErrorResponse(e);
        }
    }

    /**
     * Find the appropriate resource action for this HTTP method
     * 
     * @param {string} method 
     */
    getActionForMethod(method: string): string | undefined {        
        for (let action in this.actionConfigs) {
            if (this.getActionConfig(action, 'method') === method) {
                return action;
            }
        }
    }

    /**
     * Find all methods that have been enabled for this resource
     */
    getValidMethods(): Array<string> {
        let validMethods: Array<string> = [];

        for (let action in this.actionConfigs) {
            if (this.actions[action]) {
                validMethods.push(this.getActionConfig(action, 'method') as string);
            }
        };

        return validMethods;
    }

    /**
     * Find a configuration setting for an action.
     * If there is not one explicitly set, it checks the cross-action config defaults configured via the resource constructor
     * If there is not one in the cross-action config defaults it checks global defaults
     * 
     * @param {string} action 
     * @param {string} field
     */
    protected getActionConfig (action: keyof ActionList, field: keyof ActionConfig) {
        if (typeof(this.actionConfigs[action][field]) !== "undefined") {
            return this.actionConfigs[action][field];
        }

        // client configurable global defaults across all azaction
        if (typeof(this.configDefaults[field]) !== "undefined") {
            return this.configDefaults[field];
        }

        // roads defaults for global defaults on a per-action basis
        if (typeof(globalDefaults[action][field]) !== "undefined") {
            return globalDefaults[action][field];
        }

        throw new Error(this.constructor.name + 
            ' has attempted to access a missing config value for the action ' + 
            action + ' and the field ' + field + 
            '. There is no default for this config, so you must provide it manually in the resource constructor, or when invoking addAction.');
    }

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
    protected async getAuth(authorizationHeader: string, authRequired: boolean, authSchemes: {[x: string]: Function}) {
        let auth = null;

        // If this resource requires authentication, we enforce that behavior here
        if (!authorizationHeader) {
            if (!authRequired) {
                return null;
            }

            throw new UnauthorizedError('Authorization required', Object.keys(authSchemes)[0]);
        }

        // parse the auth header and validate the format (e.g. parse basic auth into username & password)
        let {
            scheme,
            parameters
        } = authParser(authorizationHeader, Object.keys(authSchemes));

        auth = await authSchemes[scheme](parameters);
        
        // If we have auth details, return it
        if (auth !== null && auth != undefined) {
            return auth;
        }

        // If we have no auth, and it's not required, return null
        if (!authRequired) {
            return null;
        }

        // if we have no auth and it's required, we fall through to the UnauthorizedError
        throw new UnauthorizedError('Unsupported authorization scheme', Object.keys(authSchemes)[0]);
    }

    /**
     * Returns the proper representation requested by the client via the accept header
     * 
     * @param {*} acceptHeader 
     * @param {*} representations 
     * @param {*} defaultMediaType 
     */
    protected getResponseMediaHandler(acceptedContentType: string, representations: ResponseMediaTypeList ) {
        if (acceptedContentType && representations[acceptedContentType]) {
            return representations[acceptedContentType];
        }
        
        throw new NotAcceptableError('No acceptable media types for this resource.');
    }

    /**
     * Returns the proper representation provided by the client, as defined by it's contentType
     * 
     * @param {*} contentType 
     * @param {*} defaultContentType 
     * @param {*} representations 
     */
    protected getRequestMediaHandler(contentTypeHeader: string | undefined, defaultContentType: string, representations: RequestMediaTypeList ) {        
        let parsedContentType = parseContentType(contentTypeHeader || defaultContentType);

        if (parsedContentType.type && representations[parsedContentType.type]) {
            return representations[parsedContentType.type];
        }

        throw new UnsupportedMediaTypeError('This media type is not supported on this endpoint.');
    }

    /**
     * Ensures that the search parameters in the request uri match this resources searchSchema
     * @param {*} searchParams 
     */
    protected async validateSearchParams(searchParams: URLSearchParams): Promise<any> {

        let params: {[x: string]: any} = {};
    
        for (let key of searchParams.keys()) {
            if (params[key]) {
                // keys returns dupes if the key is there twice, but getAll will return the data we need below so we don't want keys duplicated
                continue;
            }
    
            params[key] = searchParams.getAll(key);
            if (params[key].length === 1) {
                params[key] = params[key][0];
            }
        }

        try {
            return await validateObj(params, this.searchSchema, this.requiredSearchProperties ? this.requiredSearchProperties : []);
        } catch (e) {
            if (e !instanceof InputValidationError) {
                throw new InputValidationError('Invalid Search Query', [e.message]);
            }

            throw e;
        }
    }

    /**
     * Turns an error into a proper Response object.
     * HTTPErrors use their toResponse method.
     * Everything else becomes a 500 error.
     * 
     * @param {*} e 
     */
    protected  buildErrorResponse(e: Error) {
        if (e instanceof HTTPError) {
            return (e as HTTPError).toResponse();
        }

        console.log(e);
        return new Response('Unknown error. Please check your logs', 500);
    }
};
