"use strict";
/**
 * resource.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * 
 */

// Things this should support
// 1. if-modified-since
// 2. etag
// 3. translate data to one of many media types
// 4. accept input via one of many media types
// 5. patch media types (configurable)

const authParser = require('./authParser.js');
const ContentType = require('content-type');
const Response = require('../response.js');
const Accept = require('accept');
const validateObj = require('../objectValidator.js');

const { 
    URLSearchParams,
    URL
} = require('url');

const {
    METHOD_GET,
    METHOD_PUT,
    METHOD_POST,
    METHOD_PATCH,
    METHOD_DELETE,
    HEADER_CONTENT_TYPE,
    HEADER_AUTHORIZATION,
    HEADER_ACCEPT
} = require('../constants.js');

const {
    UnauthorizedError,
    NotAcceptableError,
    HTTPError,
    InputValidationError,
    UnsupportedMediaTypeError,
    MethodNotAllowedError
} = require('../httpErrors.js');

const globalDefaults = {
    get: {
        method: METHOD_GET,
        status: 200,
        requestMediaTypes: {}
    },
    append: {
        method: METHOD_POST,
        status: 201,
        requestMediaTypes: {}
    },
    submit: {
        method: METHOD_POST,
        status: 201,
        requestMediaTypes: {}
    },
    fullReplace: {
        method: METHOD_PUT,
        status: 200,
        requestMediaTypes: {}
    },
    partialEdit: {
        method: METHOD_PATCH,
        status: 200,
        requestMediaTypes: {}
    },
    "delete": {
        method: METHOD_DELETE,
        status: 204,
        requestMediaTypes: {}
    }
};

