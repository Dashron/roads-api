/**
 * router.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */

import { URL } from 'url';
import uriTemplate = require('uri-templates');
import validateObj from './objectValidator';
import { InputValidationError, NotFoundError } from './httpErrors';
import Resource from '../Resource/resource';
import { IncomingHeaders, Middleware } from 'roads/types/core/road';
import { JSONSchemaType } from 'ajv';

/**
 * This is an interesting one. So the uri-templates fromURI function will return an empty string in the following case
 *
 * template("/posts/{post_id}").fromUri("/posts/")
 *
 * becasue it assumes post_id is just an empty string. We want to remove this key for our schema validation processes
 * so we rewrite the object here.
 *
 * This only handles the top level of parameters, because uri template won't have sub params.
 * It will not navigate into arrays and replace individual values.
 * This means that the following example will have one empty string value in the array
 *
 * template("{/id*}").fromUri("/posts//");
 *
 * @param {object} obj
 */
function delEmptyString(obj: {[x: string]: unknown} | undefined) {
	for (const key in obj) {
		if (obj[key] === '') {
			delete obj[key];
		}
	}

	return obj;
}

interface RouteConfig {
	urlParams: {
		schema: JSONSchemaType<unknown>,
		required?: Array<string>
	}
}

interface Route<ModelsType, ReqBodyType, AuthType> {
	compiledTemplate: uriTemplate.URITemplate,
	config?: RouteConfig,
	resource: Resource<ModelsType, ReqBodyType, AuthType>
}

export default class Router {
	protected routes: Array<Route<unknown, unknown, unknown>>;

	constructor () {
		this.routes = [];
	}

	/**
	 * Assign a resource to a URI template for the middleware, or locateResource method to locate in the future
	 *
	 * @param {string} template URI template
	 * @param {Resource} resource Resource object
	 * @param {object} config Additional configuration for this route. Currently supports a urlParams object
	 * 		with "schema" and "required" properties. These properties are used alongside the standard
	 * 		objectValidator to validate any URI params.
	 */
	addResource<ModelsType, ReqBodyType, AuthType>(
		template: string, resource: Resource<ModelsType, ReqBodyType, AuthType>, config?: RouteConfig): void {

		const route: Route<ModelsType, ReqBodyType, AuthType> = {
			compiledTemplate: uriTemplate(template),
			config: config,
			resource: resource
		};

		this.routes.push(route);
	}

	/**
	 * Attempts to locate a resource for the provided url.
	 * @param {string} url - a URL object
	 * @throws {TypeError} if the URI is not a valid URL
	 * @throws {InputValidationError} if we located a matching route, but the urls uri params did not match the url schema
	 * @return An object with two properties. Resource, which is the relevant Resource object for this route.
	 * 		urlParams which is an object containing all the url params and values in url.
	 */
	async locateResource(url: URL):
		Promise<false | { resource: Resource<unknown, unknown, unknown>, urlParams: {[key: string]: string}}> {

		let urlParams = null;

		for(let i = 0; i < this.routes.length; i++) {
			urlParams = this.routes[i].compiledTemplate.fromUri(url.pathname);

			const config = this.routes[i].config;

			if (config && config.urlParams) {
				try {
					await validateObj(delEmptyString(urlParams), config.urlParams.schema,
						config.urlParams.required ? config.urlParams.required  : []);
				} catch (e) {
					if (e instanceof InputValidationError) {
						// If the fields aren't valid, this route isn't a match. We might have another match down the chain.
						continue;
					}

					throw e;
				}
			}

			if (typeof(urlParams) === 'object') {
				return {
					resource: this.routes[i].resource,
					urlParams: urlParams
				};
			}
		}

		return false;
	}

	middleware (protocol: string, hostname: string): Middleware {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const router = this;
		const middleware: Middleware = async function (
			requestMethod: string, requestUrl: string, requestBody: string, requestHeaders: IncomingHeaders) {

			const fullRequestUrl = new URL(protocol + hostname + requestUrl);

			const routeResponse = await router.locateResource(fullRequestUrl);

			if (!routeResponse) {
				// Currently the roads and roads-api response objects are different, so we have to do this jank.
				// todo: share responses (or maybe all errors) across both projects
				// todo: maybe this should just return, and let followup middleware handle missed routes?
				const apiResponse = (new NotFoundError('Not Found')).toResponse();
				return new this.Response(apiResponse.body, apiResponse.status, apiResponse.headers);
			}

			const response = await routeResponse.resource.resolve(
				requestMethod, fullRequestUrl, routeResponse.urlParams, requestBody, requestHeaders);

			return new this.Response(response.body, response.status, response.headers);
		};

		return middleware;
	}
}