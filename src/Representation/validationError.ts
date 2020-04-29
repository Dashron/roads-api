/**
 * validationError.ts
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 */

import { InvalidRequestError, HTTPError, ProblemPayload} from '../core/httpErrors';

export interface FieldErrorPayload extends ProblemPayload {
    field?: string
}

export class ValidationError extends InvalidRequestError {
    constructor(message: string, fieldErrors: Array<HTTPError>) {
        super(message);

        fieldErrors.forEach((error) => {
            this.addAdditionalProblem(error);
        });
    }
}

export class FieldError extends InvalidRequestError {
    fieldName: string;

    constructor(message: string, field: string) {
        super(message);
        this.fieldName = field;
    }

    protected buildPayload(): FieldErrorPayload {
        let payload: FieldErrorPayload = super.buildPayload();
        payload.field = this.fieldName;
        return payload;
    }
}