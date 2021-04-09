import PostResource from '../data/postResource';
import PostCollectionResource from '../data/postCollectionResource';
import { Response } from 'roads';
import Resource, { ParsedURLParams } from '../../Resource/resource';
import { IncomingHeaders } from 'roads/types/core/road';

const BASE_URL = 'http://dashron.com';
import { URL } from 'url';
import { FieldErrorPayload } from '../../Representation/validationError';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fixBody(body: any): string | undefined {
	if (typeof(body) === 'object') {
		return JSON.stringify(body);
	}

	if (typeof(body) === 'undefined') {
		return undefined;
	}

	return body.toString();
}

function ensureInvalidRequest (
	resource: Resource<unknown, unknown, unknown> , method: string, url: URL,
	urlParams: ParsedURLParams | undefined, body: unknown,
	headers: IncomingHeaders | undefined, message: string, additionalProblems: Array<FieldErrorPayload>) {

	const strBody = fixBody(body);
	if (!additionalProblems) {
		additionalProblems = [];
	}

	return resource.resolve(method, url, urlParams, strBody, headers)
		.then((response: Response) => {
			expect(response).toEqual(
				new Response(JSON.stringify({
					title: message, status: 400,
					'additional-problems': additionalProblems }), 400, {'content-type': 'application/json'}));
		});
}

function ensureValidRequest (
	resource: Resource<unknown, unknown, unknown> , method: string, url: URL,
	urlParams: ParsedURLParams | undefined, body: unknown | undefined,
	headers: IncomingHeaders | undefined, expectedResponse: Response) {

	return resource.resolve(method, url, urlParams, fixBody(body), headers)
		.then((response: Response) => {
			expect(response).toEqual(expectedResponse);
		});
}

