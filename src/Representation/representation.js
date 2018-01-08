"use strict";

const {
    InvalidRequestError
} = require('../httpErrors.js');

class ValidationError extends InvalidRequestError {
    constructor(message, fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }
}

let Representation = module.exports.Representation = class Representation {
    constructor (translator) {
        // function with two params, models and auth.
        this._translator = translator;
    }

    render (models, auth)  {
        return this._translator(models, auth)
    }
};

module.exports.JSONRepresentation = class JSONRepresentation extends Representation {
    constructor (schema) {
        super((models, auth) => {
            return this._renderSchema(this._schema, models, auth)
        });

        this._schema = schema;
    }

    _renderSchema(schema, models, auth) {
        // todo: this is invalid, it can be an array of types. Also it might interact weird with oneOf, allOf, etc.
        switch (schema.type) {
            case "string":
            case "number":
            case "null":
            case "boolean":
                return schema.resolve(models, auth);
            case "array":
                return this._renderSchemaArray(schema.items, schema.resolveArray(models, auth), auth);
            case "object":
                return this._renderSchemaProperties(schema.properties, models, auth);
            default:
                throw new Error('Unsupported schema type');
        }
    }

    _renderSchemaArray(schemaItems, modelItems, auth) {
        let items = [];

        modelItems.forEach((item) => {
            items.push(schemaItems.resolve(item));
        });

        return items;
    }

    _renderSchemaProperties(properties, models, auth) {
        let obj = {};

        for (let property in properties) {
            obj[property] = this._renderSchema(properties[property], models, auth);
        }

        return obj;
    }

    async validateInput(requestBody) {
        var Ajv = require('ajv');
        var ajv = new Ajv({ // todo: this ajv config should be somewhere else
            allErrors: true,
            verbose: true,
            async: "es7",
            removeAdditional: false,
    /*
    The following are docs and free-form thoughts trying to solve the following problem.
    1. Only one schema for input and output validation
    2. Invalid input fields always error (this includes schema violations, and write actions to readOnly fields)
    3. Fields that do not exist in the schema always error

        false (default) - not to remove additional properties
            - The problem with false is that if the schema doesn't include additionalProperties: false, any additional properties will bypass validation. 
                If we have multiple schemas and one write function, this is a problem.
        "all" - all additional properties are removed, regardless of additionalProperties keyword in schema (and no validation is made for them).
            - The problem with all, is that additionalProperties is awesome and I want to allow full use of it.
            e.g. additionalProperties: {type: string} says you can have a bunch of additional properties, all with the string type.
        true - only additional properties with additionalProperties keyword equal to false are removed.
            - The problem with true, is that the properties are removed **before** validation, so validation will not fail. We want to fail
            to notify users of a problem. This may be a controversial choice, but I would rather fail on an unexpected field
            than have someone provide it and wonder why it's not doing anything.
        "failing" - additional properties that fail schema validation will be removed (where additionalProperties keyword is false or schema).
            - This removes failed properties as opposed to failing on them. We want to fail, to notify users of a problem.
    
    
     Latest thought: Do I run this twice? Once with false to validate the whole system and remove nothing. 
     IF IT PASSES, then remove... 
     definitely true, everything where additionalProperties: false.
     not all, we want to support the use of additionalProperties
     failing... I don't believe in this double-test case failing will be different from true
     What we really want is additionalProperties to default to false, so additional properties always fail validation
     Maybe this means that we do want "all".... Maybe we just start by saying that additionalProperties is insecure with
     the way this is built. We can even have a config bypass with a crazy name INSECURELY ALLOW ADDITIONAL PROPERTIES
    
     more thoughts: is read only our solution? We have one doc, with everything, and some are marked as "can not be written to".
     If you validate in a write vs. read context that ensures we stick to one schema. The problem here is with how required
     interacts with readOnly. What if the parameters are required in a read context but not a write context? Should I just have
     two separate schemas and deal with it?
    
     final thought: is this all worth the time? Or do I just get something out with the edit schema and fix the problem when
     we encounter it again in the future. We're not going to do any validation with the read schema yet. Best case the purpose
     of a read schema will be to simplify replacement calls or include resolver functions to simplify reading from the db.
     (note to self on resolver functions. It's very easy with the new system, resolve: (models) => { return models.id })
     */
        });
    
        // This is an experiment in supporting readOnly, I'm not sure it's the right path.
        // When in write mode, all readOnly fields are invalid and will fail
        ajv.addKeyword('readOnly', {
            validate: function (schema) {
                if (schema === true) {
                    return false;
                }
            }
        });
        
        let compiledSchema = ajv.compile(this._schema);
        let isValid = false;

        if (this._schema.$async) {
            try {
                return await compiledSchema(requestBody);
            } catch(errors) {
                console.log(errors);
                throw new ValidationError('Invalid request body', errors);
            }
        }

        isValid = compiledSchema(requestBody);

        if (!isValid) {
            console.log(compiledSchema.errors);
            throw new ValidationError('Invalid request body', compiledSchema.errors);
        }

        return requestBody;
    }
};