import { HTTPError } from '../../core/httpErrors';
import { Response } from 'roads';

describe('http error tests', () => {
    test('test http error response generation', function () {
        expect.assertions(3);

        let error = new HTTPError('Hello!');
        let response = error.toResponse();
        expect(response).toBeInstanceOf(Response);
        expect(response.status).toEqual(500);
        expect(response.body).toEqual(JSON.stringify({
            title: "Hello!",
            status: 500,
            "additional-problems": []
        }));

    });


    test('test additional problems generation', function () {
        expect.assertions(3);

        let error = new HTTPError('Hello!');
        error.addAdditionalProblem(new HTTPError('Another problem!'));
        error.addAdditionalProblem(new HTTPError('Yet another problem!'));

        let response = error.toResponse();
        expect(response).toBeInstanceOf(Response);
        expect(response.status).toEqual(500);
        expect(response.body).toEqual(JSON.stringify({
            title: "Hello!",
            status: 500,
            "additional-problems": [{
                title: "Another problem!",
                status: 500,
                "additional-problems": []
            }, {
                title: "Yet another problem!",
                status: 500,
                "additional-problems": []
            }]
        }));
    });
});