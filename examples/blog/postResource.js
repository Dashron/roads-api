const {Resource} = require('../../index.js');

let postResource = module.exports = new Resource({
    authResolvers: {
        Bearer: require('./tokenResolver.js')
    }
});


postResource.modelsLocator = (uri, method) => {

};

postResource.add = ({
    auth,
    body,
    models
}) => {

    return {
        responseStatus: 200,
        responseModels: {}
    };
};

postResource.replace = ({
    auth,
    body,
    models
}) => {
    return {
        responseStatus: 200,
        responseModels: {}
    };
};

postResource.append = ({
    auth,
    body,
    models
}) => {
    return {
        responseStatus: 200,
        responseModels: {}
    };
};

postResource.patch = ({
    auth,
    body,
    models
}) => {
    return {
        responseStatus: 200,
        responseModels: {}
    };
};

postResource.delete = ({
    auth,
    body,
    models
}) => {
    return {
        responseStatus: 200,
        responseModels: {}
    };
};