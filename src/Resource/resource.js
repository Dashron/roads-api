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
    MethodNotAllowed
} = require('../httpErrors.js');

const globalDefaults = {
    [METHOD_GET]: {
        action: '_get'
    },
    [METHOD_POST]: {
        action: '_append'
    },
    [METHOD_PUT]: {
        action: '_replace'
    },
    [METHOD_PATCH]: {
        action: '_edit'
    },
    [METHOD_DELETE]: {
        action: '_delete'
    }
};

module.exports = class Resource {
    // todo: it would be cool if we could expose "expected url parameters" in a way that slots well with the router and raises warnings
    constructor (configDefaults, defaultMethods) {
        this._methods = {};

        defaultMethods.forEach((method) => {
            // Technically I could assign configDefaults here, but it would
            // get a little weird with the other setMethods, so I keep this simple
            this._methods[method] = {};
        });

        this._configDefaults = configDefaults;
        this._searchSchema = {};
        this._requiredSearchProperties = null;
    }

    /**
     * Assign a single HTTP method to this resource
     * 
     * @param {any} method 
     * @param {any} [config={}] 
     */
    setMethod (method, config = {}) {
        this._methods[method] = config;
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
            if (!this._methods[method]) {
                throw new MethodNotAllowed(Object.keys(this._methods));
            }
            
            /*
             * Identify authentication information so we can provide it to all further methods
             * If the authentication credentials are valid, the API developer should assume that 
             * they can do whatever they want with the result of getModels, and assume that
             * the action and representation will receive those models untouched.
             * 
             * If the credentials are not provided, the client should return "null"
             * If the credentials are invalid, the client should throw an error (TODO: What error?)
             */
            let requestAuth = this._getAuth(requestHeaders[HEADER_AUTHORIZATION], 
                this._getMethodConfig(method, 'authRequired'), 
                this._getMethodConfig(method, 'authSchemes'));

            /*
             * Identify the proper request representation from the accept header
             */
            let requestRepresentation = this._getRequestRepresentation(requestHeaders[HEADER_CONTENT_TYPE], 
                this._getMethodConfig(method, 'defaultRequestMediaType'), 
                this._getMethodConfig(method, 'representations'));
            
            if (requestBody) {
                requestBody = requestRepresentation.parseInput(requestBody, requestAuth);
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
            let models = await this.modelsResolver(urlParams, 
                urlObject.searchParams, method, urlObject.pathname);

            /*
             * Find the appropriate resource representation for this resource, and the client's request
             */
            let responseRepresentation = this._getResponseRepresentation(requestHeaders[HEADER_ACCEPT], 
                this._getMethodConfig(method, 'defaultResponseMediaType'), 
                this._getMethodConfig(method, 'representations'));

            /**
             * Perform the HTTP action and get the response
             */
            let response = await this[this._getMethodConfig(method, 'action')](models, 
                requestBody, requestRepresentation, requestAuth, responseRepresentation);

            /* 
             * Force the methods to return response objects
             * todo: this might not be what we want? 
             * On the other hand this should not be handled by the API developer
             */
            if (!(response instanceof Response)) {
                throw new TypeError('Resource functions must return a Response object');
            }

            return response;
        } catch (e) {
            return this._buildErrorResponse(e);
        }
    }

    /**
     * This is a janky way of finding values in a config, and providing defaults
     * 
     * TODO: make this less janky
     * @param {*} method 
     * @param {*} field
     */
    _getMethodConfig (method, field) {
        if (typeof(this._methods[method][field]) !== "undefined") {
            return this._methods[method][field];
        }

        // client configurable global defaults across all methods
        if (this._configDefaults[field]) {
            return this._configDefaults[field];
        }

        // roads defaults for global defaults on a per-method basis
        if (globalDefaults[method][field]) {
            return globalDefaults[method][field];
        }

        throw new Error(this.className + 
            ' has attempted to access a missing config value for the method ' + 
            method + ' and the field ' + field + 
            '. There is no default for this config, so you must provide it manually in the resource constructor, or when invoking addMethod.');
    }

    /**
     * This is the default "view" action for the HTTP GET method
     * 
     * @param {any} models 
     * @param {any} requestBody
     * @param {any} requestRepresentation
     * @param {any} requestAuth 
     * @param {any} responseRepresentation 
     * @returns 
     */
    async _get (models, requestBody, requestRepresentation, requestAuth, responseRepresentation) {
        return new Response(200, responseRepresentation.render(models, requestAuth));
    }

    /**
     * This is the default "replace" action for the HTTP PUT method.
     * It will call the target representations "saveRepresentation" method
     * 
     * @param {any} models 
     * @param {any} requestBody
     * @param {any} requestRepresentation
     * @param {any} requestAuth 
     * @param {any} responseRepresentation 
     * @returns 
     */
    async _replace (models, requestBody, requestRepresentation, requestAuth, responseRepresentation) {
        await requestRepresentation.replace(requestBody, models, requestAuth);
        return new Response(200, responseRepresentation.render(models, requestAuth));
    }

    /**
     * This is the deafult "edit" action for the HTTP PATCH method.
     * It will call the target representations "saveRepresentation" method
     * TODO: Why isn't this using the patchResolver? huh. maybe a bug?
     * 
     * @param {any} models 
     * @param {any} requestBody
     * @param {any} requestRepresentation
     * @param {any} requestAuth 
     * @param {any} responseRepresentation 
     * @returns 
     */
    async _edit (models, requestBody, requestRepresentation, requestAuth, responseRepresentation) {
        // for now we are just treating this like a submission, because this is going to be hard to get right
        await requestRepresentation.edit(requestBody, models, requestAuth);
        return new Response(200, responseRepresentation.render(models, requestAuth));
    }

    /**
     * This is the default "append" action for the HTTP POST method.
     * It will call the selectedRepresentations "append" method.
     * It should be used if you want to accept a resource representation and 
     * append it on to a collection of resources (e.g. POST /blog/posts)
     * 
     * @param {any} models 
     * @param {any} requestBody
     * @param {any} requestRepresentation
     * @param {any} requestAuth 
     * @param {any} responseRepresentation 
     * @returns 
     */
    async _append (models, requestBody, requestRepresentation, requestAuth, responseRepresentation) {
        await requestRepresentation.append(requestBody, models, requestAuth);
        return new Response(201, responseRepresentation.render(models, requestAuth));
    }

    /**
     * This is the optional "submit" action for the HTTP POST method.
     * It will call the selectedRepresentations "submit" method.
     * It should be used when you are sending arbitrary JSON data to a resource.
     * 
     * @param {any} models 
     * @param {any} requestBody
     * @param {any} requestRepresentation
     * @param {any} requestAuth 
     * @param {any} responseRepresentation 
     * @returns 
     */
    async _submit (models, requestBody, requestRepresentation, requestAuth, responseRepresentation) {
        await requestRepresentation.submit(requestBody, models, requestAuth);
        return new Response(200, responseRepresentation.render(models, requestAuth));
    }

    /**
     * This is the standard "delete" action for the HTTP DELETE method.
     * It will call the selectedRepresentations "deleteRepresentation" method.
     * 
     * @param {any} models 
     * @param {any} requestBody
     * @param {any} requestRepresentation
     * @param {any} requestAuth 
     * @param {any} responseRepresentation 
     * @returns 
     */
    async _delete (models, requestBody, requestRepresentation, requestAuth, responseRepresentation) {
        await requestRepresentation.delete(models, requestAuth);
        return new Response(204);
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
            // todo: this probably should be method-specific, not resource specific
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
        throw new UnauthorizedError('Unsupported authorization scheme', validSchemes[0]);
    }

    /**
     * Returns the proper representation requested by the client via the accept header
     * 
     * @param {*} acceptHeader 
     * @param {*} representations 
     * @param {*} defaultMediaType 
     */
    _getResponseRepresentation(acceptHeader, defaultMediaType, representations) {
        let acceptedContentType = Accept.charset(acceptHeader || defaultMediaType, Object.keys(representations));
        let representation = this._getRepresentation(acceptedContentType, representations);

        if (representation) {
            return representation;
        }

        // If we could not meet their accept list, fail.
        throw new NotAcceptableError('No acceptable media types for this resource.');
    }

    /**
     * Returns the proper representation provided by the client, as defined by it's contentType
     * 
     * @param {*} contentType 
     * @param {*} defaultContentType 
     * @param {*} representations 
     */
    _getRequestRepresentation(contentTypeHeader, defaultContentType, representations) {        
        let parsedContentType = ContentType.parse(contentTypeHeader || defaultContentType);
        let representation = this._getRepresentation(parsedContentType.type, representations);

        if (representation) {
            return representation;
        }

        // If we could not meet their accept list, fail.
        throw new UnsupportedMediaTypeError('This media type is not supported on this endpoint.');
    }

    /**
     * Returns the appropriate representation from the configured list of representations, and the clients accept header.
     *
     * @param {*} mediaType The media type of the representation
     * @param {*} representations an object of media type => representation
     */
    _getRepresentation(mediaType, representations) {
        /**
         * Ensure that we have a representation for this media type
         */
        if (mediaType && representations[mediaType]) {
            return representations[mediaType];
        }
    
        return false;
    }

    /**
     * Ensures that the search parameters in the request uri match this resources searchSchema
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
