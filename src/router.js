"use strict";

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
     * @param {*} template 
     * @param {*} resource 
     * @param {*} config 
     */
    addResource(template, resource, config) {
        this._routes.push({
            compiledTemplate: new URITemplate(template),
            config: config || {},
            resource: resource
        });
    }

    // todo: roads middleware
    async middleware(method, fullUrl, body, headers) {
        if (this._baseUrl) {
            fullUrl = new URL(fullUrl, this._baseUrl);    
        }

        let {
                resource,
                url
        } = this.locateResource(fullUrl);

        if (!resource) {
            return;
        }

        return await resource.resolve(method, url, body, headers);

    }
    
    /**
     * 
     * @param {*} URI 
     * @throws TypeError if the URI is not a valid URL
     */
    async locateResource(url) {        
        if (!(url instanceof URL)) {
            throw new Error('You must provide a string or URL object to the _locateResource method');
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
                        throw new InputValidationError('Invalid Search Query', e);
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