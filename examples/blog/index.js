let postResource = require('./postResource.js');
postResource.resolve('GET', '/posts/12345', null, {})
.then((response) => {
    console.log(response);
})
.catch((error) => {
    console.log(error);
});


postResource.resolve('PUT', '/posts/12345', JSON.stringify({name: "New Name"}), {"Content-Type": "application/json"})
.then((response) => {
    console.log(response);
})
.catch((error) => {
    console.log(error);
});