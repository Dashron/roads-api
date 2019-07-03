TODO:
0. defaultRequestMediaType should be optional, and shouldn't throw an error (resource.resolve)
0. I don't think the response content type is being set properly
0. I don't think throwing http errors for certain status codes is the correct path anymore. Maybe it's fine for roads-api, but for core web roads it causes confusion where you need to catch errors and where you need to watch for certain status codes.
1. Lower level Resource unit tests
2. Lower level Representation unit tests
3. Better docs
4. Better support for json schema, resolve and set keywords. Maybe we need our own json schema lib.
5. Have the router aware of the hostname, and serve different routes per hostname