/**
 * representation.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * A clean base class that defines the common Representation functions used by the Roads API
 */
export default interface Representation {
}
export interface ReadableRepresentation<ModelsType, AuthType> extends Representation {
    render(models: ModelsType, auth: AuthType | null, stringify: boolean): string;
}
export interface ReadableRepresentationConstructor<ModelsType, AuthType> {
    new (action: string): ReadableRepresentation<ModelsType, AuthType>;
}
export interface WritableRepresentation<ModelsType, ReqBodyType, AuthType> extends Representation {
    parseInput(requestBody: string): Promise<unknown>;
    applyEdit(requestBody: ReqBodyType, models: ModelsType, auth: AuthType): void;
}
export interface WritableRepresentationConstructor<ModelsType, ReqBodyType, AuthType> {
    new (action: string): WritableRepresentation<ModelsType, ReqBodyType, AuthType>;
}