module.exports = class Resource {
    // todo: it would be cool if we could expose "expected url parameters" in a way that slots well with the router and raises warnings
    constructor (configDefaults, supportedActions) {
        this._actions = {};

        if (!Array.isArray(supportedActions)) {
            supportedActions = [supportedActions];
        }

        supportedActions.forEach((action) => {
            // Technically I could assign configDefaults here, but it would
            // get a little weird with the other setActions, so I keep this simple
            this._actions[action] = {};
        });

        // TODO: If you add both the submit and append actions, you have two POST actions. We should error in that case


        this._configDefaults = configDefaults;
        this._searchSchema = {};
        this._requiredSearchProperties = null;
    }

    /**
     * Add a single action to this resource.
     * 
     * @param {any} action 
     * @param {any} [config={}] 
     */
    addAction (action, config = {}) {
        this._actions[action] = config;
    }

    /**
     * Sets the schema of the query parameters this resource accepts
     * 
     * @param {any} schema 
     * @param {any} requiredProperties 
     */
    setSearchSchema (schema, requiredProperties) {
        this._searchSchema = schema;
        this._requiredSearchProperties = requiredProperties;
    }

    /**
     * Performs your API action for a specific HTTP request on this resource
     * 
     * @param {*} method HTTP Method
     * @param {*} urlObject This should be the standard URL object. Search params are located here.
     * @param {*} urlParams This should be an object containing all parameter parts of the url.
     * @param {*} requestBody This should be a string representation of the request body.
     * @param {*} requestHeaders This should be an object containing all request headers.
     */
    async resolve (method, urlObject, urlParams, requestBody, requestHeaders) {
        if (!(urlObject instanceof URL)) {
            throw new TypeError('You must provide a URL object to the resolve method');
        }

        try {
            let action = this.getActionForMethod(method);

            if (!this[action]) {
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
            let requestAuth = this._getAuth(requestHeaders[HEADER_AUTHORIZATION], 
                this._getActionConfig(action, 'authRequired'), 
                this._getActionConfig(action, 'authSchemes'));
            
            if (requestBody) {
                /*
                * Identify the proper request representation from the accept header
                */
                let RequestMediaHandler = this._getRequestMediaHandler(requestHeaders[HEADER_CONTENT_TYPE], 
                    this._getActionConfig(action, 'defaultRequestMediaType'), 
                    this._getActionConfig(action, 'requestMediaTypes'));

                requestBody = new RequestMediaHandler(requestBody, requestAuth);
                await requestBody.parseInput(requestAuth);
            } else {
                /*
                * Here's a safe short cut if we want the request to still work even though we
                * can't locate a proper requestRepresentation. In the current code this might
                * never happen, but I put it here so I don't forget if we want it in the future
                */
                requestBody = undefined;
            }

            /*
             * Initates the validation of the query parameters, and if valid sends those parameters to this resources "modelsResolver" function.
             */
            await this._validateSearchParams(urlObject.searchParams);

            /*
             * Locte a collection of models for this request. These models are provided to the action, and are not manipulated in any way by this framework.
             * The API developer should assume that they can do whatever they want with provided models
             */
            let models = await this.modelsResolver(urlParams, urlObject.searchParams, action, urlObject.pathname);

            /*
             * Find the appropriate resource representation for this resource, and the client's request
             */
            let responseMediaHandler = new (this._getResponseMediaHandler(requestHeaders[HEADER_ACCEPT], 
                this._getActionConfig(action, 'defaultResponseMediaType'), 
                this._getActionConfig(action, 'responseMediaTypes')))();

            /**
             * Perform the HTTP action and get the response
             */
            await this[action](models, requestBody, requestAuth);
            // todo: find a less janky way to handle this method===delete response handler
            return new Response(this._getActionConfig(action, 'status'), method === METHOD_DELETE ? '': responseMediaHandler.render(models, requestAuth));
        } catch (e) {
            return this._buildErrorResponse(e);
        }
    }

    /**
     * Find the appropriate resource action for this HTTP method
     * 
     * @param {*} method 
     */
    getActionForMethod(method) {
        let actions = Object.keys(this._actions);
        
        for (let i = 0; i < actions.length; i++) {
            if (this._getActionConfig(actions[i], 'method') === method) {
                return actions[i];
            }
        }
    }

    /**
     * Find all methods that have been enabled for this resource
     */
    getValidMethods() {
        let actions = Object.keys(this._actions);
        let validMethods = [];

        actions.forEach((action) => {
            if (this[action]) {
                validMethods.push(this._getActionConfig(action, 'method'));
            }
        });

        return validMethods;
    }

    /**
     * Find a configuration setting for an action.
     * If there is not one explicitly set, it checks the cross-action config defaults configured via the resource constructor
     * If there is not one in the cross-action config defaults it checks global defaults
     * 
     * @param {*} action 
     * @param {*} field
     */
    _getActionConfig (action, field) {
        if (typeof(this._actions[action][field]) !== "undefined") {
            return this._actions[action][field];
        }

        // client configurable global defaults across all action
        if (typeof(this._configDefaults[field]) !== "undefined") {
            return this._configDefaults[field];
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
     * @param {any} authorizationHeader 
     * @param {any} authRequired 
     * @param {any} validSchemes 
     * @returns 
     */
    _getAuth(authorizationHeader, authRequired, authSchemes) {
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

        auth = authSchemes[scheme](parameters);
        
        // If we have auth details, return it
        if (auth !== null) {
            return auth;
        }

        // If we have no auth, and it's not required, return null
        if (!authRequired) {
            return null;
        }

        // if we have no auth and it's required, we fall through to the UnauthorizedError
        throw new UnauthorizedError('Unsupported authorization scheme', authSchemes[0]);
    }

    /**
     * Returns the proper representation requested by the client via the accept header
     * 
     * @param {*} acceptHeader 
     * @param {*} representations 
     * @param {*} defaultMediaType 
     */
    _getResponseMediaHandler(acceptHeader, defaultMediaType, representations) {
        let acceptedContentType = Accept.charset(acceptHeader || defaultMediaType, Object.keys(representations));
        return this._getMediaHandler(acceptedContentType, representations, () => {
            // If we could not meet their accept list, fail.
            throw new NotAcceptableError('No acceptable media types for this resource.');
        });
    }

    /**
     * Returns the proper representation provided by the client, as defined by it's contentType
     * 
     * @param {*} contentType 
     * @param {*} defaultContentType 
     * @param {*} representations 
     */
    _getRequestMediaHandler(contentTypeHeader, defaultContentType, representations) {        
        let parsedContentType = ContentType.parse(contentTypeHeader || defaultContentType);
        return this._getMediaHandler(parsedContentType.type, representations, () => {
            // If we could not meet their accept list, fail.
            throw new UnsupportedMediaTypeError('This media type is not supported on this endpoint.');
        });
    }

    /**
     * Returns the appropriate representation from the configured list of representations, and the clients accept header.
     *
     * @param {*} mediaType The media type of the representation
     * @param {*} representations an object of media type => representation
     */
    _getMediaHandler(mediaType, representations, onMiss) {
        /**
         * Ensure that we have a representation for this media type
         */
        if (mediaType && representations[mediaType]) {
            return representations[mediaType];
        }
    
        return onMiss();
    }

    /**
     * Ensures that the search parameters in the request uri match this resources searchSchema
     * @param {*} searchParams 
     */
    async _validateSearchParams(searchParams) {
        if (typeof(searchParams) === 'undefined') {
            return undefined;
        }

        /*
         * Turn search params into a non-search param object because our schema validation
         * system fails on URLSearchParams
         */
        if (searchParams instanceof URLSearchParams) {
            let params = {};
        
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
        
            searchParams = params;
        }

        if (typeof(searchParams) !== "object") {
            throw new Error('You must provide an object to the _validateSearchParams');
        }

        try {
            return await validateObj(searchParams, this._searchSchema, this._requiredSearchProperties);
        } catch (e) {
            if (e instanceof InputValidationError) {
                throw new InputValidationError('Invalid Search Query', e);
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
    _buildErrorResponse(e) {
        if (e instanceof HTTPError) {
            return e.toResponse();
        }

        console.log(e);
        return new Response(500);
    }
};
