// Things this should support
// 1. if-modified-since
// 2. etag
// 3. translate data to one of many media types
// 4. accept input via one of many media types
// 5. patch media types (configurable)

const representationLocator = require('./representation.js');
const authLocator = require('./authLocator.js');
const patchLocator = require('./patchLocator.js');
const Response = require('./responseLocator.js');

module.exports = class Resource {
    constructor ({
        // not sure this default config system works as I want it to, what happens if we only replace one action? I don't think the rest fall through
        actions = {
            get: 'add',
            put: 'replace',
            post: 'append',
            patch: 'patch',
            delete: 'delete'
        },
        // try to standardize on one properties format that can be applied to many different media types
        // I should be able to have a toHAL and toSiren system
        representations = {
            //'application/vnd.siren+json': '',
            //'application/hal+json': '',
            //'application/json': require('postRepresentation.js')
        },
        defaultMediaType = 'application/json',
        // accepts token and params
        // returns false on auth error must retry, null on no auth, yet accepted
        authResolvers = {
            Mac: 'tokenAuthResolver',
            Bearer: 'tokenAuthResolver',
            Basic: 'unPassAuthResolver'
        },
        validators = {
            put: 'replace',
            post: 'add',
            patch: 'patch',
            delete: 'delete'
        },
        patchMediaTypes = {
            'application/merge-patch+json' //https://tools.ietf.org/html/rfc7386
        }
    }) {
        this.actions = actions;
        this.representations = representations;
        this.defaultMediaType = defaultMediaType;
        this.authResolvers = authResolvers;
        this.validators = validators;
        this.patchMediaTypes = patchMediaTypes;
    }

    /**
     * 
     * @param {*} method 
     * @param {*} uri 
     * @param {*} body 
     * @param {*} headers 
     */
    resolve (method, uri, requestBody, requestHeaders) {
        let auth = authLocator(requestHeaders, this.authResolvers);
        // todo: how do we handle scopes?

        if (auth === false) {
            // return one www-authenticate header per authResolver type
            // 'WWW-Authenticate': authorization.format(authType));
            // 401 status code
            return false;
        }

        let representation = representationLocator(requestHeaders.accept, this.representations, this.defaultMediaType);
        let validation = false;

        if (method === 'PATCH') {
            requestBody = patchLocator(requestHeaders['accept-patch'], this.patchMediaTypes);
        }

        // make sure the input is valid
        if (this.validators[method]) {
            validation = representation[this.validators[method]](requestBody);
        } else {
            // else error;
            throw new Error("not yet implemented");
        }

        // perform the action and retrieve a status and some models
        // do we need headers here too?
        let {
            responseStatus,
            responseModels
        } = this[this.actions[method]]({
            auth: auth,
            body: requestBody,
            models: this.modelsLocator(uri, method)
        });

        // build the representation and retrieve a body and some headers
        let {
            responseBody, 
            responseHeaders
        } = representation({
            models: responseModels,
            auth: auth
        });

        return new Response(responseStatus, responseBody, responseHeaders);
    }
};