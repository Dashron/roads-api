TODO:
0. defaultRequestMediaType should be optional, and shouldn't throw an error (resource.resolve)
0. I don't think the response content type is being set properly
1. Lower level Resource unit tests
2. Lower level Representation unit tests
3. Better docs
4. Better support for json schema, resolve and set keywords. Maybe we need our own json schema lib.
5. Have the router aware of the hostname, and serve different routes per hostname