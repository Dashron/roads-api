/**
 * httpErrors.ts
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 */

import { Response } from 'roads';

export interface ProblemPayload {
    // URI identifier, should resolve to human readable documentation
    //type: '',
    // Short, human readable message
    title: string,
    // HTTP Status code
    status: number,
    // Human readable explanation
    //details: '',
    // URI Identifier that may or may not resolve to docs
    //instance: '',
    "additional-problems": Array<ProblemPayload>
};

export class HTTPError extends Error {
    status: number;
    protected additionalProblems: Array<HTTPError>;

    constructor (message: string) {
        super(message);
        this.status = 500;
        this.additionalProblems = [];
    }

    toResponse() {
        let payload = this.buildPayload();

        // Problem details JSON format: https://tools.ietf.org/html/rfc7807
        return new Response(JSON.stringify(payload),this.status,  {
            "content-type": "application/json"
        });
    }

    addAdditionalProblem(problem: HTTPError) {
        if (!(problem instanceof HTTPError)) {
            throw new Error('Invalid additional problem');
        }

        this.additionalProblems.push(problem);
    }

    protected buildPayload(): ProblemPayload {
        let payload: ProblemPayload = {
            // URI identifier, should resolve to human readable documentation
            //type: '',
            // Short, human readable message
            title: this.message,
            // HTTP Status code
            status: this.status,
            // Human readable explanation
            //details: '',
            // URI Identifier that may or may not resolve to docs
            //instance: '',
            "additional-problems": this.buildAdditionalProblems()
        };

        return payload;
    }

    protected buildAdditionalProblems(): Array<ProblemPayload> {
        if (this.additionalProblems.length === 0) {
            return [];
        }

        let problems = [];
        for (let i = 0; i < this.additionalProblems.length; i++) {
            problems.push(this.additionalProblems[i].buildPayload());
        }

        return problems;
    }
};

// 415
export class UnsupportedMediaTypeError extends HTTPError {
    constructor (contentType: string) {
        super('Unsupported content type' + contentType);
        this.status = 415;
    }
};

// 401
// return one www-authenticate header per authResolver type
// 'WWW-Authenticate': authorization.format(authType));
export class UnauthorizedError extends HTTPError {
    type: string;
    realm?: string;
    charset?: string;

    constructor (message: string, type: string, realm?: string, charset?: string) {
        super(message);
        this.type = type;
        this.realm = realm;
        this.charset = charset;
        this.status = 401;
    }

    toResponse(): Response {
        let response = super.toResponse.apply(this);
        response.headers['WWW-Authenticate'] = this.buildWWWAuthenticateHeader();
        return response;
    }

    buildWWWAuthenticateHeader(): string {
        let header = this.type;
        
        if (this.realm) {
            header = header + 'realm=' + this.realm;
        }

        if (this.charset) {
            header = header + 'realm=' + this.charset;
        }

        return header;
    }
}
    
// 400
export class InvalidRequestError extends HTTPError {
    constructor (message: string) {
        super(message);
        this.status = 400;
    }
}

// 403
export class ForbiddenError extends HTTPError {
    constructor (message: string) {
        super(message);
        this.status = 403;
    }
}

//404
export class NotFoundError extends HTTPError {
    constructor (message: string) {
        super(message);
        this.status = 404;
    }
}

// 405
export class MethodNotAllowedError extends HTTPError {
    constructor (validMethods: Array<string>) {
        super(validMethods.join(', '));
        this.status = 405;
    }
}

// 406
export class NotAcceptableError extends HTTPError {
    constructor (message: string) {
        super(message);
        this.status = 406;
    }
}

// 422
export class UnprocessableEntityError extends HTTPError {
    constructor (message: string) {
        super(message);
        this.status = 422;
    }
}

export class InputValidationError extends InvalidRequestError {
    public fieldErrors: Array<string>;
    
    constructor(message: string, fieldErrors: Array<string>) {
        super(message);
        this.fieldErrors = fieldErrors;
    }
}