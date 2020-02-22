/**
 * representation.ts
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * A clean base class that defines the common Representation functions used by the Roads API
 */

export default interface Representation {
};

export interface ReadableRepresentation extends Representation {
    render (models: any, auth: any, stringify: boolean): any;
}

export interface ReadableRepresentationConstructor {
    new(action: string): ReadableRepresentation;
}

export interface WritableRepresentation extends Representation {
    parseInput(requestBody: string): Promise<any>;
    applyEdit(requestBody: any, models: object, auth: any): void;
}

export interface WritableRepresentationConstructor {
    new(action: string): WritableRepresentation;
}