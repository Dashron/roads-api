TODO:
-1. Improve generics usage. JSONSchema needs all the generics necessary for addAction to be useful. Resource schema needs... nothing? We don't define anything on the resource, it's all on the action.
0. Investigate executing resolve/set via a custom ajv keyword
0. Explicit assignment of wildcard default set/resolve functions to specific fields. array of names or something
0. Can we get addAction's initial type to have some sort of validation? maybe generics? see postCollectionResource's PostCollectionActions type for an example.
1. Can we pull out roads dependency? It seems to only be for the Response (and some types)
2. defaultRequestMediaType should be optional, and shouldn't throw an error (resource.resolve)
3. Add resource support for if-modified-since, etag
4. don't send a content-type header if there's no response body (particularly with 204 responses) I THINK. Check spec
5. Lower level Resource unit tests
6. Lower level Representation unit tests
7. Better docs
8. Better support for json schema, resolve and set keywords. Maybe we need our own json schema lib.
9. Have the router aware of the hostname, and serve different routes per hostname