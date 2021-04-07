/**
 * representation.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * A clean base class that defines the common Representation functions used by the Roads API
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface, semi
export default interface Representation {}

export interface ReadableRepresentation<Models, Auth> extends Representation {
    render (models: Models, auth: Auth | null, stringify: boolean): string;
}

export interface ReadableRepresentationConstructor<Models, Auth> {
    new(action: string): ReadableRepresentation<Models, Auth>;
}

export interface WritableRepresentation<RepresentationFormat, Models, Auth> extends Representation {
    parseInput(requestBody: string): Promise<unknown>;
    applyEdit(requestBody: RepresentationFormat, models: Models, auth: Auth): void;
}

export interface WritableRepresentationConstructor<RepresentationFormat, Models, Auth> {
    new(action: string): WritableRepresentation<RepresentationFormat, Models, Auth>;
}