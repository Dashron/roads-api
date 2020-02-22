/**
 *
 * @param {*} propertiesSchema the "properties" section of a JSON schema document. Array or object subschemas will fail
 * @param {*} searchParams
 */
export default function validateObject(obj: any, propertiesSchema: object, requiredProperties: Array<string>): Promise<any>;
