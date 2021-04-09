import { AuthScheme } from '../../Resource/resource';

export type AuthFormat = true | false | undefined;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const authScheme: AuthScheme<AuthFormat> = (token) => {
	return token ? true : false;
};

export default authScheme;