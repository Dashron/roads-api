module.exports = class Representation {
    constructor (translator) {
        // function with two params, models and auth.
        this._translator = translator;
    }

    render (models, auth)  {
        return this._translator(models, auth)
    }
};