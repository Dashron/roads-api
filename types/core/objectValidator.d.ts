import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
export interface SchemaProperties {
    [x: string]: SomeJSONSchema;
}
/**
 *
 * @param {*} propertiesSchema the "properties" section of a JSON schema document. Array or object subschemas will fail
 * @param {*} searchParams
 */
export default function validateObject(obj: unknown, propertiesSchema: SchemaProperties, requiredProperties: Array<string>): Promise<boolean>;
