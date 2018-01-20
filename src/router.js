"use strict";

let {URL} = require('url');
const URITemplate = require('uri-templates');
module.exports = class Router {
    constructor (baseUrl) {
        this._routes = [];
        this._baseUrl = baseUrl;
    }

    addResource(template, resource, config) {
        this._routes.push({
            compiledTemplate: new URITemplate(template),
            config: config,
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
        } = this._locateResource(fullUrl);

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
    _locateResource(url) {        
        if (!(url instanceof URL)) {
            throw new Error('You must provide a string or URL object to the _locateResource method');
        }

        let urlParams = null;

        for(let i = 0; i < this._routes.length; i++) {
            urlParams = this._routes[i].compiledTemplate.fromUri(url.pathname);

            if (urlParams === true) {
                urlParams = {};
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