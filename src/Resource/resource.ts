/**
 * resource.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */

import authParser from './authParser';
import { parse as parseContentType } from 'content-type';
import * as Accept from '@hapi/accept';
import validateObj from '../core/objectValidator';
import { Response } from 'roads';

import {
	URLSearchParams,
	URL
} from 'url';

import {
	METHOD_GET,
	METHOD_PUT,
	METHOD_POST,
	METHOD_PATCH,
	METHOD_DELETE,
	HEADER_CONTENT_TYPE,
	HEADER_AUTHORIZATION,
	HEADER_ACCEPT
} from '../core/constants';

import {
	UnauthorizedError,
	NotAcceptableError,
	InputValidationError,
	UnsupportedMediaTypeError,
	MethodNotAllowedError,
	HTTPError
} from '../core/httpErrors';

import { WritableRepresentation, ReadableRepresentation } from '../Representation/representation';
import { IncomingHeaders } from 'roads/types/core/road';
import { JSONSchemaType } from 'ajv';

const globalDefaults: { [action: string]: ActionConfig } = {
	get: {
		method: METHOD_GET,
		status: 200,
		requestMediaTypes: {},
		allowRequestBody: false
	},
	append: {
		method: METHOD_POST,
		status: 201,
		requestMediaTypes: {},
		allowRequestBody: true
	},
	submit: {
		method: METHOD_POST,
		status: 201,
		requestMediaTypes: {},
		allowRequestBody: true
	},
	fullReplace: {
		method: METHOD_PUT,
		status: 200,
		requestMediaTypes: {},
		allowRequestBody: true
	},
	partialEdit: {
		method: METHOD_PATCH,
		status: 200,
		requestMediaTypes: {},
		allowRequestBody: true
	},
	delete: {
		method: METHOD_DELETE,
		status: 204,
		requestMediaTypes: {},
		allowRequestBody: true
	}
};

interface RequestMediaTypeList<ModelsType, ReqBodyType, AuthType> {
	[type: string]: WritableRepresentation<ModelsType, ReqBodyType, AuthType>
}

interface ResponseMediaTypeList<ModelsType, AuthType> { [type: string]: ReadableRepresentation<ModelsType, AuthType> }

interface AuthScheme<AuthType> {
	(parameters: unknown): AuthType
}

interface AuthSchemeList<AuthType> { [scheme: string]: AuthScheme<AuthType> }

export interface ActionConfig {
	method?: string,
	status?: number,
	requestMediaTypes?: RequestMediaTypeList<unknown, unknown, unknown>,
	allowRequestBody?: boolean,
	defaultResponseMediaType?: string,
	responseMediaTypes?: ResponseMediaTypeList<unknown, unknown>,
	defaultRequestMediaType?: string,
	authRequired?: boolean,
	authSchemes?: AuthSchemeList<unknown>
}

export interface ActionList {
	[action: string]: Action<unknown, unknown, unknown>;
}

export interface Action<ModelsType, ReqBodyType, AuthType> {
	(models: ModelsType,
		requestBody: ReqBodyType, requestMediaHandler: WritableRepresentation<ModelsType, ReqBodyType, AuthType> | undefined,
		requestAuth?: AuthType): Promise<unknown> | void
}

export interface ParsedURLParams {[x: string]: string | number}

/*export function updateGlobalDefaults(action: string, key: string, value: any) {
	if (!globalDefaults[action]) {
		globalDefaults[action] = {};
	}

	// TODO: GET THIS WORKING. ADD TESTS. ALLOW SETTING A DEFAULT EXECUTION FUNCTION.
	globalDefaults[action][key] = value;
}*/

function getSingleHeader(headers: string | Array<string> | undefined): string | undefined{
	if (Array.isArray(headers)) {
		return headers[0];
	}

	return headers;
}

export default abstract class Resource<ModelsType, ReqBodyType, SearchType, AuthType> {
	protected actionConfigs: {[action: string]: ActionConfig}
	protected searchSchema: JSONSchemaType<SearchType>;
	protected requiredSearchProperties?: Array<string>;
	protected abstract modelsResolver(
		urlParams: ParsedURLParams | undefined, searchParams: URLSearchParams | undefined,
		action: keyof ActionList, pathname: string, requestAuth: AuthType | null): ModelsType;

	protected actions: ActionList = {};

	/**
	 * Creates an instance of Resource.
	 *
	 * @todo it would be cool if we could expose "expected url parameters" in a way that
	 * 		slots well with the router and raises warnings
	 * @param {object} configDefaults
	 * @param {array<string>} supportedActions
	 */
	constructor () {
		this.actionConfigs = {};
	}

	/**
	 *
	 * @param name
	 * @param action
	 * @param config
	 */
	addAction (name: keyof ActionList, action: Action<ModelsType, ReqBodyType, AuthType>, config: ActionConfig = {}): void {
		this.actionConfigs[name] = config;
		this.actions[name] = action;
	}

