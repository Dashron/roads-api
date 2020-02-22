TYPESCRIPT:
1. Create new branch
2. Copy over typescript configuration files
3. Update package.json to include necessary packages for tests
4. Convert tests to typescript and update imports
5. Convert source to typescript and update imports
6. Ensure that there are clear, obvious interfaces available for the most important public interfaces
7. Clean up all interfaces. Ensure there are return values, voids, parameter types, etc.
8. clean up comments on top of file, and on each function and interface
9. remove use strict
10. Verify tsc works fine
11. Verify with another project that it works fine via npm link
12. Clean up files (delete anything you don't want in the package)
13. Commit, publish

TODO:
1. defaultRequestMediaType should be optional, and shouldn't throw an error (resource.resolve)
2. I don't think the response content type is being set properly
3. I don't think throwing http errors for certain status codes is the correct path anymore. Maybe it's fine for roads-api, but for core web roads it causes confusion where you need to catch errors and where you need to watch for certain status codes.
4. don't send a content-type header if there's no response body (particularly with 204 responses) I THINK. Check spec
5. Lower level Resource unit tests
6. Lower level Representation unit tests
7. Better docs
8. Better support for json schema, resolve and set keywords. Maybe we need our own json schema lib.
9. Have the router aware of the hostname, and serve different routes per hostname