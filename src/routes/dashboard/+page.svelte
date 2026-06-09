<script lang="ts">
	import { authState } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';

	// Handle redirect if not authenticated
	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto('/login');
		}
	});

	async function handleLogout() {
		try {
			await authState.signOut();
			goto('/login');
		} catch (err) {
			console.error('Logout failed:', err);
		}
	}

	// Helper to get initials
	const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
		if (name) {
			return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
		}
		if (email) {
			return email.slice(0, 2).toUpperCase();
		}
		return 'US';
	};
</script>

<svelte:head>
	<title>Dashboard - Memorise</title>
</svelte:head>

{#if authState.loading}
	<div class="flex items-center justify-center min-h-screen bg-gray-50">
		<div class="flex flex-col items-center gap-4">
			<span class="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></span>
			<p class="text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
		</div>
	</div>
{:else if authState.user}
	<div class="min-h-screen bg-gray-50 flex flex-col">
		<!-- Navigation Bar -->
		<nav class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between h-16 items-center">
					<!-- Brand Logo -->
					<div class="flex items-center gap-3">
						<svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect width="32" height="32" rx="8" fill="url(#navLogoGradient)" />
							<defs>
								<linearGradient id="navLogoGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
									<stop stop-color="#8b5cf6" />
									<stop offset="1" stop-color="#3b82f6" />
								</linearGradient>
							</defs>
							<circle cx="16" cy="16" r="6" stroke="white" stroke-width="2" />
							<circle cx="16" cy="16" r="2" fill="white" />
							<circle cx="16" cy="6" r="1.5" fill="white" />
							<circle cx="16" cy="26" r="1.5" fill="white" />
							<circle cx="6" cy="16" r="1.5" fill="white" />
							<circle cx="26" cy="16" r="1.5" fill="white" />
							<line x1="16" y1="7.5" x2="16" y2="10" stroke="white" stroke-width="1.5" />
							<line x1="16" y1="22" x2="16" y2="24.5" stroke="white" stroke-width="1.5" />
							<line x1="7.5" y1="16" x2="10" y2="16" stroke="white" stroke-width="1.5" />
							<line x1="22" y1="16" x2="24.5" y2="16" stroke="white" stroke-width="1.5" />
						</svg>
						<span class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">Memorise</span>
					</div>

					<!-- User Info & Logout -->
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-3">
							<!-- Initials Avatar -->
							<div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md animate-pulse">
								{getInitials(authState.user.displayName, authState.user.email)}
							</div>
							<span class="hidden md:inline text-sm font-medium text-gray-700">
								{authState.user.displayName || authState.user.email}
							</span>
						</div>

						<button 
							onclick={handleLogout}
							class="inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm cursor-pointer"
						>
							Logout
						</button>
					</div>
				</div>
			</div>
		</nav>

		<!-- Main Content Area -->
		<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div class="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
				<h1 class="text-3xl font-bold text-gray-950 mb-2">Welcome to Memorise</h1>
				<p class="text-gray-500">You are logged in as <span class="font-semibold text-gray-700">{authState.user.email}</span>. Implement and interact with your custom memory-enabled chatbots here.</p>
			</div>
		</main>
	</div>
{/if}
