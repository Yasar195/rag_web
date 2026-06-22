<script lang="ts">
	import { authState } from "$lib/auth.svelte";
	import { goto } from "$app/navigation";
	import { env } from "$env/dynamic/public";

	interface Bot {
		id: string;
		name: string;
		description: string;
		systemPrompt: string;
		userId: string;
	}

	let bots = $state<Bot[]>([]);
	let loadingBots = $state(true);
	let errorBots = $state<string | null>(null);

	// Create Bot Form States
	let showCreateModal = $state(false);
	let newBotName = $state("");
	let newBotDescription = $state("");
	let newBotSystemPrompt = $state("");
	let creatingBot = $state(false);
	let createError = $state<string | null>(null);

	// Configure Memory States
	let showConfigureModal = $state(false);
	let activeConfigureBot = $state<Bot | null>(null);
	let newMemoryText = $state("");
	let addingMemory = $state(false);
	let memoryError = $state<string | null>(null);
	let memorySuccess = $state(false);

	// Handle redirect if not authenticated
	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto("/login");
		}
	});

	$effect(() => {
		if (!authState.loading && authState.user) {
			fetchBots();
		}
	});

	async function fetchBots() {
		loadingBots = true;
		errorBots = null;
		try {
			const token = await authState.user?.getIdToken();
			if (!token) throw new Error("No authorization token available.");

			const backendUrl = env.PUBLIC_BACKEND_URL;
			if (!backendUrl) {
				throw new Error(
					"Backend URL (PUBLIC_BACKEND_URL) is not set in environment.",
				);
			}

			const response = await fetch(`${backendUrl}/bot/get`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(
					errText || `Failed to fetch bots: ${response.status}`,
				);
			}

			const resData = await response.json();
			if (resData.success) {
				bots = resData.data.bots || [];
			} else {
				throw new Error(resData.message || "Failed to retrieve bots");
			}
		} catch (err: any) {
			console.error("Error fetching bots:", err);
			errorBots =
				err.message || "An unknown error occurred while loading bots.";
		} finally {
			loadingBots = false;
		}
	}

	async function handleCreateBot(e: SubmitEvent) {
		e.preventDefault();
		if (!newBotName.trim()) {
			createError = "Bot name is required.";
			return;
		}

		creatingBot = true;
		createError = null;

		try {
			const token = await authState.user?.getIdToken();
			if (!token) throw new Error("No authorization token available.");

			const backendUrl = env.PUBLIC_BACKEND_URL;
			if (!backendUrl) {
				throw new Error(
					"Backend URL (PUBLIC_BACKEND_URL) is not set in environment.",
				);
			}

			const response = await fetch(`${backendUrl}/bot/create`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: newBotName,
					description: newBotDescription || undefined,
					systemPrompt: newBotSystemPrompt || undefined,
				}),
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(
					errText || `Failed to create bot: ${response.status}`,
				);
			}

			const resData = await response.json();
			if (resData.success) {
				// Close modal and reset fields
				showCreateModal = false;
				newBotName = "";
				newBotDescription = "";
				newBotSystemPrompt = "";

				// Re-fetch bots list
				await fetchBots();
			} else {
				throw new Error(resData.message || "Failed to create bot.");
			}
		} catch (err: any) {
			console.error("Error creating bot:", err);
			createError =
				err.message || "Failed to create bot. Please check your connection.";
		} finally {
			creatingBot = false;
		}
	}

	async function handleAddMemory(e: SubmitEvent) {
		e.preventDefault();
		if (!newMemoryText.trim()) {
			memoryError = "Memory text is required.";
			return;
		}
		if (!activeConfigureBot) return;

		addingMemory = true;
		memoryError = null;
		memorySuccess = false;

		try {
			const token = await authState.user?.getIdToken();
			if (!token) throw new Error("No authorization token available.");

			const backendUrl = env.PUBLIC_BACKEND_URL;
			if (!backendUrl) throw new Error("Backend URL is not set.");

			const response = await fetch(
				`${backendUrl}/bot/${activeConfigureBot.id}/memory/create`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ text: newMemoryText }),
				},
			);

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(errText || `Failed to add memory: ${response.status}`);
			}

			const resData = await response.json();
			if (resData.success || response.ok) {
				newMemoryText = "";
				memorySuccess = true;
				setTimeout(() => (memorySuccess = false), 3000);
			} else {
				throw new Error(resData.message || "Failed to save memory.");
			}
		} catch (err: any) {
			console.error("Error adding memory:", err);
			memoryError = err.message || "Failed to add memory. Please try again.";
		} finally {
			addingMemory = false;
		}
	}

	async function handleLogout() {

		try {
			await authState.signOut();
			goto("/login");
		} catch (err) {
			console.error("Logout failed:", err);
		}
	}

	// Helper to get initials
	const getInitials = (
		name: string | null | undefined,
		email: string | null | undefined,
	) => {
		if (name) {
			return name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2);
		}
		if (email) {
			return email.slice(0, 2).toUpperCase();
		}
		return "US";
	};
