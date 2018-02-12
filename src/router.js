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
    InputValidationError
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
     * Roads middleware to receive HTTP requests and return resource representations
     * 
     * @param {any} method 
     * @param {any} fullUrl 
     * @param {any} body 
     * @param {any} headers 
     * @returns 
     */
    async middleware(method, requestUrl, body, headers) {
        if (! (requestUrl instanceof URL)) {
            requestUrl = new URL(requestUrl, this._baseUrl);
        }

        let {
                resource,
                url
        } = this.locateResource(requestUrl);

        if (!resource) {
            return;
        }

        return await resource.resolve(method, url, body, headers);
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
                        throw new InputValidationError('Invalid URL Parameters', e);
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
};