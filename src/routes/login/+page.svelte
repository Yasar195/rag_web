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
				goto('/dashboard');
			}, 1500);
			return () => clearTimeout(timer);
		}
	});

	function handleLoginSubmit(data: LoginCredentials | SignupCredentials) {
		console.log('Form submitted with data:', data);
	}
</script>

<svelte:head>
	<title>Login - Memorise</title>
	<meta name="description" content="Login to your Memorise account to manage your personalized memory-enabled chatbots." />
</svelte:head>

<div class="flex flex-col md:flex-row min-h-screen md:h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-y-auto md:overflow-hidden">
	<div class="w-full md:flex-1 bg-white flex md:h-full md:overflow-y-auto">
		<div class="m-auto w-full py-8 md:py-12">
			<LoginForm onSubmit={handleLoginSubmit} />
		</div>
		</div>

	<div class="w-full md:flex-1 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center p-8 min-h-[320px] md:h-full relative overflow-hidden">
		<!-- Graphic element background decorative circles -->
		<div class="absolute -top-12 -left-12 w-48 h-48 bg-purple-300/30 rounded-full blur-2xl"></div>
		<div class="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-300/30 rounded-full blur-2xl"></div>
		
		<svg viewBox="0 0 200 200" class="w-full max-w-[200px] md:max-w-[300px] h-auto animate-float relative z-10">
			<defs>
				<linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style="stop-color:#a855f7;stop-opacity:1" />
					<stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
				</linearGradient>
				<linearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
					<stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
				</linearGradient>
				<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="5" result="blur" />
					<feComposite in="SourceGraphic" in2="blur" operator="over" />
				</filter>
			</defs>

			<!-- Connecting neural lines -->
			<line x1="50" y1="50" x2="100" y2="100" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5" />
			<line x1="150" y1="50" x2="100" y2="100" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5" />
			<line x1="40" y1="120" x2="100" y2="100" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5" />
			<line x1="160" y1="120" x2="100" y2="100" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5" />
			<line x1="100" y1="160" x2="100" y2="100" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5" />

			<!-- Floating Memory Nodes (Data Dots) -->
			<g filter="url(#glow)">
				<circle cx="50" cy="50" r="12" fill="url(#brainGradient)" />
				<text x="50" y="54" text-anchor="middle" font-size="11" fill="white">📄</text>
			</g>

			<g filter="url(#glow)">
				<circle cx="150" cy="50" r="12" fill="url(#brainGradient)" />
				<text x="150" y="54" text-anchor="middle" font-size="11" fill="white">💾</text>
			</g>

			<g filter="url(#glow)">
				<circle cx="40" cy="120" r="12" fill="url(#chipGradient)" />
				<text x="40" y="124" text-anchor="middle" font-size="11" fill="white">🧠</text>
			</g>

			<g filter="url(#glow)">
				<circle cx="160" cy="120" r="12" fill="url(#chipGradient)" />
				<text x="160" y="124" text-anchor="middle" font-size="11" fill="white">🤖</text>
			</g>

			<!-- Central Robot/Brain/Chip Hub -->
			<rect x="75" y="75" width="50" height="50" rx="14" fill="url(#brainGradient)" filter="url(#glow)" />
			
			<!-- Screen Face -->
			<rect x="82" y="82" width="36" height="36" rx="8" fill="#0f172a" />
			
			<!-- Eyes -->
			<circle cx="93" cy="98" r="3" fill="#38bdf8" />
			<circle cx="107" cy="98" r="3" fill="#38bdf8" />
			<!-- Smile -->
			<path d="M 96 106 Q 100 109 104 106" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" fill="none" />
			
			<!-- Memory pulse line -->
			<path d="M 86 90 Q 90 86 100 90 T 114 90" stroke="#818cf8" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6" />
		</svg>
	</div>
</div>

{#if message}
	<div class="fixed bottom-8 left-8 p-4 bg-emerald-500 text-white rounded-lg shadow-lg z-50">
		<p>{message}</p>
	</div>
{/if}
