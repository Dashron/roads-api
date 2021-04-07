export class Post {
	id: number;
	title: string;
	post: string;
	active: number;

	constructor(id?: number, title?: string, post?: string, active = 1) {
		if (id) {
			this.id = id;
		}

		if (title) {
			this.title = title;
		}

		if (post) {
			this.post = post;
		}

		this.active = active;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/explicit-module-boundary-types
	save() {

	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/explicit-module-boundary-types
	delete() {

	}
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createPosts () {
	const posts: Array<Post> = [];

	posts[1] = new Post (1, 'hello', 'the body', 1);
	posts[2] = new Post (2, 'hello', 'the body', 0);
	posts[3] = new Post (3, 'hello', 'the body', 0);
	posts[4] = new Post (4, 'hello', 'the body', 1);
	posts[12345] = new Post (12345, 'hello', 'the body', 1);

	return posts;
}

export default {
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	get: (id: number) => {
		const posts = createPosts();

		if (posts[id]) {
			return posts[id];
		}

		return null;
	},
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-unused-vars
	getAll: (page: number, perPage: number) => {
		const posts = createPosts();

		return [posts[1], posts[2], posts[3], posts[4], posts[12345]];
	},
	Post: Post
};