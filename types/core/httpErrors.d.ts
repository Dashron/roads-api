/**
 * httpErrors.ts
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 */
import { Response } from 'roads';
export interface ProblemPayload {
    title: string;
    status: number;
    "additional-problems": Array<ProblemPayload>;
}
export declare class HTTPError extends Error {
    status: number;
    protected additionalProblems: Array<HTTPError>;
    constructor(message: string);
    toResponse(): Response;
    addAdditionalProblem(problem: HTTPError): void;
    protected buildPayload(): ProblemPayload;
    protected buildAdditionalProblems(): Array<ProblemPayload>;
}
export declare class UnsupportedMediaTypeError extends HTTPError {
    constructor(contentType: string);
}
export declare class UnauthorizedError extends HTTPError {
    type: string;
    realm?: string;
    charset?: string;
    constructor(message: string, type: string, realm?: string, charset?: string);
    toResponse(): Response;
    buildWWWAuthenticateHeader(): string;
}
export declare class InvalidRequestError extends HTTPError {
    constructor(message: string);
}
export declare class ForbiddenError extends HTTPError {
    constructor(message: string);
}
export declare class NotFoundError extends HTTPError {
    constructor(message: string);
}
export declare class MethodNotAllowedError extends HTTPError {
    constructor(validMethods: Array<string>);
}
export declare class NotAcceptableError extends HTTPError {
    constructor(message: string);
}
export declare class UnprocessableEntityError extends HTTPError {
    constructor(message: string);
}
export declare class InputValidationError extends InvalidRequestError {
    fieldErrors: Array<string>;
    constructor(message: string, fieldErrors: Array<string>);
}
