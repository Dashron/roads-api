let postResource = require('./postResource.js');
postResource.resolve('GET', '/posts/12345', null, {})
.then((response) => {
    console.log('GET /posts/12345');
    console.log(response);
})
.catch((error) => {
    console.log('Unexpected error for GET /posts/12345');
    console.log(error);
});

postResource.resolve('PUT', '/posts/12345', JSON.stringify({title: "New Name", post:"New post contents"}), {"Content-Type": "application/json"})
.then((response) => {
    console.log('PUT /posts/12345');
    console.log(response);
})
.catch((error) => {
    console.log('Unexected error for PUT /posts/12345');
    console.log(error);
});

postResource.resolve('PUT', '/posts/12345', JSON.stringify({title: "New Name", id: 5, post:"New post contents"}), {"Content-Type": "application/json"})
.then((response) => {
    console.log('Unexpected success for PUT /posts/12345');
    console.log(response);
})
.catch((error) => {
    console.log('PUT /posts/12345');
    console.log(error);
});

postResource.resolve('PATCH', '/posts/12345', {
    title: "new edited title"
}, {"Content-Type": "application/merge-patch+json"})
.then((response) => {
    console.log('PATCH /posts/12345');
    console.log(response);
})
.catch((error) => {
    console.log('Unexected error for PUT /posts/12345');
    console.log(error);
});

postResource.resolve('DELETE', '/posts/12345', JSON.stringify({title: "New Name", post:"New post contents"}), {"Content-Type": "application/json"})
.then((response) => {
    console.log('DELETE /posts/12345');
    console.log(response);
})
.catch((error) => {
    console.log('Unexected error for DELETE /posts/12345');
    console.log(error);
});