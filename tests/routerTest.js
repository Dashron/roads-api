let Router = require('../index.js').Router;
let resource = require('./data/postResource.js');


let testRouter = new Router();
testRouter.addRoute('/', resource);
console.log(testRouter.locateResource('http://api.dashron.com/'));
console.log(testRouter.locateResource('http://api.dashron.com/posts/12345'));

let testRouter2 = new Router();
testRouter.addRoute('/posts/{post_id}', resource);
console.log(testRouter.locateResource('http://api.dashron.com/posts/12345'));