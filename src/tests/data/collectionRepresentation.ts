import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import JSONRepresentation, { ResolveArrayItems } from '../../Representation/jsonRepresentation';

export default class CollectionRepresentation<ModelType, ReqBodyType, AuthType> extends
	JSONRepresentation<ModelType, ReqBodyType, AuthType> {

	constructor (
		action: string,
		itemRepresentation: JSONRepresentation<ModelType, ReqBodyType, AuthType>,
		resolveArrayItems: ResolveArrayItems) {

		super();

		// This is my preferred way of creating the collection representation. I don't like
		//		how I have to type it to SomeJSONSchema, but it works for now with minimal
		//		changes.
		this.init({
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: itemRepresentation.getSchema(),
					representation: itemRepresentation,
					resolveArrayItems: resolveArrayItems
				},
				perPage: {
					type: 'number',
					resolve: (models: {perPage: number}) => {
						return models.perPage;
					}
				},
				page: {
					type: 'number',
					resolve: (models: {page: number}) => {
						return models.page;
					}
				}
			},
			additionalProperties: false,
			required: []
		} as SomeJSONSchema);

		// This technically should work, not sure why it doesn't.
		/* Error
		(property) type: "array"
Argument of type '{ type: "object"; properties: { data: { type: "array"; items: { $ref: string; };
		representation: JSONRepresentation<ModelType, ReqBodyType, AuthType>;
		resolveArrayItems: ResolveArrayItems<...>; }; perPage: { ...; }; page: { ...; }; };
		additionalProperties: false; required: never[]; definitions: { ...; }; }' is not assignable
		to parameter of type 'SomeJSONSchema'.
  Types of property 'properties' are incompatible.
    Type '{ data: { type: "array"; items: { $ref: string; };
			representation: JSONRepresentation<ModelType, ReqBodyType, AuthType>;
			resolveArrayItems: ResolveArrayItems<...>; }; perPage: { ...; }; page: { ...; }; }'
			is not assignable to type 'Partial<PropertiesSchema<KnownRecord>>'.
      Property 'data' is incompatible with index signature.
        Type '{ type: "array"; items: { $ref: string; }; representation:
				JSONRepresentation<ModelType, ReqBodyType, AuthType>; resolveArrayItems: ResolveArrayItems<...>; }'
				is not assignable to type '{ $ref: string; } | (JSONSchemaType<Known, false> &
					{ const?: Known | undefined; enum?: readonly Known[] | undefined; default?: Known | undefined; })
					| undefined'.
          Type '{ type: "array"; items: { $ref: string; };
		  		representation: JSONRepresentation<ModelType, ReqBodyType, AuthType>; resolveArrayItems:
				  ResolveArrayItems<...>; }' is not assignable to type '{ type: ("string" | "number"
				  | "boolean" | "integer")[]; } & { [keyword: string]: any; $id?: string | undefined;
					$ref?: string | undefined; $defs?: { [x: string]: JSONSchemaType<Known, true> | undefined; }
					| undefined; definitions?: { ...; } | undefined; } & { ...; }'.
            Type '{ type: "array"; items: { $ref: string; }; representation:
					JSONRepresentation<ModelType, ReqBodyType, AuthType>; resolveArrayItems: ResolveArrayItems<...>; }'
					 is not assignable to type '{ type: ("string" | "number" | "boolean" | "integer")[]; }'.
              Types of property 'type' are incompatible.
                Type 'string' is not assignable to type '("string" | "number" | "boolean" | "integer")[]'.ts(2345)
		*/
		/*this.init({
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: {
						$ref: '#/definitions/arrayItems',
					},
					representation: itemRepresentation,
					resolveArrayItems: resolveArrayItems
				},
				perPage: {
					type: 'number',
					resolve: (models: {perPage: number}) => {
						return models.perPage;
					}
				},
				page: {
					type: 'number',
					resolve: (models: {page: number}) => {
						return models.page;
					}
				}
			},
			additionalProperties: false,
			required: [],
			definitions: {
				arrayItems: itemRepresentation.getSchema()
			}
		});*/

		// This seems to get closer to working, but still fails on type: array
		// Type 'string' is not assignable to type '("string" | "number" | "boolean" | "integer" | undefined)[]'.ts(2322)
		/*this.init({
			type: 'object',
			properties: {
				data: {
					$ref: '#/definitions/arrayData'
				},
				perPage: {
					type: 'number',
					resolve: (models: {perPage: number}) => {
						return models.perPage;
					}
				},
				page: {
					type: 'number',
					resolve: (models: {page: number}) => {
						return models.page;
					}
				}
			},
			additionalProperties: false,
			required: [],
			definitions: {
				arrayData: {
					type: 'array',
					items: itemRepresentation.getSchema(),
					representation: itemRepresentation,
					resolveArrayItems: resolveArrayItems
				}
			}
		});*/
	}
}