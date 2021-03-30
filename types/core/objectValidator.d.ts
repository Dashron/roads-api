/**
 * objectValidator.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */
import { JSONSchemaType } from 'ajv';
/**
 *
 * @param {*} propertiesSchema the "properties" section of a JSON schema document. Array or object subschemas will fail
 * @param {*} searchParams
 */
export default function validateObject<T>(obj: unknown, propertiesSchema: JSONSchemaType<T>, requiredProperties: Array<string>): Promise<unknown>;
