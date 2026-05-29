<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	import type { LoginCredentials, SignupCredentials } from '$lib/types/auth';
	import { authState } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';

	let message = $state('');

	$effect(() => {
		if (authState.user) {
			message = 'Successfully authenticated! Redirecting...';
			const timer = setTimeout(() => {
				goto('/');
			}, 1500);
			return () => clearTimeout(timer);
		}
	});

	function handleLoginSubmit(data: LoginCredentials | SignupCredentials) {
		console.log('Form submitted with data:', data);
	}
</script>

<svelte:head>
	<title>Login - SmartSave</title>
	<meta name="description" content="Login to your SmartSave account" />
</svelte:head>

<div class="flex flex-col md:flex-row min-h-screen md:h-screen bg-gradient-to-br from-sky-50 to-sky-100 overflow-y-auto md:overflow-hidden">
	<div class="w-full md:flex-1 bg-white flex md:h-full md:overflow-y-auto">
		<div class="m-auto w-full py-8 md:py-12">
			<LoginForm onSubmit={handleLoginSubmit} />
		</div>
	</div>

	<div class="w-full md:flex-1 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center p-8 min-h-[320px] md:h-full">
		<svg viewBox="0 0 200 200" class="w-full max-w-[200px] md:max-w-[300px] h-auto animate-float">
			<defs>
				<linearGradient id="safeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
					<stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
				</linearGradient>
			</defs>

			<!-- Safe box -->
			<rect x="40" y="50" width="120" height="100" rx="12" fill="url(#safeGradient)" />

			<!-- Door -->
			<rect x="50" y="60" width="80" height="80" rx="8" fill="#2563eb" opacity="0.9" />

			<!-- Dial -->
			<circle cx="90" cy="100" r="20" fill="#60a5fa" />
			<circle cx="90" cy="100" r="15" fill="#3b82f6" />

			<!-- Dial numbers -->
			<text x="90" y="92" text-anchor="middle" font-size="8" fill="white" font-weight="bold"
				>0</text
			>
			<text x="110" y="105" text-anchor="middle" font-size="8" fill="white" font-weight="bold"
				>9</text
			>
			<text x="90" y="118" text-anchor="middle" font-size="8" fill="white" font-weight="bold"
				>5</text
			>

			<!-- Indicator -->
			<line x1="90" y1="80" x2="90" y2="75" stroke="white" stroke-width="2" stroke-linecap="round" />

			<!-- Light reflection -->
			<ellipse cx="60" cy="70" rx="15" ry="20" fill="white" opacity="0.2" />
		</svg>
	</div>
</div>

{#if message}
	<div class="fixed bottom-8 left-8 p-4 bg-emerald-500 text-white rounded-lg shadow-lg z-50">
		<p>{message}</p>
	</div>
{/if}