</script>

<svelte:head>
	<title>Dashboard - Memorise</title>
</svelte:head>

{#if authState.loading}
	<div class="flex items-center justify-center min-h-screen bg-gray-50">
		<div class="flex flex-col items-center gap-4">
			<span
				class="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"
			></span>
			<p class="text-gray-500 font-medium animate-pulse">
				Loading dashboard...
			</p>
		</div>
	</div>
{:else if authState.user}
	<div class="min-h-screen bg-gray-50 flex flex-col">
		<!-- Navigation Bar -->
		<nav
			class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50"
		>
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between h-16 items-center">
					<!-- Brand Logo -->
					<div class="flex items-center gap-3">
						<svg
							width="28"
							height="28"
							viewBox="0 0 32 32"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<rect
								width="32"
								height="32"
								rx="8"
								fill="url(#navLogoGradient)"
							/>
							<defs>
								<linearGradient
									id="navLogoGradient"
									x1="0"
									y1="0"
									x2="32"
									y2="32"
									gradientUnits="userSpaceOnUse"
								>
									<stop stop-color="#8b5cf6" />
									<stop offset="1" stop-color="#3b82f6" />
								</linearGradient>
							</defs>
							<circle
								cx="16"
								cy="16"
								r="6"
								stroke="white"
								stroke-width="2"
							/>
							<circle cx="16" cy="16" r="2" fill="white" />
							<circle cx="16" cy="6" r="1.5" fill="white" />
							<circle cx="16" cy="26" r="1.5" fill="white" />
							<circle cx="6" cy="16" r="1.5" fill="white" />
							<circle cx="26" cy="16" r="1.5" fill="white" />
							<line
								x1="16"
								y1="7.5"
								x2="16"
								y2="10"
								stroke="white"
								stroke-width="1.5"
							/>
							<line
								x1="16"
								y1="22"
								x2="16"
								y2="24.5"
								stroke="white"
								stroke-width="1.5"
							/>
							<line
								x1="7.5"
								y1="16"
								x2="10"
								y2="16"
								stroke="white"
								stroke-width="1.5"
							/>
							<line
								x1="22"
								y1="16"
								x2="24.5"
								y2="16"
								stroke="white"
								stroke-width="1.5"
							/>
						</svg>
						<span
							class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600"
							>Memorise</span
						>
					</div>

					<!-- User Info & Logout -->
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-3">
							<!-- Initials Avatar -->
							<div
								class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md"
							>
								{getInitials(
									authState.user.displayName,
									authState.user.email,
								)}
							</div>
							<span
								class="hidden md:inline text-sm font-medium text-gray-700"
							>
								{authState.user.displayName ||
									authState.user.email}
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
		<main
			class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8"
		>
			<!-- Welcome Banner -->
			<div
				class="bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-blue-900/10 rounded-2xl border border-purple-500/10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm"
			>
				<div>
					<h1
						class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight"
					>
						Welcome back, {authState.user.displayName || "Creator"}
					</h1>
					<p class="text-sm md:text-base text-gray-500 mt-1">
						Logged in as <span class="font-semibold text-purple-600"
							>{authState.user.email}</span
						>. Build and interact with your memory-enabled RAG
						agents.
					</p>
				</div>
				<button
					onclick={() => { showCreateModal = true; createError = null; }}
					class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 active:translate-y-0.5 cursor-pointer"
				>
					<svg
						class="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Create New Bot
				</button>
			</div>

			<!-- Bots Section -->
			<div class="flex flex-col gap-6">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-bold text-gray-900">
							Your Memory-Enabled Bots
						</h2>
						<p class="text-sm text-gray-500">
							All your active agents with customized long-term
							memory prompts.
						</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							onclick={fetchBots}
							disabled={loadingBots}
							class="p-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
							title="Refresh list"
						>
							<svg
								class="w-5 h-5 {loadingBots
									? 'animate-spin'
									: ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18"
								/>
							</svg>
						</button>
					</div>
				</div>

				{#if loadingBots}
					<!-- Skeleton Grid -->
					<div
						class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
					>
						{#each Array(3) as _}
							<div
								class="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5 shadow-sm"
							>
								<div class="flex items-center gap-4">
									<div
										class="w-12 h-12 rounded-xl bg-gray-100 animate-pulse"
									></div>
									<div class="flex-1 flex flex-col gap-2">
										<div
											class="h-4 bg-gray-200 rounded animate-pulse w-3/4"
										></div>
										<div
											class="h-3 bg-gray-150 rounded animate-pulse w-1/2"
										></div>
									</div>
								</div>
								<div class="flex flex-col gap-2">
									<div
										class="h-3 bg-gray-150 rounded animate-pulse w-full"
									></div>
									<div
										class="h-3 bg-gray-150 rounded animate-pulse w-5/6"
									></div>
								</div>
								<div
									class="border-t border-gray-100 pt-4 flex justify-between items-center mt-2"
								>
									<div
										class="h-8 bg-gray-100 rounded animate-pulse w-24"
									></div>
									<div
										class="h-8 bg-gray-100 rounded animate-pulse w-20"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if errorBots}
					<!-- Error State -->
					<div
						class="bg-red-50/50 border border-red-200/60 rounded-2xl p-8 flex flex-col items-center text-center gap-4 max-w-lg mx-auto w-full"
					>
						<div
							class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-bounce"
						>
							<svg
								class="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<div>
							<h3 class="font-bold text-gray-900 text-lg">
								Unable to load bots
							</h3>
							<p class="text-sm text-gray-650 mt-1">
								{errorBots}
							</p>
						</div>
						<button
							onclick={fetchBots}
							class="inline-flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-xl text-sm transition-all cursor-pointer shadow-sm"
						>
							Retry connection
						</button>
					</div>
				{:else if bots.length === 0}
					<!-- Empty State -->
					<div
						class="bg-white border border-gray-100 rounded-2xl p-12 flex flex-col items-center text-center gap-6 shadow-sm"
					>
						<div
							class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600 shadow-inner"
						>
							<!-- Premium robot icon -->
							<svg
								class="w-10 h-10 animate-pulse"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<div class="max-w-md">
							<h3 class="font-bold text-gray-950 text-xl">
								Create your first chatbot
							</h3>
							<p class="text-sm text-gray-500 mt-2">
								Get started by building your first
								memory-enabled agent. You can customize the
								bot's system prompt and long-term memory to suit
								your context.
							</p>
						</div>
						<button
							onclick={() => { showCreateModal = true; createError = null; }}
							class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 active:translate-y-0.5 cursor-pointer"
						>
							<svg
								class="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
							Create New Bot
						</button>
					</div>
				{:else}
					<!-- Bots Grid -->
					<div
						class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
					>
						{#each bots as bot, index}
							<div
								class="bg-white rounded-2xl border border-gray-100 hover:border-purple-200 p-6 flex flex-col justify-between gap-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
							>
								<!-- Subtle decorative background gradient on hover -->
								<div
									class="absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-indigo-500/0 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500"
								></div>

								<div class="flex flex-col gap-4">
									<!-- Bot Header -->
									<div class="flex items-center gap-4">
										<!-- Bot Icon with dynamic premium gradient -->
										<div
											class="w-12 h-12 rounded-xl bg-gradient-to-br {index %
												3 ===
											0
												? 'from-purple-500 to-indigo-600'
												: index % 3 === 1
													? 'from-blue-500 to-cyan-500'
													: 'from-pink-500 to-rose-600'} text-white flex items-center justify-center text-lg font-bold shadow-md shadow-indigo-500/10"
										>
											{bot.name
												? bot.name
														.slice(0, 2)
														.toUpperCase()
												: "AI"}
										</div>
										<div class="flex-1 min-w-0">
											<h3
												class="font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors"
											>
												{bot.name}
											</h3>
											<span
												class="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-green-50 text-green-700 border border-green-200/50 mt-0.5"
											>
												Active
											</span>
										</div>
									</div>

									<!-- Bot Description -->
									<p
										class="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]"
									>
										{bot.description ||
											"No description provided."}
									</p>

									<!-- Bot Prompt Preview -->
									{#if bot.systemPrompt}
										<div
											class="bg-gray-50/80 rounded-xl p-3 border border-gray-100"
										>
											<div
												class="flex items-center justify-between mb-1.5"
											>
												<span
													class="text-2xs font-bold text-gray-400 uppercase tracking-wider"
													>System Prompt</span
												>
												<span
													class="text-2xs text-gray-400 font-mono"
													>Len: {bot.systemPrompt
														.length}</span
												>
											</div>
											<p
												class="text-xs text-gray-650 font-mono line-clamp-3 leading-relaxed whitespace-pre-line"
											>
												{bot.systemPrompt}
											</p>
										</div>
									{/if}
								</div>

								<!-- Bot Actions -->
								<div
									class="border-t border-gray-100 pt-4 flex justify-between items-center mt-2"
								>
									<span
										class="text-2xs text-gray-400 font-mono truncate max-w-[120px]"
										title="Bot ID: {bot.id}"
									>
										ID: {bot.id.slice(0, 8)}...
									</span>
									<div class="flex gap-2">
										<button
											onclick={() => {
												activeConfigureBot = bot;
												showConfigureModal = true;
												memoryError = null;
												memorySuccess = false;
												newMemoryText = '';
											}}
											class="inline-flex items-center justify-center px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-650 bg-white hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer"
										>
											Configure
										</button>
										<a
											href="/dashboard/chat/{bot.id}"
											class="inline-flex items-center justify-center px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
										>
											Chat
										</a>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</main>

		<!-- Create Bot Modal Overlay -->
		{#if showCreateModal}
			<div
				class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
				role="dialog"
				aria-modal="true"
			>
				<!-- Modal Container -->
				<div
					class="bg-white border border-gray-100 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden flex flex-col transition-all duration-300 scale-100 opacity-100"
				>
					<!-- Modal Header -->
					<div
						class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50/30"
					>
						<div class="flex items-center gap-3">
							<div
								class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md"
							>
								<svg
									class="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</div>
							<div>
								<h3 class="font-bold text-gray-900">Create New Chatbot</h3>
								<p class="text-xs text-gray-500">
									Configure your memory-enabled assistant
								</p>
							</div>
						</div>
						<button
							onclick={() => (showCreateModal = false)}
							aria-label="Close modal"
							class="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all cursor-pointer"
						>
							<svg
								class="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<!-- Modal Body Form -->
					<form
						onsubmit={handleCreateBot}
						class="flex flex-col flex-1 p-6 gap-5"
					>
						{#if createError}
							<div
								class="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200/50 text-red-800 rounded-xl text-xs"
							>
								<svg
									class="w-4 h-4 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								<span class="font-medium">{createError}</span>
							</div>
						{/if}

						<div class="flex flex-col gap-2">
							<label
								for="bot-name"
								class="text-xs font-bold text-gray-700 uppercase tracking-wider"
								>Bot Name <span class="text-red-500">*</span></label
							>
							<input
								id="bot-name"
								type="text"
								placeholder="e.g. Personal Assistant, Customer Support"
								bind:value={newBotName}
								disabled={creatingBot}
								required
								class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition-all outline-none focus:border-purple-600 focus:ring-3 focus:ring-purple-650/10 disabled:bg-gray-50 disabled:cursor-not-allowed"
							/>
						</div>

						<div class="flex flex-col gap-2">
							<label
								for="bot-description"
								class="text-xs font-bold text-gray-700 uppercase tracking-wider"
								>Description</label
							>
							<textarea
								id="bot-description"
								rows="2"
								placeholder="What is the purpose of this bot?"
								bind:value={newBotDescription}
								disabled={creatingBot}
								class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition-all outline-none focus:border-purple-600 focus:ring-3 focus:ring-purple-650/10 disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
							></textarea>
						</div>

						<div class="flex flex-col gap-2">
							<label
								for="bot-prompt"
								class="text-xs font-bold text-gray-700 uppercase tracking-wider"
								>System Prompt / Instructions</label
							>
							<textarea
								id="bot-prompt"
								rows="4"
								placeholder="You are an AI assistant. Answer questions truthfully based on..."
								bind:value={newBotSystemPrompt}
								disabled={creatingBot}
								class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono transition-all outline-none focus:border-purple-600 focus:ring-3 focus:ring-purple-650/10 disabled:bg-gray-50 disabled:cursor-not-allowed resize-y"
							></textarea>
							<p class="text-[10px] text-gray-400">
								System prompt configures the AI model's behavior and personality
								guidelines.
							</p>
						</div>

						<!-- Modal Footer Actions -->
						<div
							class="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 mt-2"
						>
							<button
								type="button"
								onclick={() => (showCreateModal = false)}
								disabled={creatingBot}
								class="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={creatingBot}
								class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-lg hover:shadow-purple-500/20 active:translate-y-0.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
							>
								{#if creatingBot}
									<span
										class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
									></span>
									Creating...
								{:else}
									Create Bot
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>
		{/if}

		<!-- Configure Memory Modal Overlay -->
		{#if showConfigureModal && activeConfigureBot}
			<div
				class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
				role="dialog"
				aria-modal="true"
			>
				<div class="bg-white border border-gray-100 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden flex flex-col">
					<!-- Modal Header -->
					<div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50/30">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
								</svg>
							</div>
							<div>
								<h3 class="font-bold text-gray-900">Add Memory</h3>
								<p class="text-xs text-gray-500">
									Teach <span class="font-semibold text-emerald-600">{activeConfigureBot.name}</span> new knowledge
								</p>
							</div>
						</div>
						<button
							onclick={() => { showConfigureModal = false; activeConfigureBot = null; }}
							aria-label="Close modal"
							class="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all cursor-pointer"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<!-- Bot context chip -->
					<div class="px-6 pt-5 pb-0">
						<div class="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
							<div class="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow">
								{activeConfigureBot.name.slice(0, 2).toUpperCase()}
							</div>
							<div class="min-w-0">
								<p class="font-semibold text-sm text-gray-900 truncate">{activeConfigureBot.name}</p>
								{#if activeConfigureBot.description}
									<p class="text-xs text-gray-400 truncate">{activeConfigureBot.description}</p>
								{/if}
							</div>
						</div>
					</div>

					<!-- Form -->
					<form onsubmit={handleAddMemory} class="flex flex-col p-6 gap-5">
						<!-- Success banner -->
						{#if memorySuccess}
							<div class="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-xl text-xs">
								<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<span class="font-medium">Memory saved successfully! The bot has learned this information.</span>
							</div>
						{/if}

						<!-- Error banner -->
						{#if memoryError}
							<div class="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200/50 text-red-800 rounded-xl text-xs">
								<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
								<span class="font-medium">{memoryError}</span>
							</div>
						{/if}

						<div class="flex flex-col gap-2">
							<label for="memory-text" class="text-xs font-bold text-gray-700 uppercase tracking-wider">
								Memory Text <span class="text-red-500">*</span>
							</label>
							<textarea
								id="memory-text"
								rows="5"
								placeholder="e.g. Yasar's best friends are Shibin, Hari, and Akash. He lives in Kerala."
								bind:value={newMemoryText}
								disabled={addingMemory}
								class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition-all outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 disabled:bg-gray-50 disabled:cursor-not-allowed resize-none leading-relaxed"
							></textarea>
							<p class="text-[10px] text-gray-400 leading-relaxed">
								Write a fact, paragraph, or piece of context you want this bot to remember. You can add multiple memories one at a time.
							</p>
						</div>

						<!-- Footer actions -->
						<div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
							<button
								type="button"
								onclick={() => { showConfigureModal = false; activeConfigureBot = null; }}
								disabled={addingMemory}
								class="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer disabled:opacity-50"
							>
								Close
							</button>
							<button
								type="submit"
								disabled={addingMemory}
								class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-500/20 active:translate-y-0.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
							>
								{#if addingMemory}
									<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
									Saving...
								{:else}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
									Save Memory
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>
		{/if}
	</div>
{/if}
