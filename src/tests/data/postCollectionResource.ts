"use strict";

import { Post } from "./blogStorage";
import { WritableRepresentation } from "../../Representation/representation";

import { Resource } from '../../index';
import { MEDIA_JSON, MEDIA_JSON_MERGE, AUTH_BEARER } from '../../core/constants';

import posts, { createPosts } from './blogStorage';
import { ParsedURLParams, ActionList } from "../../Resource/resource";

import tokenResolver from './tokenResolver';

import PostCollectionRepresentation from './postCollectionRepresentation';
import PostRepresentation from "./postRepresentation";

export default class PostCollectionResource extends Resource {
    constructor(action: string) {
        //TODO: Make is post change this whole resource to append only
        super({
            authSchemes: { [AUTH_BEARER]: tokenResolver },
            responseMediaTypes: { 
                [MEDIA_JSON]: PostCollectionRepresentation
            },
            authRequired: true,
            defaultResponseMediaType: MEDIA_JSON
        }, ["get"]);

        this.addAction("get", () => {});

        this.addAction("append", (models: {posts: Array<Post>}, requestBody: any, requestMediaHandler: WritableRepresentation, auth: any) => {
            let directPosts = createPosts();

            if (requestBody.whatever) {
                // this helps with a test
                throw new Error('unwanted extra parameter made it through validation.');
            }
    
            let post = new Post();
            requestMediaHandler.applyEdit(requestBody, post, auth);
            // Note: this may be auto generated by the db or something. I do this here to mimic that
            post.id = directPosts[directPosts.length - 1].id + 1; 
            directPosts.push(post);
            post.save();
            models.posts = directPosts;
        }, {
            requestMediaTypes: { [MEDIA_JSON]: PostRepresentation },
            defaultRequestMediaType: MEDIA_JSON_MERGE,
            defaultResponseMediaType: MEDIA_JSON
        });
        
        
        // This is just to simplify tests. It is not recommended as a real resource pattern
        let requiredProperties = action === "requiredProperty" ? ["requiredProperty"] : undefined;

        this.setSearchSchema({
            per_page: {
                type: "number"
            },
            page: {
                type: "number"
            },
            requiredProperty: {
                type: "boolean"
            }
        }, requiredProperties);
    }

    // I don't like this. why doesn't the abstract class know the parameter types?
    modelsResolver(urlParams: ParsedURLParams | undefined, searchParams: URLSearchParams | undefined, action: keyof ActionList, pathname: string) {
        let models: {[x: string]: any} = {};

        if (searchParams === undefined || searchParams.get('per_page') === null) {
            models.perPage = 10;
        } else {
            models.perPage = Number(searchParams.get('per_page'));
        }

        if (searchParams === undefined || searchParams.get('page') === null) {
            models.page = 1;
        } else {
            models.page = Number(searchParams.get('page'));
        }

        models.posts = posts.getAll(models.page, models.perPage);
        return models;
    }
};