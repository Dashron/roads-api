"use strict";


function validateInput () {
    if (method === HTTP_PUT) {
        representation[this.inputValidators[HTTP_PUT]](requestBody);
    } else if (method === HTTP_POST) {
        if (this.postType === POST_TYPE_APPEND) {
            representation[this.inputValidators[HTTP_POST]](requestBody);
        } else {
            this[this.inputValidators[HTTP_POST]](requestBody);
        }
    } else if (method === HTTP_PATCH) {
        this[this.inputValidators[HTTP_PATCH]](requestBody);
    }
}

module.exports = validateInput;