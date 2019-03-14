"use strict";
/**
 * router.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * 
 */

let {URL} = require('url');
const URITemplate = require('uri-templates');
const validateObj = require('./objectValidator.js');
const {
    InputValidationError,
    NotFoundError
} = require('./httpErrors.js');

/**
 * This is an interesting one. So the uri-templates fromURI function will return an empty string in the following case
 * 
 * template("/posts/{post_id}").fromUri("/posts/")
 * 
 * becasue it assumes post_id is just an empty string. We want to remove this key for our schema validation processes
 * so we rewrite the object here.
 * 
 * This only handles the top level of parameters, because uri template won't have sub params.
 * It will not navigate into arrays and replace individual values. This means that the following example will have one empty string value in the array
 * 
 * template("{/id*}").fromUri("/posts//");
 * 
 * @param {*} obj 
 */
function delEmptyString(obj) {
    for (let key in obj) {
        if (obj[key] === '') {
            delete obj[key];
        }
    }

    return obj;
}

module.exports = class Router {
    constructor (baseUrl) {
        this._routes = [];
        this._baseUrl = baseUrl;
    }

    /**
     * Assign a resource to a URI template for the middleware, or locateResource method to locate in the future
     * 
     * @param {*} template URI template
     * @param {*} resource Resource object
     * @param {*} config Additional configuration for this route. Currently supports a urlParams object with "schema" and "required" properties. These properties are used alongside the standard objectValidator to validate any URI params.
     */
    addResource(template, resource, config) {
        this._routes.push({
            compiledTemplate: new URITemplate(template),
            config: config || {},
            resource: resource
        });
    }
    
    /**
     * Attempts to locate a resource for the provided url.
     * @param {string} url - a URL object
     * @throws {TypeError} if the URI is not a valid URL
     * @throws {InputValidationError} if we located a matching route, but the urls uri params did not match the url schema
     * @return An object with two properties. Resource, which is the relevant Resource object for this route. urlParams which is an object containing all the url params and values in url.
     */
    async locateResource(url) {        
        if (!(url instanceof URL)) {
            throw new TypeError('You must provide a string or URL object to the _locateResource method');
        }

        let urlParams = null;

        for(let i = 0; i < this._routes.length; i++) {
            urlParams = this._routes[i].compiledTemplate.fromUri(url.pathname);

            if (urlParams === true) {
                urlParams = {};
            }

            urlParams = delEmptyString(urlParams);

            if (this._routes[i].config.urlParams) {
                try {
                    await validateObj(urlParams, this._routes[i].config.urlParams.schema, this._routes[i].config.urlParams.required);
                } catch (e) {
                    if (e instanceof InputValidationError) {
                        // If the fields aren't valid, this route isn't a match. We might have another match down the chain.
                        continue;
                    }
        
                    throw e;
                }
            }

            if (typeof(urlParams) === "object") {
                return {
                    resource: this._routes[i].resource,
                    urlParams: urlParams
                };
            }
        }

        return false;
    }
    
    middleware (protocol, hostname) {
        let router = this;
        return async function (requestMethod, requestUrl, requestBody, requestHeaders) {
            requestUrl = new URL(protocol + hostname + requestUrl);
        
            let routeResponse = await router.locateResource(requestUrl);

            if (!routeResponse) {
                // Currently the roads and roads-api response objects are different, so we have to do this jank.
                // todo: share responses (or maybe all errors) across both projects
                // todo: maybe this should just return, and let followup middleware handle missed routes?
                let apiResponse = (new NotFoundError("Not Found")).toResponse();
                return new this.Response(apiResponse.body, apiResponse.status, apiResponse.headers);
            }
        
            let resource = new routeResponse.resource();
            let response = await resource.resolve(requestMethod, requestUrl, routeResponse.urlParams, requestBody, requestHeaders);
            return new this.Response(response.body, response.status, response.headers);
        };
    }
};