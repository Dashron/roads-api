TODO:
-2. Fix accept: */* not working and falling back to the default.
-1. Add the request body to the models resolver
1. Investigate executing resolve/set via a custom ajv keyword
2. Explicit assignment of wildcard default set/resolve functions to specific fields. array of names or something
3. Can we get addAction's initial type to have some sort of validation? maybe generics? see postCollectionResource's PostCollectionActions type for an example.
4. Can we pull out roads dependency? It seems to only be for the Response (and some types)
5. defaultRequestMediaType should be optional, and shouldn't throw an error (resource.resolve)
6. Add resource support for if-modified-since, etag
7. don't send a content-type header if there's no response body (particularly with 204 responses) I THINK. Check spec
8. Lower level Resource unit tests
9. Lower level Representation unit tests
10. Better docs
11. Better support for json schema, resolve and set keywords. Maybe we need our own json schema lib.
12. Have the router aware of the hostname, and serve different routes per hostname