	/**
	 * Sets the schema of the query parameters this resource accepts
	 *
	 * @param {object} schema
	 * @param {array} requiredProperties
	 * @todo: json schema type
	 */
	setSearchSchema (schema: JSONSchemaType<SearchType>, requiredProperties?: Array<string>): void {
		this.searchSchema = schema;
		this.requiredSearchProperties = requiredProperties;
	}

	/**
	 * Performs your API action for a specific HTTP request on this resource
	 *
	 * @param {string} method HTTP Method
	 * @param {URL} urlObject This should be the standard URL object. Search params are located here.
	 * @param {object} urlParams This should be an object containing all parameter parts of the url.
	 * @param {string} requestBody This should be a string representation of the request body.
	 * @param {object} requestHeaders This should be an object containing all request headers.
	 */
	async resolve (
		method: string, urlObject: URL, urlParams?: ParsedURLParams,
		requestBody?: string, requestHeaders: IncomingHeaders = {}): Promise<Response> {

		try {
			const action = this.getActionForMethod(method);

			if (!action || typeof(this.actions[action]) !== 'function') {
				throw new MethodNotAllowedError(this.getValidMethods());
			}

			/*
			 * Identify authentication information so we can provide it to all further actions
			 * If the authentication credentials are valid, the API developer should assume that
			 * they can do whatever they want with the result of getModels, and assume that
			 * the action and representation will receive those models untouched.
			 *
			 * If the credentials are not provided, the client should return "null"
			 * If the credentials are invalid, the client should throw an error (TODO: What error?)
			 */
			const requestAuth = await this.getAuth(requestHeaders[HEADER_AUTHORIZATION],
				this.getActionConfig(action, 'authRequired') as boolean,
				this.getActionConfig(action, 'authSchemes') as AuthSchemeList<AuthType>);

			let parsedRequestBody: unknown;
			let requestMediaHandler: WritableRepresentation<ModelsType, ReqBodyType, AuthType> | undefined = undefined;

			if (requestBody && this.getActionConfig(action, 'allowRequestBody')) {
				/*
				* Identify the proper request representation from the accept header
				*/
				requestMediaHandler = this.getRequestMediaHandler(getSingleHeader(requestHeaders[HEADER_CONTENT_TYPE]),
					this.getActionConfig(action, 'defaultRequestMediaType') as string,
					this.getActionConfig(action, 'requestMediaTypes') as
						RequestMediaTypeList<ModelsType, ReqBodyType, AuthType>);

				parsedRequestBody = await requestMediaHandler.parseInput(requestBody);
			} else {
				/*
				* Here's a safe short cut if we want the request to still work even though we
				* can't locate a proper requestRepresentation. In the current code this might
				* never happen, but I put it here so I don't forget if we want it in the future
				*/
				parsedRequestBody = undefined;
			}

			/*
			 * Initates the validation of the query parameters, and if valid sends those parameters
			 * 		to this resources "modelsResolver" function.
			 */
			await this.validateSearchParams(urlObject.searchParams);
			/*
			 * Locte a collection of models for this request. These models are provided to the action, and
			 * 		are not manipulated in any way by this framework.
			 * The API developer should assume that they can do whatever they want with provided models
			 */
			// TODO: the order of these params are strange. this could use cleanup.
			const models = await this.modelsResolver(
				urlParams, urlObject.searchParams, action, urlObject.pathname, requestAuth);

			/*
			 * Find the appropriate resource representation for this resource, and the client's request
			*/
			const acceptedContentType = Accept.charset(
				getSingleHeader(requestHeaders[HEADER_ACCEPT]) ||
					this.getActionConfig(action, 'defaultResponseMediaType') as string,
				Object.keys(this.getActionConfig(action, 'responseMediaTypes') as
					ResponseMediaTypeList<ModelsType, AuthType>));

			const responseMediaHandler = this.getResponseMediaHandler(
				acceptedContentType, this.getActionConfig(action, 'responseMediaTypes') as
					ResponseMediaTypeList<ModelsType, AuthType>);

			/**
			 * Perform the HTTP action and get the response
			 */
			await this.actions[action](models, parsedRequestBody, requestMediaHandler, requestAuth);
			// todo: find a less janky way to handle this method===delete response handler
			return new Response(
				method === METHOD_DELETE ? '' : responseMediaHandler.render(models, requestAuth, true),
				this.getActionConfig(action, 'status') as number, {
					'content-type': acceptedContentType
				});
		} catch (e) {
			return this.buildErrorResponse(e);
		}
	}

	/**
	 * Find the appropriate resource action for this HTTP method
	 *
	 * @param {string} method
	 */
	getActionForMethod(method: string): string | undefined {
		for (const action in this.actionConfigs) {
			if (this.getActionConfig(action, 'method') === method) {
				return action;
			}
		}
	}

	/**
	 * Find all methods that have been enabled for this resource
	 */
	getValidMethods(): Array<string> {
		const validMethods: Array<string> = [];

		for (const action in this.actionConfigs) {
			if (this.actions[action]) {
				validMethods.push(this.getActionConfig(action, 'method') as string);
			}
		}

		return validMethods;
	}

