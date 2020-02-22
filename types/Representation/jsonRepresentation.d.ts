/**
 * jsonRepresentation.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes the JSONRepresentation class that adds some useful functionality for JSON resource representations
 */
import * as AJV from 'ajv';
import { ReadableRepresentation, WritableRepresentation } from './representation';
interface JsonRepresentationDefaults {
    set: (models: any, requestBody: any, auth: any, key?: string) => void;
    resolve: (models: any, auth: any, key?: string) => any;
}
declare type RenderFunction = (item: object, auth: any, stringify: boolean) => string | object;
export declare type JSONSchema = {
    [x: string]: any;
    properties?: JSONSchemaProperties;
};
export declare type JSONSchemaProperties = {
    [x: string]: JSONSchema;
};
/**
 *
 *
 * @todo thorough examples of the representation format
 * @todo tests
*/
export default abstract class JSONRepresentation implements ReadableRepresentation, WritableRepresentation {
    protected schema: JSONSchema;
    protected schemaValidatorOptions: AJV.Options;
    protected defaults?: JsonRepresentationDefaults;
    /**
     *
     * @param {object} schema - A JSONRepresentation schema.
     * @param {object} schemaValidatorOptions - An object that is provided to the schema validation system to allow for easy expansion. See AJV's options for more details (https://github.com/epoberezkin/ajv#options).
     * @param {object} defaults - An object that allows the implementor to provide some default functionality. Currently this supports a "set" and "resolve" fallback for schemas.
     */
    init(schema: JSONSchema, schemaValidatorOptions?: AJV.Options, defaults?: JsonRepresentationDefaults): void;
    /**
     *
     * @returns {object} The schema passed to the constructor
     */
    getSchema(): JSONSchema;
    /**
     * Receives models and auth, and returns the appropriate JSON representation
     *
     * @param {*} models
     * @param {*} auth
     * @param {boolean} stringify
     * @returns {*} The JSON representation for these models. Stringified if stringify=true
     */
    render(models: any, auth: any, stringify?: boolean): any;
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
    protected renderSchema(schema: JSONSchema, models: object, auth: any, key?: string): any;
    protected canBeRendered(schema: JSONSchema): boolean;
    /**
     * Turns an array of models into a JSON representation
     *
     * @param {object} schemaItems
     * @param {Array<object>} modelItems
     * @param {any} auth
     * @returns {array<object>} An array representation of the provided models
     */
    protected renderSchemaArray(schemaItems: {
        render: RenderFunction;
    }, modelItems: Array<object>, auth: any): Array<object>;
    /**
     * Turns an object into a JSON representation
     *
     * @param {object} properties
     * @param {object} models
     * @param {any} auth
     * @returns {object} An object representation of the provided models
     */
    protected renderSchemaProperties(properties: JSONSchemaProperties, models: object, auth: any): object;
    /**
     * Ensure the JSON can be parsed, and then validate it against the JSON schema.
     * If everything works out, the request body is replaced with the final,
     * parsed, validated (and possibly sanitized) input
     *
     * @param {*} options
     * @todo should this set the request body back into the representation, or just return it, or both?
     */
    parseInput(requestBody: string): Promise<any>;
    /**
     * Applies the edit requests in the request body to the provided models.
     * The requests are applied via the rules defined in the "set" methods associated with each representation property
     *
     * @param {*} models
     * @param {*} auth
     */
    applyEdit(requestBody: any, models: object, auth: any): void;
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
    protected applyRequest(schema: JSONSchema, requestBody: any, models: object, auth: any, key?: string): any;
    protected canBeEdited(schema: JSONSchema): any;
    /**
     * Applies the edit requests in the provided object to the models based on the set methods in the properties
     *
     * @param {object} properties
     * @param {object} requestBody
     * @param {*} models
     * @param {*} auth
     */
    protected applyRequestProperties(properties: JSONSchemaProperties, requestBody: any, models: object, auth: any): void;
}
export {};
