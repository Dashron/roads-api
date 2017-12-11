const Representation = require('roads-representation');

module.exports = new Representation(({
    models,
    auth
}) => {
    return {
        responseBody: '', 
        responseHeaders: {}
    }
});