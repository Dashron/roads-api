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
    MEDIA_JSON,
    VALIDATOR_MODE_EDIT,
    VALIDATOR_MODE_READ
} = require('../constants.js');

const {
    UnauthorizedError,
    NotAcceptableError,
    HTTPError,
    NotFoundError,
    InvalidRequestError,
    InputValidationError
} = require('../httpErrors.js');

module.exports = class Resource {
    // todo: it would be cool if we could expose "expected url parameters" in a way that slots well with the router and raises warnings
    constructor (configDefaults) {
        this._methods = {};
        this._defaultMediaType = {};
        this._authResolvers = {};
        this._configDefaults = configDefaults;
        this._searchSchema = {};
    }

    setMethod (method, config = {}) {
        this._methods[method] = config;
    }

    setMethods (config) {
        for (let method in config) {
            this.setMethod(method, config[method]);
        }
    }

    setSearchSchema (schema, requiredProperties) {
        this._searchSchema = schema;
        this._requiredSearchProperties = requiredProperties;
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
    async resolve (method, urlObject, urlParams, requestBody, requestHeaders) {
        if (!(urlObject instanceof URL)) {
            throw new Error('You must provide a URL object to the resolve method');
        }

        try {
            let requestAuth = this._getAuth(requestHeaders[HEADER_AUTHORIZATION], this._getMethodConfig(method, 'authRequired'), this._getMethodConfig(method, 'validAuthSchemes'));
            let requestedRepresentation = this._getRepresentation(requestHeaders.accept, this._getMethodConfig(method, 'representations'));

            /*
             * Retrieve & validate the request body
             */
            let contentType = requestHeaders[HEADER_CONTENT_TYPE] || this._defaultMediaType;

            if (! (contentType && requestBody)) {
                requestBody = undefined;
            }

            requestBody = await this._validateRequestBody(requestBody, contentType, method, requestAuth);

            let models = await this._getModels(urlObject, urlParams, method);

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
        // TODO: We need a way to validate schemas when you construct your resource
        if (field === 'schema') {
            return null;
        }

        throw new Error(this.className + ' has attempted to access a missing config value for the method ' + 
            method + ' and the field ' + field + '. There is no default for this config, so you must provide it manually in the resource constructor, or when invoking addMethod.');
    }

    async _get (auth, body, models, selectedRepresentation) {
        return new Response(200, selectedRepresentation.render(models, auth));
    }

    async _replace (auth, body, models, selectedRepresentation) {
        await selectedRepresentation.saveRepresentation(models, body);
        return new Response(200, selectedRepresentation.render(models, auth));
    }

    async _edit (auth, body, models, selectedRepresentation) {
        await selectedRepresentation.saveRepresentation(models, body);
        return new Response(200, selectedRepresentation.render(models, auth));
    }

    async _append (auth, body, models, selectedRepresentation) {
        await selectedRepresentation.append(body);
        return new Response(201, selectedRepresentation.render(models, auth));
    }

    // reserved for arbitrary POST submissions
    /*async _submit (auth, body, models, selectedRepresentation) {
        await selectedRepresentation.submit(body);
        return new Response(200, selectedRepresentation.render(models, auth));
    }*/

    async _delete (auth, body, models, selectedRepresentation) {
        await selectedRepresentation.deleteRepresentation(models);
        return new Response(204);
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
     * TODO: We need a resource validation system for query parameter validation
     * 
     * @param {*} requestBody 
     * @param {*} method 
     * @param {*} parsedContentType 
     * @param {*} representation 
     */
    async _validateSearchParams(searchParams) {
        if (typeof(searchParams) === 'undefined') {
            return undefined;
        }

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
     * 
     * @param {*} requestBody 
     * @param {*} method 
     * @param {*} parsedContentType 
     * @param {*} representation 
     */
    _validateRequestBody(requestBody, contentType, method, auth) {
        if (typeof(requestBody) === 'undefined') {
            return undefined;
        }
        
        let parsedContentType = contentTypeResolver.parseHeader(contentType);
        let contentRepresentation = this._getRepresentation(parsedContentType.type, this._getMethodConfig(method, 'representations'));
        requestBody = this._parseRequestBody(parsedContentType, requestBody);

        return contentRepresentation.validateInput(requestBody, auth);
    }

    /**
     * 
     * @param {*} url 
     * @param {*} method 
     */
    async _getModels(urlObject, urlParams, method) {    
        await this._validateSearchParams(urlObject.searchParams);
 
        return this.modelsResolver(urlParams, urlObject.searchParams, method, urlObject.pathname);
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