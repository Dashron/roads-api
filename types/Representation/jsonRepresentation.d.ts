/**
 * jsonRepresentation.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes the JSONRepresentation class that adds some useful functionality for JSON resource representations
 *
 * todo: Woah buddy, this thing has some crazy generics going on. I'm sure it can be improved.
 */
import { JSONSchemaType, Options } from 'ajv';
import { ReadableRepresentation, WritableRepresentation } from './representation';
import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
interface JsonRepresentationDefaults<ModelsType, AuthType> {
    set: (models: ModelsType, requestBody: unknown, auth: AuthType, key?: string) => void;
    resolve: (models: ModelsType, auth: AuthType, key?: string) => unknown;
}
interface NestedRequestObject {
    [x: string]: unknown;
}
interface SchemaProperties {
    [x: string]: SomeJSONSchema;
}
export interface ResolveArrayItems {
    (models: unknown, auth: unknown): Array<unknown>;
}
/**
 *
 *
 * @todo thorough examples of the representation format
 * @todo tests
*/
export default abstract class JSONRepresentation<ModelsType, ReqBodyType, AuthType> implements ReadableRepresentation<ModelsType, AuthType>, WritableRepresentation<ModelsType, ReqBodyType, AuthType> {
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
    init(schema: JSONRepresentation<ModelsType, ReqBodyType, AuthType>['schema'], schemaValidatorOptions?: Options, defaults?: JsonRepresentationDefaults<ModelsType, AuthType>): void;
    /**
     *
     * @returns {object} The schema passed to the constructor
     */
    getSchema(): JSONRepresentation<ModelsType, ReqBodyType, AuthType>['schema'];
    /**
     * Receives models and auth, and returns the appropriate JSON representation
     *
     * @param {*} models
     * @param {*} auth
     * @param {boolean} stringify
     * @returns {*} The JSON representation for these models. Stringified if stringify=true
     */
    render(models: ModelsType, auth: AuthType, stringify?: boolean): string;
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
    protected renderSchema(schema: SomeJSONSchema, models: ModelsType, auth: AuthType, key?: string): unknown;
    protected canBeRendered(schema: SomeJSONSchema): boolean;
    /**
     * Turns an array of models into a JSON representation
     *
     * @param {object} schemaItems
     * @param {Array<object>} modelItems
     * @param {any} auth
     * @returns {array<object>} An array representation of the provided models
     */
    protected renderSchemaArray(schemaRepresentation: JSONRepresentation<ModelsType, ReqBodyType, AuthType>, modelItems: Array<ModelsType>, auth: AuthType): Array<unknown>;
    /**
     * Turns an object into a JSON representation
     *
     * @param {object} properties
     * @param {object} models
     * @param {any} auth
     * @returns {object} An object representation of the provided models
     */
    protected renderSchemaProperties(properties: SchemaProperties, models: ModelsType, auth: AuthType): {
        [x: string]: unknown;
    };
    /**
     * Ensure the JSON can be parsed, and then validate it against the JSON schema.
     * If everything works out, the request body is replaced with the final,
     * parsed, validated (and possibly sanitized) input
     *
     * @param {*} options
     * @todo should this set the request body back into the representation, or just return it, or both?
     */
    parseInput(requestBody: string): Promise<unknown>;
    /**
     * Applies the edit requests in the request body to the provided models.
     * The requests are applied via the rules defined in the "set" methods associated with each representation property
     *
     * @param {*} models
     * @param {*} auth
     */
    applyEdit(requestBody: ReqBodyType, models: ModelsType, auth: AuthType): void;
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
    protected applyRequest(schema: SomeJSONSchema, requestBody: ReqBodyType, models: ModelsType, auth: AuthType, key?: string): void;
    protected _applyRequest(schema: JSONSchemaType<ReqBodyType> | SomeJSONSchema, requestBody: unknown, models: ModelsType, auth: AuthType, key?: string): void;
    protected canBeEdited(schema: SomeJSONSchema): boolean;
    /**
     * Applies the edit requests in the provided object to the models based on the set methods in the properties
     *
     * @param {object} properties
     * @param {object} requestBody
     * @param {*} models
     * @param {*} auth
     */
    protected applyRequestProperties(schemaProperties: SchemaProperties, requestBody: NestedRequestObject, models: ModelsType, auth: AuthType): void;
}
export {};
