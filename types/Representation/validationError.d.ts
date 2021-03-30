/**
 * validationError.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */
import { InvalidRequestError, HTTPError, ProblemPayload } from '../core/httpErrors';
export interface FieldErrorPayload extends ProblemPayload {
    field?: string;
}
export declare class ValidationError extends InvalidRequestError {
    constructor(message: string, fieldErrors: Array<HTTPError>);
}
export declare class FieldError extends InvalidRequestError {
    fieldName: string;
    constructor(message: string, field: string);
    protected buildPayload(): FieldErrorPayload;
}
