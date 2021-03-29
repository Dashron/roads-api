/**
 * objectValidator.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */
import AJV, { JSONSchemaType } from 'ajv';

import { InputValidationError } from './httpErrors';

function buildSchema<T>(propertiesSchema: JSONSchemaType<T>, requiredProperties: Array<string>) {
	const schema: {
		type: string,
		properties: JSONSchemaType<T>,
		additionalProperties: boolean,
		required?: Array<string>
	} = {
		type: 'object',
		properties: propertiesSchema,
		additionalProperties: false
	};

	if (requiredProperties) {
		schema.required = requiredProperties;
	}

	return schema;
}

/**
 *
 * @param {*} propertiesSchema the "properties" section of a JSON schema document. Array or object subschemas will fail
 * @param {*} searchParams
 */
export default async function validateObject<T>(obj: unknown,
	propertiesSchema: JSONSchemaType<T>, requiredProperties: Array<string>): Promise<unknown> {

	const ajv = new AJV({ // todo: this ajv config should be somewhere else
		allErrors: true,
		verbose: true,
		removeAdditional: false,
		coerceTypes: true
	});

	const schema = buildSchema(propertiesSchema, requiredProperties);
	// todo: caching
	const compiledSchema = ajv.compile(schema);

	try {
		return await compiledSchema(obj);
	} catch(errors) {
		throw new InputValidationError('Invalid object', errors);
	}
}