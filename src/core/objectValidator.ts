/**
 * objectValidator.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */
import AJV from 'ajv';
import { SomeJSONSchema } from 'ajv/dist/types/json-schema';

import { InputValidationError } from './httpErrors';

export interface SchemaProperties {
	[x: string]: SomeJSONSchema
}

function buildSchema(propertiesSchema: SchemaProperties, requiredProperties: Array<string>) {
	const schema: {
		type: string,
		properties: SchemaProperties,
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
export default async function validateObject(obj: unknown,
	propertiesSchema: SchemaProperties, requiredProperties: Array<string>): Promise<boolean> {

	const ajv = new AJV({ // todo: this ajv config should be somewhere else
		allErrors: true,
		verbose: true,
		removeAdditional: false,
		coerceTypes: true
	});

	const schema = buildSchema(propertiesSchema, requiredProperties);
	// todo: caching
	const compiledSchema = ajv.compile(schema);

	let isValid = false;

	try {
		isValid = await compiledSchema(obj);
	} catch(errors) {
		throw new InputValidationError('Invalid object', errors);
	}

	if (!isValid) {
		throw new InputValidationError('Invalid object', compiledSchema.errors ? compiledSchema.errors : undefined);
	} else {
		return true;
	}
}