	/**
	 * Find a configuration setting for an action.
	 * If there is not one explicitly set, it checks the cross-action config defaults configured via the resource constructor
	 * If there is not one in the cross-action config defaults it checks global defaults
	 *
	 * @todo I hate this. Ideally we could have the config value checking happen in the IDE thanks to typescript
	 * @param {string} action
	 * @param {string} field
	 */
	protected getActionConfig (action: keyof ActionList, field: keyof ActionConfig): unknown {
		if (typeof(this.actionConfigs[action][field]) !== 'undefined') {
			return this.actionConfigs[action][field];
		}

		// roads defaults for global defaults on a per-action basis
		if (typeof(globalDefaults[action][field]) !== 'undefined') {
			return globalDefaults[action][field];
		}

		throw new Error(`${this.constructor.name
		} has attempted to access a missing config value for the action ${
			action  } and the field ${  field
		}. There is no default for this config, so you must provide it manually when invoking addAction.`);
	}

	/**
	 * This will parse the authorization header and send the resulting data
	 * into the configured authResolvers.
	 *
	 * A clients authResolver should return null if the user is unauthenticated  (TODO: What error?)
	 * A clients authResolver should throw an error if the credentials are not valid
	 *
	 * This method will throw an error if the resource is configured to require authentication (via authRequired),
	 * 		and the user is unauthenticated
	 *
	 * @param {string} authorizationHeader
	 * @param {boolean} authRequired
	 * @param {array<string>} validSchemes
	 * @returns
	 */
	protected async getAuth(
		authorizationHeader: string | Array<string> | undefined,
		authRequired: boolean, authSchemes: AuthSchemeList<AuthType>): Promise<AuthType | null> {

		let auth = null;

		// If this resource requires authentication, we enforce that behavior here
		if (!authorizationHeader) {
			if (!authRequired) {
				return null;
			}

			throw new UnauthorizedError('Authorization required', Object.keys(authSchemes)[0]);
		}

		// parse the auth header and validate the format (e.g. parse basic auth into username & password)
		const {
			scheme,
			parameters
		} = authParser(authorizationHeader, Object.keys(authSchemes));

		auth = await authSchemes[scheme](parameters);

		// If we have auth details, return it
		if (auth !== null && auth != undefined) {
			return auth;
		}

		// If we have no auth, and it's not required, return null
		if (!authRequired) {
			return null;
		}

		// if we have no auth and it's required, we fall through to the UnauthorizedError
		throw new UnauthorizedError('Unsupported authorization scheme', Object.keys(authSchemes)[0]);
	}

	/**
	 * Returns the proper representation requested by the client via the accept header
	 *
	 * @param {*} acceptHeader
	 * @param {*} representations
	 * @param {*} defaultMediaType
	 */
	protected getResponseMediaHandler(
		acceptedContentType: string | Array<string> | undefined,
		representations: ResponseMediaTypeList<ModelsType, AuthType> ): ReadableRepresentation<ModelsType, AuthType> {

		// We only work with one response media type, there shouldn't be an array of values here.
		if (acceptedContentType && typeof acceptedContentType === 'string' && representations[acceptedContentType]) {
			return representations[acceptedContentType];
		}

		throw new NotAcceptableError('No acceptable media types for this resource.');
	}

	/**
	 * Returns the proper representation provided by the client, as defined by it's contentType
	 *
	 * @param {*} contentType
	 * @param {*} defaultContentType
	 * @param {*} representations
	 */
	protected getRequestMediaHandler(contentTypeHeader: string | undefined,
		defaultContentType: string,
		representations: RequestMediaTypeList<ModelsType, ReqBodyType, AuthType>):
			WritableRepresentation<ModelsType, ReqBodyType, AuthType> {

		const parsedContentType = parseContentType(contentTypeHeader || defaultContentType);

		if (parsedContentType.type && representations[parsedContentType.type]) {
			return representations[parsedContentType.type];
		}

		throw new UnsupportedMediaTypeError('This media type is not supported on this endpoint.');
	}

	/**
	 * Ensures that the search parameters in the request uri match this resources searchSchema
	 * @param {*} searchParams
	 */
	protected async validateSearchParams(searchParams: URLSearchParams): Promise<unknown> {

		const params: {[x: string]: string | Array<string>} = {};

		for (const key of searchParams.keys()) {
			if (params[key]) {
				// the keys function will list duplicate params more than once
				// But URLSearchParams.getAll finds every value for a key
				// So we don't need to process a single key more than once
				// This continue skips keys that we have already handled.
				continue;
			}

			params[key] = searchParams.getAll(key);
			if (params[key].length === 1) {
				params[key] = params[key][0];
			}
		}

		try {
			return await validateObj(params, this.searchSchema,
				this.requiredSearchProperties ? this.requiredSearchProperties : []);
		} catch (e) {
			if (!(e instanceof InputValidationError)) {
				throw new InputValidationError('Invalid Search Query', [e.message]);
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
	protected  buildErrorResponse(e: unknown): Response {
		if (e instanceof HTTPError) {
			return e.toResponse();
		}

		console.error(e);
		return new Response('Unknown error. Please check your logs', 500);
	}
}
