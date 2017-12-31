// Things this should support
// 1. if-modified-since
// 2. etag
// 3. translate data to one of many media types
// 4. accept input via one of many media types
// 5. patch media types (configurable)

const authParser = require('./authParser.js');
const contentTypeResolver = require('./contentTypeResolver.js');
const Response = require('../response.js');
const Accept = require('accept');

const {
    METHOD_GET,
    METHOD_PUT,
    METHOD_POST,
    METHOD_PATCH,
    METHOD_DELETE,
    HEADER_CONTENT_TYPE,
    HEADER_AUTHORIZATION,
    MEDIA_JSON
} = require('../constants.js');

const {
    UnauthorizedError,
    NotAcceptableError,
    HTTPError
} = require('../httpErrors.js');


module.exports = class Resource {
    // todo: include a "all methods" config, that can be overridden
    constructor ({
        // not sure this default config system works as I want it to, what happens if we only replace one action? I don't think the rest fall through
        methods = {
            [METHOD_GET]: {
                action: 'get',
                validSchemes: [],
                representations: null, //= require('postRepresentation.js'),
                authRequired: true
            },
            [METHOD_PUT]: {
                action: 'replace',
                validation: 'validateReplace',
                validSchemes: [],
                representations: null, //= require('postRepresentation.js'),
                authRequired: true
            },
            [METHOD_POST]: {
                action: 'append',
                validation: 'validateCreate',
                validSchemes: [],
                representations: null, //= require('postRepresentation.js'),
                authRequired: true
            },
            [METHOD_PATCH]: {
                action: 'edit',
                validation: 'validateEdit',
                validSchemes: [],
                representations: null, //= require('postRepresentation.js'),
                authRequired: true
            },
            [METHOD_DELETE]: {
                action: 'delete',
                validSchemes: [],
                representations: null, //= require('postRepresentation.js'),
                authRequired: true
            }
        },
        // try to standardize on one properties format that can be applied to many different media types
        // I should be able to have a toHAL and toSiren system
        defaultMediaType = MEDIA_JSON,
        // accepts token and params
        // returns false on auth error must retry, null on no auth, yet accepted
        authResolvers = {}
    }) {
        this._methods = methods;
        this._defaultMediaType = defaultMediaType;
        this._authResolvers = authResolvers;
    }

    /**
     * 
     * @param {*} method 
     */
    _getMethodConfig (method) {
        return this._methods[method];
    }

    /**
     * 
     * @param {*} method 
     * @param {*} uri 
     * @param {*} body 
     * @param {*} headers 
     */
    async resolve (method, uri, requestBody, requestHeaders) {
        try {
            let requestAuth = this._getAuth(requestHeaders[HEADER_AUTHORIZATION], this._getMethodConfig(method).authRequired, this._getMethodConfig(method).validSchemes);
            let requestedRepresentation = this._getRepresentation(requestHeaders.accept, this._getMethodConfig(method).representations);

            /*
             * Retrieve && validate the request body
             */
            switch (method) {
                case METHOD_PUT:
                case METHOD_PATCH:
                    requestBody = this._getRequestBody(requestHeaders[HEADER_CONTENT_TYPE], requestBody, requestedRepresentation[this._getMethodConfig(method).validation]);
                    break;
                case METHOD_POST:
                    requestBody = this._getRequestBody(requestHeaders[HEADER_CONTENT_TYPE], requestBody, this[this._getMethodConfig(method).validation]);
                    break;
                case METHOD_DELETE:
                case METHOD_GET:
                    // Todo: this isn't valid to the spec
                    requestBody = null;
                    break;
            }
            
            let models = this._getModels(uri, method);

            /**
             * Perform the HTTP action and get the response status and models (headers are part of the representation)
             */
            let response = this[this._getMethodConfig(method).action](requestAuth, requestBody, models, requestedRepresentation);

            // Force the methods to return response objects
            // todo: this might not be what we want? Ideally this isn't handled by end users
            if (!(response instanceof Response)) {
                throw new TypeError('Resource functions must return a Response object');
            }

            // We likely want to modify this information between receiving data from the controller and sending it to the user
            return new Response(response.status, response.body, response.headers);
        } catch (e) {
            return this._buildErrorResponse(e);
        }
    }

    /**
     * Ensure that the client has permission to perform this action.
     */
    _getAuth(authorizationHeader, authRequired, validSchemes) {
        let auth = null;

        // If this resource requires authentication, we enforce that behavior here
        if (!authorizationHeader) {
            // todo: this probably should be method-specific, not resource specific
            if (!authRequired) {
                return null;
            }

            throw new UnauthorizedError('Authorization required', validSchemes[0]);
        }

        // parse the auth header and validate the format (e.g. parse basic auth into username & password)
        let {
            scheme,
            parameters
        } = authParser(authorizationHeader, validSchemes);

        if (this._authResolvers[scheme]) {
            auth = this._authResolvers[scheme](parameters);
            
            // If we have auth details, return it
            if (auth !== null) {
                return auth;
            }

            // If we have no auth, and it's not required, return null
            if (!authRequired) {
                return null;
            }

            // if we have no auth and it's required, we fall through to the UnauthorizedError
        }

        throw new UnauthorizedError('Unsupported authorization scheme', validSchemes[0]);
    }

    /**
     * 
     * @param {*} acceptHeader 
     */
    _getRepresentation(acceptHeader, representations) {
        /**
         * Ensure that we have a representation for this action
         */
        if (acceptHeader) {
            let contentTypes = Accept.charset(acceptHeader, Object.keys(representations));
            
            if (contentTypes) {
                return representations[contentTypes[0]];
            }
        }
    
        if (this._defaultMediaType) {
            return representations[this._defaultMediaType];
        }
    
        throw new NotAcceptableError('No acceptable media types for this resource');
    }

    /**
     * 
     * @param {*} contentType 
     * @param {*} requestBody 
     */
    _getRequestBody(contentType, requestBody, validator) {
        /**
         * Ensure that we have all the information we need to understand the request body
         */
        if (!(requestBody && contentType && validator)) {
            requestBody = undefined;
        }
        
        let parsedContentType = contentTypeResolver.parseHeader(contentType);
        requestBody = contentTypeResolver.parse(requestBody, parsedContentType.type);
        return validator(requestBody);
    }

    /**
     * 
     * @param {*} uri 
     * @param {*} method 
     */
    _getModels(uri, method) {
        return {};
    }

    /**
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