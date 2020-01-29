"use strict";
/**
 * objectValidator.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * 
 */

import Ajv from 'ajv';

import { InputValidationError } from './httpErrors';

function buildSchema(propertiesSchema: object, requiredProperties: Array<string>) {
    let schema: {
        $async: boolean,
        type: string,
        properties: object,
        additionalProperties: boolean,
        required?: Array<string>
    } = {
        $async: true,
        type: "object",
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
export default async function validateObject(obj: any, propertiesSchema: object, requiredProperties: Array<string>) {
    var ajv = new Ajv({ // todo: this ajv config should be somewhere else
        allErrors: true,
        verbose: true,
        async: "es7",
        removeAdditional: false,
        coerceTypes: true
    });

    let schema = buildSchema(propertiesSchema, requiredProperties);
    // todo: caching
    let compiledSchema = ajv.compile(schema);

    try {
        return await compiledSchema(obj);
    } catch(errors) {
        throw new InputValidationError('Invalid object', errors);
    }
}