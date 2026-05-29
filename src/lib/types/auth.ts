export interface LoginCredentials {
	email: string;
	password?: string;
}

export interface SignupCredentials extends LoginCredentials {
	password: string;
	confirmPassword: string;
	name: string;
}

export type AuthTab = 'signin' | 'signup';

export interface SocialProvider {
	name: string;
	icon: string;
	color: string;
}
