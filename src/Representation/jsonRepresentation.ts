/**
 * jsonRepresentation.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes the JSONRepresentation class that adds some useful functionality for JSON resource representations
 *
 * todo: Woah buddy, this thing has some crazy generics going on. I'm sure it can be improved.
 */

import AJV, { _, KeywordCxt, JSONSchemaType, Options, ErrorObject } from 'ajv';
import { ValidationError, FieldError } from './validationError';
import { InvalidRequestError, HTTPError } from '../core/httpErrors';
import { ReadableRepresentation, WritableRepresentation } from './representation';
import { SomeJSONSchema } from 'ajv/dist/types/json-schema';

interface JsonRepresentationDefaults<ModelsType, AuthType> {
	set: (models: ModelsType, requestBody: unknown, auth: AuthType, key?: string) => void,
	resolve: (models: ModelsType, auth: AuthType, key?: string) => unknown
}

// TODO: I think we can improve this with generics
interface NestedRequestObject {[x: string]: unknown}
interface SchemaProperties {[x: string]: SomeJSONSchema}
export interface ResolveArrayItems {
	(models: unknown, auth: unknown): Array<unknown>
}
/**
 *
 *
 * @todo thorough examples of the representation format
 * @todo tests
*/
export default abstract class JSONRepresentation<ModelsType, ReqBodyType, AuthType> implements
	ReadableRepresentation<ModelsType, AuthType>, WritableRepresentation<ModelsType, ReqBodyType, AuthType> {

	protected schema: SomeJSONSchema;
	protected schemaValidatorOptions: Options;
	protected defaults?: JsonRepresentationDefaults<ModelsType, AuthType>;

	/**
	 *
	 * @param {object} schema - A JSONRepresentation schema.
	 * @param {object} schemaValidatorOptions - An object that is provided to the schema validation system to allow for easy
	 * 		expansion. See AJV's options for more details (https://github.com/epoberezkin/ajv#options).
	 * @param {object} defaults - An object that allows the implementor to provide some default functionality.
	 * 		Currently this supports a "set" and "resolve" fallback for schemas.
	 */
	init (
		schema: JSONRepresentation<ModelsType, ReqBodyType, AuthType>['schema'], schemaValidatorOptions?: Options,
		defaults?: JsonRepresentationDefaults<ModelsType, AuthType>): void {

		this.schema = schema;
		this.schemaValidatorOptions = schemaValidatorOptions || {};

		// These are important for some of the way we interact with AJV
		this.schemaValidatorOptions.allErrors = true;
		this.schemaValidatorOptions.verbose = true;
		// this.schemaValidatorOptions.async = "es7";
		this.schemaValidatorOptions.removeAdditional = 'failing';
		// this.schemaValidatorOptions.jsonPointers = true;

		// Fallbacks for various sections of the representation
		this.defaults = defaults;
	}

	/**
	 *
	 * @returns {object} The schema passed to the constructor
	 */
	getSchema(): JSONRepresentation<ModelsType, ReqBodyType, AuthType>['schema'] {
		return this.schema;
	}

	/**
	 * Receives models and auth, and returns the appropriate JSON representation
	 *
	 * @param {*} models
	 * @param {*} auth
	 * @param {boolean} stringify
	 * @returns {*} The JSON representation for these models. Stringified if stringify=true
	 */
	render (models: ModelsType, auth: AuthType, stringify = true): string {
		let output = this.renderSchema(this.getSchema(), models, auth);

		if (stringify) {
			output = JSON.stringify(output);
		}

		return String(output);
	}

	/**
	 * Turns models and auth into a JSON representation based on the resolve methods found in the provided schema
	 *
	 * @param {object} schema
	 * @param {*} models
	 * @param {*} auth
	 * @param {string} key this value is included when resolving fields
	 * @todo this is very similar to the applyEdit method, maybe we can merge them
	 * @todo schema type is invalid, it can be an array of types. Also it might interact weird with oneOf, allOf, etc.
	 * @returns {*} the JSON representation for the provided models
	 * @throws {Error} if the schema type is not understood by this library
	 */
	protected renderSchema (schema: SomeJSONSchema, models: ModelsType, auth: AuthType, key?: string): unknown {
		switch (schema.type) {
			case 'string':
			case 'number':
			case 'boolean':
			case undefined:
				// If the implementor has a resolve method on the schema, use that
				if (schema.resolve) {
					return schema.resolve(models, auth);
				// if there is no schema level resolve, but there's a default resolve, use that
				} else if (this.defaults && this.defaults.resolve) {
					return this.defaults.resolve(models, auth, key);
				// if no resolve function could be found, error
				} else {
					throw new Error('No resolver found for this schema');
				}
			case 'array':
				return this.renderSchemaArray(schema.representation, schema.resolveArrayItems(models, auth), auth);
			case 'object':
				return this.renderSchemaProperties(schema.properties, models, auth);
			default:
				throw new Error(`Unsupported schema type: ${  schema.type  } in schema ${  JSON.stringify(schema)}`);
		}
	}

	protected canBeRendered(schema: SomeJSONSchema): boolean {
		// we can render strings numbers and missing types if there is a resolve method
		return ((['string', 'number', 'boolean', undefined].indexOf(schema.type) >= 0) &&
			(schema.resolve !== undefined || (this.defaults !== undefined && this.defaults.resolve !== undefined))) ||
		// we can render array items if there is a resolveArrayItems method
			(schema.type === 'array' && schema.resolveArrayItems !== undefined) ||
		// we will attempt to render all objects
			(schema.type === 'object');
	}

	/**
	 * Turns an array of models into a JSON representation
	 *
	 * @param {object} schemaItems
	 * @param {Array<object>} modelItems
	 * @param {any} auth
	 * @returns {array<object>} An array representation of the provided models
	 */
	protected renderSchemaArray (
		schemaRepresentation: JSONRepresentation<ModelsType, ReqBodyType, AuthType>,
		modelItems: Array<ModelsType>, auth: AuthType): Array<unknown> {

		const items: Array<unknown> = [];

		modelItems.forEach((item) => {
			// Todo: should this be aware of the actual representation object of the schema items?
			items.push(schemaRepresentation.renderSchema(schemaRepresentation.getSchema(), item, auth));
		});

		return items;
	}

	/**
	 * Turns an object into a JSON representation
	 *
	 * @param {object} properties
	 * @param {object} models
	 * @param {any} auth
	 * @returns {object} An object representation of the provided models
	 */
	protected renderSchemaProperties (
		properties: SchemaProperties, models: ModelsType, auth: AuthType): {[x: string]: unknown} {

		const obj: {[x: string]: unknown} = {};

		for (const property in properties) {
			if (this.canBeRendered(properties[property])) {
				obj[property] = this.renderSchema(properties[property], models, auth, property);
			}
		}

		return obj;
	}

	/**
	 * Ensure the JSON can be parsed, and then validate it against the JSON schema.
	 * If everything works out, the request body is replaced with the final,
	 * parsed, validated (and possibly sanitized) input
	 *
	 * @param {*} options
	 * @todo should this set the request body back into the representation, or just return it, or both?
	 */
	async parseInput (requestBody: string): Promise<unknown> {
		let parsedBody = null;

		try {
			parsedBody = JSON.parse(requestBody);
		} catch (e) {
			// https://tools.ietf.org/html/rfc5789#section-2.2
			throw new InvalidRequestError('Invalid request body: Could not parse JSON request');
		}

		const ajv = new AJV(this.schemaValidatorOptions);

		// We want read only fields to be rejected on input, so we add custom validation
		ajv.addKeyword({
			keyword: 'roadsReadOnly',
			schemaType: 'boolean',
			code(cxt: KeywordCxt) {
				const { data } = cxt;
				cxt.fail(_`${data} != undefined`);
			} ,
		});

		// resolve and set are custom keywords we use with jsonrepresentations.
		// They are ignored by the schema validation, so we always assume they are valid
		// TODO: Can we use the validate methods here to execute the attached function?
		//		It would be cool if we could scrap all the traverisng logic and just use
		//		AJV to automatically run all resolve and set functions.
		ajv.addKeyword({
			keyword: 'resolve',
			schema: false,
			valid: true
		});

		ajv.addKeyword({
			keyword: 'set',
			schema: false,
			valid: true
		});

		const validate = ajv.compile(this.getSchema());
		let isValid = false;

		// If async, then is the data, err is a ajv.ValidationError
		if (this.getSchema().$async) {
			try {
				return await validate(parsedBody);
			} catch(errors) {
				throw new ValidationError('Invalid request body', errors);
			}
		// When not async, validate returns a boolean and we want to return the original data
		// Errors also need to be formatted properly
		} else {
			isValid = validate(parsedBody);

			if (!isValid) {
				if (!validate.errors) {
					throw new Error('AJV Interface has likely changed. ' +
						'Please check to see how synchronous errors are reported');
				}

				// https://tools.ietf.org/html/rfc5789#section-2.2
				const errors: Array<HTTPError> = [];

				validate.errors.forEach((error: ErrorObject) => {
					// if the error is a missing required field, we don't have a data path.
					//		The conditional below changes that to the value located in
					let instancePath = error.instancePath;

					if (error.keyword === 'required') {
						instancePath += `/${  error.params.missingProperty}`;
					}

					errors.push(new FieldError(error.message ?
						error.message : 'Could not determine error message as a part of schema validation', instancePath));
				});

				throw new ValidationError('Invalid request body', errors);
			}

			return parsedBody;
		}
	}

	/**
	 * Applies the edit requests in the request body to the provided models.
	 * The requests are applied via the rules defined in the "set" methods associated with each representation property
	 *
	 * @param {*} models
	 * @param {*} auth
	 */
	applyEdit (requestBody: ReqBodyType, models: ModelsType, auth: AuthType): void {
		this.applyRequest(this.getSchema(), requestBody, models, auth);
	}

	/**
	 * Applies the edit requests in the request body to the provided models.
	 * The requests are applied via the rules defined in the "set" methods associated with each representation property
	 *
	 * @param {*} schema
	 * @param {*} requestBody
	 * @param {*} models
	 * @param {*} auth
	 * @todo this is very similar to the render method, maybe we can merge them
	 * @todo schema type is invalid, it can be an array of types. Also it might interact weird with oneOf, allOf, etc.
	 */
	protected applyRequest (
		schema: SomeJSONSchema,
		requestBody: ReqBodyType, models: ModelsType, auth: AuthType, key?: string): void {

		return this._applyRequest(schema, requestBody, models, auth, key);
	}

	protected _applyRequest (
		schema: JSONSchemaType<ReqBodyType> | SomeJSONSchema,
		requestBody: unknown, models: ModelsType, auth: AuthType, key?: string): void {

		if (typeof(requestBody) === 'undefined') {
			return;
		}

		switch (schema.type) {
			case 'string':
			case 'number':
			case 'boolean':
			case undefined:
				// If the implementor has a set method on the schema, use that
				if (schema.set) {
					return schema.set(models, requestBody, auth);
				// if there is no schema level set, but there's a default set, use that
				} else if (this.defaults && this.defaults.set) {
					return this.defaults.set(models, requestBody, auth, key);
				// if no set function could be found, error
				} else {
					throw new Error('No set found for this schema');
				}
				schema;
				break;
			case 'array':
				throw new Error('Arrays are yet supported in input schemas');
				//return this._renderSchemaArray(schema.items, schema.resolveArrayItems(models, auth), auth);
			case 'object':
				// Because of the JSON Schema Validation, we know this is going to be an object.
				this.applyRequestProperties(schema.properties, requestBody as {[x: string]: unknown}, models, auth);
				break;
			default:
				throw new Error(`Unsupported schema type: ${  schema.type  } in schema ${  JSON.stringify(schema)}`);
		}
	}

	// this is very similar to the render method, maybe we can merge them
	/*_applySchemaArray (schemaItems, modelItems) {
		let items = [];

		modelItems.forEach((item) => {
			items.push(schemaItems.resolve(item));
		});

		return items;
	}*/

	// eslint-disable-next-line @typescript-eslint/ban-types
	protected canBeEdited(schema: SomeJSONSchema): boolean {
		return ['string', 'number', 'boolean', undefined].includes(schema.type) &&
			(schema.set !== undefined || (this.defaults !== undefined && this.defaults.set !== undefined)) ||
			schema.type === 'object';
	}

	/**
	 * Applies the edit requests in the provided object to the models based on the set methods in the properties
	 *
	 * @param {object} properties
	 * @param {object} requestBody
	 * @param {*} models
	 * @param {*} auth
	 */
	protected applyRequestProperties (
		schemaProperties: SchemaProperties, requestBody: NestedRequestObject, models: ModelsType, auth: AuthType): void {

		for (const property in schemaProperties) {
			if (this.canBeEdited(schemaProperties[property])) {
				this._applyRequest(
					schemaProperties[property],
					requestBody[property], models, auth, property);
			}
		}
	}
}
