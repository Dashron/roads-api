"use strict";

let {URL} = require('url');
const URITemplate = require('uri-templates');
module.exports = class Router {
    constructor () {
        this._routes = [];
    }

    addRoute(template, resource, config) {
        this._routes.push({
            compiledTemplate: new URITemplate(template),
            config: config,
            resource: resource
        });
    }

    // todo: roads middleware
    middleware(method, url, body, headers) {

    }
    
    /**
     * 
     * @param {*} URI 
     * @throws TypeError if the URI is not a valid URL
     */
    locateResource(url) {
        url = new URL(url);
        let parsedURL = null;

        for(let i = 0; i < this._routes.length; i++) {
            parsedURL = this._routes[i].compiledTemplate.fromUri(url.pathname);
            if (parsedURL) {
                return this._buildUrlObject(url, parsedURL);
            }
        }

        return false;
    }

    _buildUrlObject(url, urlParams) {
        return {
            urlParams: urlParams,
            parsedUrl: url
        };
    }
};