describe('blog resource tests', () => {
	test('Test GET Resource execution', function () {
		expect.assertions(1);

		return ensureValidRequest(
			new PostResource('get'),
			'GET',
			new URL('/posts/12345', BASE_URL),
			{
				post_id: 12345
			},
			undefined,
			{
				authorization: 'Bearer abcde'
			},
			new Response(JSON.stringify({
				id: 12345, title: 'hello',
				post: 'the body', active: true,
				nestingTest: {nestedField: 'nestedValue'}
			}), 200, {'content-type': 'application/json'})
		);
	});

	// TODO: It would be nice if this errored at addAction time, and not execution.
	test('Test GET Resource execution without properly configured auth', function () {
		expect.assertions(1);

		return (new PostResource('get-noauth')).resolve(
			'GETNOAUTH',
			new URL('/posts/12345', BASE_URL), {
				post_id: 12345
			},
			fixBody(undefined), {
				authorization: 'Bearer abcde'
			}
		).then((response: Response) => {
			expect(response).toEqual({
				body: 'Unknown error. Please check your logs',
				status: 500,
				headers: {}
			});
		});
	});

	test('Test GET Resource execution without proper auth header', function () {
		expect.assertions(1);

		return (new PostResource('get')).resolve(
			'GET',
			new URL('/posts/12345', BASE_URL), {
				post_id: 12345
			},
			fixBody(undefined),
			{ }
		).then((response: Response) => {
			expect(response).toEqual({
				body: JSON.stringify({title: 'Authorization required', status: 401, 'additional-problems': []}),
				status: 401,
				headers: {
					'WWW-Authenticate': 'Bearer',
					'content-type': 'application/json'
				}
			});
		});
	});

	// TODO: It would be nice if this errored at addAction time, and not execution.
	test('Test GET Resource execution without properly configured responses', function () {
		expect.assertions(1);

		return (new PostResource('get-noresponse')).resolve(
			'GETNORESPONSE',
			new URL('/posts/12345', BASE_URL), {
				post_id: 12345
			},
			fixBody(undefined), {
				authorization: 'Bearer abcde'
			}
		).then((response: Response) => {
			expect(response).toEqual({
				body: 'Unknown error. Please check your logs',
				status: 500,
				headers: {}
			});
		});
	});

	test('Test GET Collection Resource execution', function () {
		expect.assertions(1);

		return ensureValidRequest(
			new PostCollectionResource('get'),
			'GET',
			new URL('/posts', BASE_URL),
			undefined,
			undefined,
			{
				authorization: 'Bearer abcde'
			},
			new Response(JSON.stringify({
				data: [{id:1,title:'hello',post:'the body', active: true, nestingTest: {nestedField: 'nestedValue'}},
					{id:2,title:'hello',post:'the body', active: false, nestingTest: {nestedField: 'nestedValue'}},
					{id:3,title:'hello',post:'the body', active: false, nestingTest: {nestedField: 'nestedValue'}},
					{id:4,title:'hello',post:'the body', active: true, nestingTest: {nestedField: 'nestedValue'}},
					{id:12345,title:'hello',post:'the body', active: true, nestingTest: {nestedField: 'nestedValue'}}],
				perPage: 10,
				page: 1
			}), 200, {'content-type': 'application/json'})
		);

	});

	test('Test valid POST Resource execution', function () {
		expect.assertions(1);

		// Edit resource
		return ensureValidRequest(
			new PostCollectionResource('append'),
			'POST',
			new URL('/posts', BASE_URL),
			undefined,
			{
				title: 'new title',
				post: 'my blog post',
				nestingTest: {nestedField: 'nestedValue'},
				active: true
			}, {
				'Content-Type': 'application/json',
				authorization: 'Bearer abcde'
			},
			new Response(JSON.stringify({data:[
				{id:1,title:'hello',post:'the body', active: true, nestingTest: {nestedField: 'nestedValue'}},
				{id:2,title:'hello',post:'the body', active: false, nestingTest: {nestedField: 'nestedValue'}},
				{id:3,title:'hello',post:'the body', active: false, nestingTest: {nestedField: 'nestedValue'}},
				{id:4,title:'hello',post:'the body', active: true, nestingTest: {nestedField: 'nestedValue'}},
				{id:12345,title:'hello',post:'the body', active: true, nestingTest: {nestedField: 'nestedValue'}},
				{id:12346,title:'new title',post:'my blog post', active: true, nestingTest: {nestedField: 'nestedValue'}}
			],perPage:10,page:1}), 201, {'content-type': 'application/json'})
		);
	});

	test('Test extra fields are dropped before they hit the resource', function () {
		expect.assertions(1);

		// Edit resource
		return ensureValidRequest(
			new PostCollectionResource('append'),
			'POST',
			new URL('/posts', BASE_URL),
			undefined,
			{
				title: 'new title',
				post: 'my blog post',
				nestingTest: {nestedField: 'nestedValue'},
				whatever: 'stuff',
				active: true
			}, {
				'Content-Type': 'application/json',
				authorization: 'Bearer abcde'
			},
			new Response(JSON.stringify({data:[
				{id:1,title:'hello',post:'the body', active: true, nestingTest: {nestedField: 'nestedValue'}},
				{id:2,title:'hello',post:'the body', active: false, nestingTest: {nestedField: 'nestedValue'}},
				{id:3,title:'hello',post:'the body', active: false, nestingTest: {nestedField: 'nestedValue'}},
				{id:4,title:'hello',post:'the body', active: true, nestingTest: {nestedField: 'nestedValue'}},
				{id:12345,title:'hello',post:'the body',active: true,  nestingTest: {nestedField: 'nestedValue'}},
				{id:12346,title:'new title',post:'my blog post', active: true, nestingTest: {nestedField: 'nestedValue'}}
			]
			,perPage:10,page:1}), 201, {'content-type': 'application/json'})
		);
	});

	test('Test invalid POST Resource execution: missing required top level fields', function () {
		expect.assertions(1);

		// Edit resource
		return ensureInvalidRequest(
			new PostCollectionResource('append'),
			'POST',
			new URL('/posts', BASE_URL),
			undefined,
			{ }, {
				'Content-Type': 'application/json',
				authorization: 'Bearer abcde'
			},
			'Invalid request body',
			[{title:'must have required property \'title\'',
				status:400,'additional-problems':[], field: '/title'},
			{title:'must have required property \'post\'',
				status:400, 'additional-problems':[], field: '/post'},
			{title:'must have required property \'nestingTest\'',
				status: 400, 'additional-problems':[], field: '/nestingTest'},
			{title:'must have required property \'active\'',
				status:400, 'additional-problems':[], field: '/active'}],
		);
	});

	test('Test invalid POST Resource execution: missing required second tier fields', function () {
		expect.assertions(1);

		// Edit resource
		return ensureInvalidRequest(
			new PostCollectionResource('append'),
			'POST',
			new URL('/posts', BASE_URL),
			undefined,
			{
				nestingTest: {

				}
			}, {
				'Content-Type': 'application/json',
				authorization: 'Bearer abcde'
			},
			'Invalid request body',
			[{title:'must have required property \'title\'',
				status:400,'additional-problems':[], field: '/title'},
			{title:'must have required property \'post\'',
				status:400, 'additional-problems':[], field: '/post'},
			{title:'must have required property \'active\'',
				status:400, 'additional-problems':[], field: '/active'},
			{title:'must have required property \'nestedField\'',
				status: 400, 'additional-problems':[], field: '/nestingTest/nestedField'}],
		);
	});

	test('Test Invalid POST Resource execution: setting the id', function () {
		expect.assertions(1);

		return ensureInvalidRequest(
			new PostCollectionResource('append'),
			'POST',
			new URL('/posts', BASE_URL),
			undefined,
			{
				title: 'New Name',
				id: 5,
				post:'New post contents',
				nestingTest: {nestedField: 'nestedValue'},
				active: true
			}, {
				'Content-Type': 'application/json',
				authorization: 'Bearer abcde'
			},
			'Invalid request body',
			[{title:'should pass "roadsReadOnly" keyword validation',status:400, 'additional-problems':[], field: '/id'}]
		);
	});

	test('Test Invalid POST Resource execution: method not allowed', function () {
		expect.assertions(1);

		return (new PostResource('append')).resolve('POST', new URL('/posts/12345', BASE_URL), {
			post_id: 12345
		}, JSON.stringify({
			title: 'New Name',
			id: 5,
			post:'New post contents',
			nestingTest: {nestedField: 'nestedValue'}
		}), {
			'Content-Type': 'application/json',
			authorization: 'Bearer abcde'
		})
			.then((response: Response) => {
				expect(response).toEqual(new Response(JSON.stringify({
					title: 'GET, GETNOAUTH, GETNORESPONSE, DELETE, PATCH',
					status: 405,
					'additional-problems': []
				}), 405, {'content-type': 'application/json'}));
			});
	});

	test('Test valid PATCH Resource execution', function () {
		expect.assertions(1);

		// Edit resource
		return ensureValidRequest(
			new PostResource('edit'),
			'PATCH',
			new URL('/posts/12345', BASE_URL),
			{
				post_id: 12345
			},
			{
				title: 'new edited title'
			}, {
				'Content-Type': 'application/merge-patch+json',
				authorization: 'Bearer abcde'
			}, new Response(JSON.stringify({
				id: 12345,
				title: 'new edited title',
				post: 'the body',
				active: true,
				nestingTest: {nestedField: 'nestedValue'}
			}), 200, {'content-type': 'application/json'})
		);
	});

	test('Test Invalid PATCH Resource execution', function () {
		expect.assertions(1);

		return ensureInvalidRequest(
			new PostResource('edit'),
			'PATCH',
			new URL('/posts/12345', BASE_URL),
			{
				post_id: 12345
			},
			{
				title: 'New Name',
				id: 5,
				post:'New post contents'
			}, {
				'Content-Type': 'application/merge-patch+json',
				authorization: 'Bearer abcde'
			},
			'Invalid request body',
			[{title:'should pass "roadsReadOnly" keyword validation',status:400,'additional-problems':[], field: '/id'}]
		);
	});

	test('Test Valid DELETE Resource execution passes', function () {
		expect.assertions(1);

		// Delete resource
		return ensureValidRequest(
			new PostResource('delete'),
			'DELETE',
			new URL('/posts/12345', BASE_URL),
			{
				post_id: 12345
			},
			undefined,
			{
				'Content-Type': 'application/json',
				authorization: 'Bearer abcde'
			}, new Response('', 204, {'content-type': 'application/json'})
		);
	});
});

