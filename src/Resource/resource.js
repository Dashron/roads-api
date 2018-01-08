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
const getValidator = require('./validator.js');

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
    HTTPError,
    NotFoundError,
    InvalidRequestError
} = require('../httpErrors.js');

module.exports = class Resource {
    // todo: it would be cool if we could expose "expected url parameters" in a way that slots well with the router and raises warnings
    constructor (configDefaults) {
        this._methods = {};
        this._defaultMediaType = {};
        this._authResolvers = {};
        this._configDefaults = configDefaults;
    }

    setMethod (method, config = {}) {
        this._methods[method] = config;
    }

    setDefaultMediaType (type) {
        this._defaultMediaType = type;
    }

    setAuthResolver(scheme, resolver) {
        this._authResolvers[scheme] = resolver;
    }

    /**
     * 
     * @param {*} method 
     * @param URL url this should be the standard URL object. If there are
     * @param {*} body 
     * @param {*} headers 
     */
    async resolve (method, url, requestBody, requestHeaders) {
        try {
            let requestAuth = this._getAuth(requestHeaders[HEADER_AUTHORIZATION], this._getMethodConfig(method, 'authRequired'), this._getMethodConfig(method, 'validAuthSchemes'));
            let requestedRepresentation = this._getRepresentation(requestHeaders.accept, this._getMethodConfig(method, 'representations'));

            /*
             * Retrieve & validate the request body
             */
            let contentType = requestHeaders[HEADER_CONTENT_TYPE] || this._defaultMediaType;

            if (contentType && requestBody) {
                let parsedContentType = contentTypeResolver.parseHeader(contentType);
                requestBody = this._parseRequestBody(parsedContentType, requestBody);
                console.log('typeof', typeof(requestBody));
                
                if (!this._validateRequestBody(requestBody, method, parsedContentType, requestedRepresentation)) {
                    requestBody = undefined;
                }
            } else {
                requestBody = undefined;
            }
            
            let models = this._getModels(url, method);

            /**
             * Perform the HTTP action and get the response
             */
            let response = await this._executeAction(method, requestAuth, requestBody, models, requestedRepresentation);

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
     * 
     * @param {*} method 
     */
    _getMethodConfig (method, field) {
        if (typeof(this._methods[method][field]) !== "undefined") {
            return this._methods[method][field];
        }

        // client configurable global defaults across all methods
        if (this._configDefaults[field]) {
            return this._configDefaults[field];
        }
        
        // roads-api default method actions, can be overridden in each method config
        if (field === 'action') {
            switch (method) {
                case METHOD_GET:
                    return '_get';
                case METHOD_POST:
                    // todo: offer an easy "submit" option
                    return '_append';
                case METHOD_PUT:
                    return '_replace';
                case METHOD_PATCH:
                    return '_edit';
                case METHOD_DELETE:
                    return '_delete';
            }
        }

        // default to no schema, which means any request body will fail
        if (field == 'schema') {
            return null;
        }

        throw new Error(this.className + ' has attempted to access a missing config value for the method ' + 
            method + ' and the field ' + field + '. There is no default for this config, so you must provide it manually in the resource constructor, or when invoking addMethod.');
    }

    async _get (auth, body, models, selectedRepresentation) {
        return new Response(200, selectedRepresentation.render(models, auth));
    }

    async _replace (auth, body, models, selectedRepresentation) {
        await selectedRepresentation.replace(models, body);
        return new Response(200, selectedRepresentation.render(models, auth));
    }

    async _append (auth, body, models, selectedRepresentation) {
        await selectedRepresentation.append(body);
        return new Response(201, selectedRepresentation.render(models, auth));
    }

    async _edit (auth, body, models, selectedRepresentation) {
        await selectedRepresentation.edit(models, body);
        return new Response(200, selectedRepresentation.render(models, auth));
    }

    async _delete (auth, body, models, selectedRepresentation) {
        await selectedRepresentation.delete(models);
        return new Response(204, selectedRepresentation.render(models, auth));
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
    _parseRequestBody(parsedContentType, requestBody) {
        /**
         * Ensure that we have all the information we need to understand the request body
         */
        if (!(parsedContentType && requestBody)) {
            return undefined;
        }
        
        return contentTypeResolver.parseBody(requestBody, parsedContentType);
    }

    /**
     * 
     * @param {*} requestBody 
     * @param {*} method 
     * @param {*} parsedContentType 
     * @param {*} representation 
     */
    _validateQuery(url, method, parsedContentType, representation) {
        //return representation[this._getMethodConfig(method, 'action')](parsedContentType, url);
        // todo
        return false;
    }

    /**
     * 
     * @param {*} requestBody 
     * @param {*} method 
     * @param {*} parsedContentType 
     * @param {*} representation 
     */
    _validateRequestBody(requestBody, method, parsedContentType, representation) {
        if (typeof(requestBody) === 'undefined') {
            return undefined;
        }

        let schema = representation[this._getMethodConfig(method, 'schema')];
        let validator = getValidator(parsedContentType.type);

        if (!(schema && validator)) {
            throw new InvalidRequestError('This action does not accept request bodies');
        }

        return validator(requestBody, schema);
    }

    /**
     * 
     * @param {*} url 
     * @param {*} method 
     */
    _getModels(url, method) {
        return this.modelsResolver(url.urlParams, url.parsedUrl.searchParams, method, url.parsedUrl.pathname);
    }

    /**
     * 
     * @param {*} method 
     * @param {*} requestAuth 
     * @param {*} requestBody 
     * @param {*} models 
     * @param {*} requestedRepresentation 
     */
    _executeAction(method, requestAuth, requestBody, models, requestedRepresentation) {
        return this[this._getMethodConfig(method, 'action')](requestAuth, requestBody, models, requestedRepresentation);
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