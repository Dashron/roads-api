import { AuthScheme } from '../../Resource/resource';

export type AuthFormat = true | false | undefined;

const authScheme: AuthScheme<AuthFormat> = (token) => {
	return true;
};

export default authScheme;