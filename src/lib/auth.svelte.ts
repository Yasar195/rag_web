import { initializeApp, getApps, getApp } from "firebase/app";
import {
	getAuth,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut as firebaseSignOut,
	updateProfile,
	GoogleAuthProvider,
	OAuthProvider,
	FacebookAuthProvider,
	signInWithPopup,
	onAuthStateChanged,
	type User,
} from "firebase/auth";
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_APP_ID,
} from "$env/static/public";

const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID,
};

let auth: ReturnType<typeof getAuth> | undefined;

class AuthState {
	#user = $state<User | null>(null);
	#loading = $state(true);
	#error = $state<string | null>(null);

	constructor() {
		if (typeof window !== "undefined") {
			try {
				const app =
					getApps().length === 0
						? initializeApp(firebaseConfig)
						: getApp();
				auth = getAuth(app);

				onAuthStateChanged(
					auth,
					(u) => {
						this.#user = u;
						this.#loading = false;
					},
					(err) => {
						this.#error = err.message;
						this.#loading = false;
					},
				);
			} catch (e: any) {
				console.error("Firebase initialization failed:", e);
				this.#loading = false;
				this.#error = e.message;
			}
		} else {
			this.#loading = false;
		}
	}

	get user() {
		return this.#user;
	}
	get loading() {
		return this.#loading;
	}
	get error() {
		return this.#error;
	}
	set error(val: string | null) {
		this.#error = val;
	}

	async signInWithEmail(email: string, pass: string) {
		if (!auth) throw new Error("Auth service not initialized");
		this.#loading = true;
		this.#error = null;
		try {
			await signInWithEmailAndPassword(auth, email, pass);
		} catch (err: any) {
			this.#error = this.cleanErrorMessage(err.code || err.message);
			throw err;
		} finally {
			this.#loading = false;
		}
	}

	async signUpWithEmail(email: string, pass: string, name: string) {
		if (!auth) throw new Error("Auth service not initialized");
		this.#loading = true;
		this.#error = null;
		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				pass,
			);
			if (userCredential.user) {
				await updateProfile(userCredential.user, {
					displayName: name,
				});
				// Refresh local state user profile
				this.#user = auth.currentUser;
			}
		} catch (err: any) {
			this.#error = this.cleanErrorMessage(err.code || err.message);
			throw err;
		} finally {
			this.#loading = false;
		}
	}

	async signInWithGoogle() {
		if (!auth) throw new Error("Auth service not initialized");
		this.#loading = true;
		this.#error = null;
		try {
			const provider = new GoogleAuthProvider();
			await signInWithPopup(auth, provider);
		} catch (err: any) {
			this.#error = this.cleanErrorMessage(err.code || err.message);
			throw err;
		} finally {
			this.#loading = false;
		}
	}

	async signInWithApple() {
		if (!auth) throw new Error("Auth service not initialized");
		this.#loading = true;
		this.#error = null;
		try {
			const provider = new OAuthProvider("apple.com");
			await signInWithPopup(auth, provider);
		} catch (err: any) {
			this.#error = this.cleanErrorMessage(err.code || err.message);
			throw err;
		} finally {
			this.#loading = false;
		}
	}

	async signInWithFacebook() {
		if (!auth) throw new Error("Auth service not initialized");
		this.#loading = true;
		this.#error = null;
		try {
			const provider = new FacebookAuthProvider();
			await signInWithPopup(auth, provider);
		} catch (err: any) {
			this.#error = this.cleanErrorMessage(err.code || err.message);
			throw err;
		} finally {
			this.#loading = false;
		}
	}

	async signOut() {
		if (!auth) throw new Error("Auth service not initialized");
		this.#loading = true;
		this.#error = null;
		try {
			await firebaseSignOut(auth);
		} catch (err: any) {
			this.#error = err.message || "Sign out failed";
			throw err;
		} finally {
			this.#loading = false;
		}
	}

	private cleanErrorMessage(code: string): string {
		switch (code) {
			case "auth/invalid-email":
				return "Invalid email address format.";
			case "auth/user-disabled":
				return "This user account has been disabled.";
			case "auth/user-not-found":
				return "No user found with this email.";
			case "auth/wrong-password":
				return "Incorrect password.";
			case "auth/email-already-in-use":
				return "Email is already registered. Try signing in.";
			case "auth/weak-password":
				return "Password should be at least 6 characters.";
			case "auth/popup-closed-by-user":
				return "Sign-in popup closed before completion.";
			default:
				return code.replace("auth/", "").replace(/-/g, " ");
		}
	}
}

export const authState = new AuthState();
