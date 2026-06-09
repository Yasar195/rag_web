<script lang="ts">
	import type {
		AuthTab,
		LoginCredentials,
		SignupCredentials,
	} from "$lib/types/auth";
	import TabButtons from "./TabButtons.svelte";
	import { authState } from "$lib/auth.svelte";
	import { createEventDispatcher } from "svelte";

	interface Props {
		onSubmit?: (data: LoginCredentials | SignupCredentials) => void;
	}

	let { onSubmit }: Props = $props();
	const dispatch = createEventDispatcher<{
		submit: LoginCredentials | SignupCredentials;
	}>();

	let activeTab: AuthTab = $state("signin");
	let email = $state("");
	let password = $state("");
	let confirmPassword = $state("");
	let name = $state("");
	let localError = $state("");

	function handleTabChange(tab: AuthTab) {
		activeTab = tab;
		localError = "";
		authState.error = null;
		email = "";
		password = "";
		confirmPassword = "";
		name = "";
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		localError = "";
		authState.error = null;

		try {
			if (activeTab === "signin") {
				if (!email) {
					localError = "Please enter your email";
					return;
				}
				if (!password) {
					localError = "Please enter your password";
					return;
				}

				const credentials: LoginCredentials = { email, password };
				await authState.signInWithEmail(email, password);
				onSubmit?.(credentials);
				dispatch("submit", credentials);
			} else {
				if (!name) {
					localError = "Please enter your name";
					return;
				}
				if (!email) {
					localError = "Please enter your email";
					return;
				}
				if (!password || password.length < 6) {
					localError = "Password must be at least 6 characters";
					return;
				}
				if (password !== confirmPassword) {
					localError = "Passwords do not match";
					return;
				}

				const credentials: SignupCredentials = {
					name,
					email,
					password,
					confirmPassword,
				};
				await authState.signUpWithEmail(email, password, name);
				onSubmit?.(credentials);
				dispatch("submit", credentials);
			}
		} catch (err) {
			console.error("Auth error:", err);
		}
	}
</script>

<div class="w-full max-w-[420px] mx-auto p-8">
	<div class="flex items-center gap-3 mb-8">
		<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect width="32" height="32" rx="8" fill="url(#logoGradient)" />
			<defs>
				<linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
					<stop stop-color="#8b5cf6" />
					<stop offset="1" stop-color="#3b82f6" />
				</linearGradient>
			</defs>
			<!-- Brain/Chip node icon -->
			<circle cx="16" cy="16" r="6" stroke="white" stroke-width="2" />
			<circle cx="16" cy="16" r="2" fill="white" />
			<!-- Connecting nodes -->
			<circle cx="16" cy="6" r="1.5" fill="white" />
			<circle cx="16" cy="26" r="1.5" fill="white" />
			<circle cx="6" cy="16" r="1.5" fill="white" />
			<circle cx="26" cy="16" r="1.5" fill="white" />
			<!-- Lines -->
			<line x1="16" y1="7.5" x2="16" y2="10" stroke="white" stroke-width="1.5" />
			<line x1="16" y1="22" x2="16" y2="24.5" stroke="white" stroke-width="1.5" />
			<line x1="7.5" y1="16" x2="10" y2="16" stroke="white" stroke-width="1.5" />
			<line x1="22" y1="16" x2="24.5" y2="16" stroke="white" stroke-width="1.5" />
		</svg>
		<span class="text-xl font-semibold text-gray-800">Memorise</span>
	</div>

	<h1 class="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
	<p class="text-sm text-gray-400 mb-8">Please enter your details</p>

	<TabButtons {activeTab} onTabChange={handleTabChange} />

	<form onsubmit={handleSubmit} class="w-full">
		{#if localError || authState.error}
			<div
				class="flex items-center gap-3 px-4 py-3 bg-red-100 text-red-800 rounded-md text-sm mb-6"
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<circle
						cx="8"
						cy="8"
						r="7"
						stroke="currentColor"
						stroke-width="2"
					/>
					<path
						d="M8 4V8M8 12H8.01"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
				{localError || authState.error}
			</div>
		{/if}

		{#if activeTab === "signup"}
			<div class="mb-6">
				<label
					for="name"
					class="block text-sm font-medium text-gray-700 mb-2"
					>Full Name</label
				>
				<input
					id="name"
					type="text"
					placeholder="Enter your full name"
					bind:value={name}
					disabled={authState.loading}
					class="w-full px-4 py-3 border border-gray-200 rounded-lg text-base transition-all outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 disabled:bg-gray-50 disabled:cursor-not-allowed"
				/>
			</div>
		{/if}

		<div class="mb-6">
			<label
				for="email"
				class="block text-sm font-medium text-gray-700 mb-2"
				>Email Address</label
			>
			<input
				id="email"
				type="email"
				placeholder="you@example.com"
				bind:value={email}
				disabled={authState.loading}
				class="w-full px-4 py-3 border border-gray-200 rounded-lg text-base transition-all outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 disabled:bg-gray-50 disabled:cursor-not-allowed"
			/>
		</div>

		<div class="mb-6">
			<label
				for="password"
				class="block text-sm font-medium text-gray-700 mb-2"
				>Password</label
			>
			<input
				id="password"
				type="password"
				placeholder="Enter password"
				bind:value={password}
				disabled={authState.loading}
				class="w-full px-4 py-3 border border-gray-200 rounded-lg text-base transition-all outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 disabled:bg-gray-50 disabled:cursor-not-allowed"
			/>
		</div>

		{#if activeTab === "signup"}
			<div class="mb-6">
				<label
					for="confirmPassword"
					class="block text-sm font-medium text-gray-700 mb-2"
					>Confirm Password</label
				>
				<input
					id="confirmPassword"
					type="password"
					placeholder="Confirm password"
					bind:value={confirmPassword}
					disabled={authState.loading}
					class="w-full px-4 py-3 border border-gray-200 rounded-lg text-base transition-all outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 disabled:bg-gray-50 disabled:cursor-not-allowed"
				/>
			</div>
		{/if}

		<button
			type="submit"
			class="w-full py-3.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-lg text-base font-semibold transition-all hover:shadow-lg hover:shadow-purple-600/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
			disabled={authState.loading}
		>
			{#if authState.loading}
				<span
					class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
				></span>
				Processing...
			{:else}
				Continue
			{/if}
		</button>
	</form>

	<p class="mt-8 text-xs text-gray-400 leading-relaxed text-center">
		Join the creators building personalized AI agents. Log in to your Memorise account to implement, manage, and interact with chatbots backed by their own custom memory.
	</p>
</div>
