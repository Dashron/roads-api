// Things this should support
// 1. if-modified-since
// 2. etag
// 3. translate data to one of many media types
// 4. accept input via one of many media types
// 5. patch media types (configurable)

const representationLocator = require('./representationLocator.js');
const authLocator = require('./authLocator.js');
//const contentTypeLocator = require('./contentTypeLocator.js');
//const verifyContentType = require('./verifyContentType.js');

//const Response = require('./responseLocator.js');

const {
    METHOD_GET,
    METHOD_PUT,
    METHOD_POST,
    METHOD_PATCH,
    METHOD_DELETE,
    HEADER_CONTENT_TYPE,
    HEADER_AUTHORIZATION,
    MEDIA_JSON,
    MEDIA_JSON_MERGE,
} = require('../constants.js');

module.exports = class Resource {
    constructor ({
        // not sure this default config system works as I want it to, what happens if we only replace one action? I don't think the rest fall through
        methods = {
            [METHOD_GET]: 'add',
            [METHOD_PUT]: 'replace',
            [METHOD_POST]: 'append',
            [METHOD_PATCH]: 'patch',
            [METHOD_DELETE]: 'delete'
        },
        // try to standardize on one properties format that can be applied to many different media types
        // I should be able to have a toHAL and toSiren system
        representations,/* = {
            'application/vnd.siren+json': '',
            'application/hal+json': '',
            'application/json': require('postRepresentation.js')
        },*/
        defaultMediaType = MEDIA_JSON,
        // accepts token and params
        // returns false on auth error must retry, null on no auth, yet accepted
        auth = {
            resolvers: {
                Mac: 'tokenAuthResolver',
                Bearer: 'tokenAuthResolver',
                Basic: 'unPassAuthResolver'
            },
            required: false
        },
        requestBody = {
            resolvers: {
                [METHOD_PATCH]: {
                    [MEDIA_JSON_MERGE]: (requestBody) => {

                    }
                },
                [METHOD_POST]: {
                    [MEDIA_JSON]: JSON.parse
                }, 
                [METHOD_PUT]: {
                    [MEDIA_JSON]: JSON.parse
                }
            },
            validators: {
                [METHOD_PATCH]: 'validateEdit',
                [METHOD_PUT]: 'validateReplace',
                [METHOD_POST]: 'validateCreate',
            },
        },
        postTypeCreate = true
    }) {
        this.methods = methods;
        this.representations = representations;
        this.defaultMediaType = defaultMediaType;
        this.auth = auth;
        this.requestBody = requestBody;
        this.postTypeCreate = postTypeCreate;
    }

    /**
     * 
     * @param {*} method 
     * @param {*} uri 
     * @param {*} body 
     * @param {*} headers 
     */
    resolve (method, uri, requestBody, requestHeaders) {
        return new Promise((resolve, reject) => {
            /**
             * Ensure that the client has permission to perform this action.
             * Auth will be the result of the authResolvers function if successful. False if unsuccessful.
             */
            let auth = authLocator(requestHeaders[HEADER_AUTHORIZATION], this.auth);
            if (auth === false) {
                // return one www-authenticate header per authResolver type
                // 'WWW-Authenticate': authorization.format(authType));
                // 401 status code
                return reject('auth');
            }

            /**
             * Ensure that we have a representation for this action
             */
            let representation = representationLocator(requestHeaders.accept, this.representations, this.defaultMediaType);
            if (representation === false) {
                // 406 status code
                return reject('representation');
            }

            /**
             * Ensure that the request body is valid.
             */
            if (requestBody && requestHeaders[HEADER_CONTENT_TYPE]) {
                let validation = null;
                const contentType = require('content-type');

                
                let parsedContentType = contentType.parse(requestHeaders[HEADER_CONTENT_TYPE]);
                
                if (!this.requestBody.resolvers[method][parsedContentType.type]) {
                    // 415 status code
                    // proper accept-patch header
                    return reject('patch type');
                }

                /**
                 * Ensure the request body matches the content type, and transform it into a usable object
                 */
                try {
                    requestBody = this.requestBody.resolvers[method][parsedContentType.type](requestBody);
                } catch (e) {
                    // 400 maybe, couldn't parse despite the content-type being ok
                    return reject('content syntax');
                }

                /**
                 * Validate the request body based on the resource action (HTTP method)
                 */
                if (this.requestBody.validators[method]) {
                    validation = this._validateInput(method, representation, requestBody);
                    if (validation === false) {
                        // else validation error;
                        // 400 maybe, 422 maybe
                        return reject('input validation');
                    }
                } else {
                    // You MUST have a validator defined. No validator means we expect no data, and we enforce that concept here
                    requestBody = undefined;
                }
            } else {
                requestBody = undefined;
            }

            /**
             * Perform the HTTP action and get the response status and models (headers are part of the representation)
             */
            let {
                responseStatus,
                responseModels
                // todo: what if the method doesn't exist on "this". do we need better constructor validation?
            } = this[this.methods[method]](auth, requestBody, this.modelsLocator(uri, method));

            /**
             * Build the response body
             */
            let {
                responseBody, 
                responseHeaders
            } = representation.render(responseModels, auth);

            //return new Response(responseStatus, responseBody, responseHeaders);
            return resolve({
                responseStatus: responseStatus,
                responseBody: responseBody,
                responseHeaders: responseHeaders
            });
        });
    }

    /**
     * 
     */
    _validateInput(method, representation, requestBody) {
        // todo: what if the method doesn't exist on the validator, what if it doesn't exist on this, what about representation
        if (method === METHOD_PUT) {
            return representation[this.requestBody.validators[METHOD_PUT]](requestBody);
        }
        
        if (method === METHOD_POST) {
            if (this.postTypeCreate) {
                return representation[this.requestBody.validators[METHOD_POST]](requestBody);
            }

            return this[this.requestBody.validators[METHOD_POST]](requestBody);

        }
        
        if (method === METHOD_PATCH) {
            return this[this.requestBody.validators[METHOD_PATCH]](requestBody);
        }

        // wtf, this is wrong, this is the wrong kind of response, fix this
        return false;
    }
};