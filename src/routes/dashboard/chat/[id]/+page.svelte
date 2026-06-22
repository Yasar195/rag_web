<script lang="ts">
	import { authState } from "$lib/auth.svelte";
	import { goto } from "$app/navigation";
	import { env } from "$env/dynamic/public";
	import { page } from "$app/stores";

	interface Bot {
		id: string;
		name: string;
		description: string;
		systemPrompt: string;
		userId: string;
	}

	interface Message {
		id: string;
		sender: "user" | "bot";
		text: string;
		timestamp: Date;
	}

	const botId = $page.params.id;

	let bot = $state<Bot | null>(null);
	let loadingBot = $state(true);
	let errorBot = $state<string | null>(null);

	let messages = $state<Message[]>([]);
	let inputMessage = $state("");
	let sendingMessage = $state(false);
	let askError = $state<string | null>(null);

	let chatContainer: HTMLDivElement | undefined = $state();

	// Memory panel state
	let memories = $state<string[]>([]);
	let loadingMemory = $state(false);
	let errorMemory = $state<string | null>(null);
	let showMemoryPanel = $state(true);

	// Redirect if not authenticated
	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto("/login");
		}
	});

	// Fetch bot information & memory
	$effect(() => {
		if (!authState.loading && authState.user) {
			fetchBotDetails();
			fetchMemory();
		}
	});

	// Auto scroll to bottom when messages list changes
	$effect(() => {
		if (messages.length > 0 && chatContainer) {
			setTimeout(() => {
				if (chatContainer) {
					chatContainer.scrollTop = chatContainer.scrollHeight;
				}
			}, 60);
		}
	});

	async function fetchBotDetails() {
		loadingBot = true;
		errorBot = null;
		try {
			const token = await authState.user?.getIdToken();
			if (!token) throw new Error("No authorization token available.");

			const backendUrl = env.PUBLIC_BACKEND_URL;
			if (!backendUrl) {
				throw new Error("Backend URL (PUBLIC_BACKEND_URL) is not set in environment.");
			}

			const response = await fetch(`${backendUrl}/bot/get`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(errText || `Failed to fetch bot details: ${response.status}`);
			}

			const resData = await response.json();
			if (resData.success) {
				const botList: Bot[] = resData.data.bots || [];
				const foundBot = botList.find((b) => b.id === botId);
				if (foundBot) {
					bot = foundBot;
				} else {
					throw new Error("Bot not found.");
				}
			} else {
				throw new Error(resData.message || "Failed to retrieve bots.");
			}
		} catch (err: any) {
			console.error("Error fetching bot details:", err);
			errorBot = err.message || "An unknown error occurred while loading bot details.";
		} finally {
			loadingBot = false;
		}
	}

	async function fetchMemory() {
		loadingMemory = true;
		errorMemory = null;
		try {
			const token = await authState.user?.getIdToken();
			if (!token) throw new Error("No authorization token available.");
			const backendUrl = env.PUBLIC_BACKEND_URL;
			if (!backendUrl) throw new Error("Backend URL is not set.");

			const response = await fetch(`${backendUrl}/bot/${botId}/memory/get`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(errText || `Failed to fetch memory: ${response.status}`);
			}

			const resData = await response.json();
			if (resData.success) {
				memories = resData.data?.memory || [];
			} else {
				throw new Error(resData.message || "Failed to load memory.");
			}
		} catch (err: any) {
			console.error("Error fetching memory:", err);
			errorMemory = err.message || "Could not load memory.";
		} finally {
			loadingMemory = false;
		}
	}

	async function handleSendMessage(e: SubmitEvent) {
		e.preventDefault();
		const trimmedMessage = inputMessage.trim();
		if (!trimmedMessage || sendingMessage) return;

		// Append user message
		const userMsg: Message = {
			id: Math.random().toString(36).substring(7),
			sender: "user",
			text: trimmedMessage,
			timestamp: new Date()
		};
		messages = [...messages, userMsg];
		inputMessage = "";
		sendingMessage = true;
		askError = null;

		try {
			const token = await authState.user?.getIdToken();
			if (!token) throw new Error("No authorization token available.");

			const backendUrl = env.PUBLIC_BACKEND_URL;
			if (!backendUrl) {
				throw new Error("Backend URL (PUBLIC_BACKEND_URL) is not set in environment.");
			}

			const response = await fetch(`${backendUrl}/bot/${botId}/memory/ask`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					message: trimmedMessage
				})
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(errText || `Failed to get response: ${response.status}`);
			}

			const resData = await response.json();
			
			let responseText = "";
			if (resData.success) {
				responseText =
					resData.data?.content ||
					resData.data?.response ||
					resData.data?.answer ||
					resData.data?.message ||
					resData.data ||
					"No response received.";
			} else {
				throw new Error(resData.message || "Failed to generate answer.");
			}

			// Append bot message
			const botMsg: Message = {
				id: Math.random().toString(36).substring(7),
				sender: "bot",
				text: responseText,
				timestamp: new Date()
			};
			messages = [...messages, botMsg];
		} catch (err: any) {
			console.error("Error asking bot:", err);
			askError = err.message || "Failed to send message. Please check your connection and try again.";
		} finally {
			sendingMessage = false;
		}
	}

	// Helper to get initials for avatar
	const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
		if (name) {
			return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
		}
		if (email) {
			return email.slice(0, 2).toUpperCase();
		}
		return "US";
	};
</script>

<svelte:head>
	<title>{bot ? `${bot.name} - Chat` : 'Chat'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
	<!-- Chat Navbar -->
	<header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16 items-center">
				<!-- Navigation Back & Bot Details -->
				<div class="flex items-center gap-4 min-w-0">
					<a 
						href="/dashboard" 
						class="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all cursor-pointer"
						title="Back to Dashboard"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
					</a>

					{#if bot}
						<div class="flex items-center gap-3 min-w-0">
							<!-- Bot Icon with premium gradient -->
							<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-indigo-500/10 flex-shrink-0">
								{bot.name ? bot.name.slice(0, 2).toUpperCase() : 'AI'}
							</div>
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<h1 class="font-bold text-gray-900 truncate text-base leading-tight">{bot.name}</h1>
									<span class="w-2 h-2 rounded-full bg-green-500 animate-ping flex-shrink-0"></span>
								</div>
								<p class="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-md">{bot.description || 'Memory-enabled RAG agent'}</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- User Profile Info -->
				{#if authState.user}
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
							{getInitials(authState.user.displayName, authState.user.email)}
						</div>
						<span class="hidden md:inline text-sm font-medium text-gray-700">
							{authState.user.displayName || authState.user.email}
						</span>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<!-- Body: Memory Sidebar + Chat -->
	<div class="flex flex-1 overflow-hidden">

		<!-- Left Memory Panel -->
		{#if showMemoryPanel}
			<aside class="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
				<!-- Panel Header -->
				<div class="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50/20 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
							</svg>
						</div>
						<span class="text-xs font-bold text-gray-700 uppercase tracking-wider">Memory</span>
						{#if memories.length > 0}
							<span class="text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5">{memories.length}</span>
						{/if}
					</div>
					<button
						onclick={fetchMemory}
						title="Refresh memory"
						class="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
					>
						<svg class="w-3.5 h-3.5" class:animate-spin={loadingMemory} fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
					</button>
				</div>

				<!-- Memory Items -->
				<div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
					{#if loadingMemory}
						<div class="flex flex-col gap-2 animate-pulse mt-1">
							{#each [1,2,3] as _}
								<div class="bg-gray-100 rounded-xl h-14"></div>
							{/each}
						</div>
					{:else if errorMemory}
						<div class="mt-4 text-center flex flex-col items-center gap-2 px-2">
							<svg class="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<p class="text-xs text-red-500 font-medium">{errorMemory}</p>
							<button onclick={fetchMemory} class="text-[10px] text-emerald-600 hover:text-emerald-800 underline cursor-pointer">Retry</button>
						</div>
					{:else if memories.length === 0}
						<div class="mt-6 text-center flex flex-col items-center gap-3 px-3">
							<div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-400">
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
							<p class="text-xs font-semibold text-gray-500">No memories yet</p>
							<p class="text-[10px] text-gray-400 leading-relaxed">Use Configure on the dashboard to teach this bot new knowledge.</p>
						</div>
					{:else}
						{#each memories as mem, i}
							<div class="group relative bg-gray-50 hover:bg-emerald-50/60 border border-gray-100 hover:border-emerald-200/60 rounded-xl p-3 transition-all duration-200">
								<div class="flex items-start gap-2">
									<span class="mt-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-100 rounded-md px-1.5 py-0.5 flex-shrink-0">#{i + 1}</span>
									<p class="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{mem.trim()}</p>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</aside>
		{/if}

		<!-- Right: Scrollable Chat Column -->
		<div class="flex flex-1 flex-col overflow-hidden">

	<!-- Main Chat Area -->
	<div
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto bg-gray-50/50"
	>
		<div class="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

			{#if loadingBot}
				<!-- Loading state skeleton -->
				<div class="flex flex-col gap-6 animate-pulse">
					<div class="flex items-start gap-3 max-w-[70%]">
						<div class="w-8 h-8 rounded-lg bg-gray-200"></div>
						<div class="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 h-16 w-64"></div>
					</div>
					<div class="flex items-start gap-3 max-w-[70%] self-end">
						<div class="bg-purple-200 rounded-2xl rounded-tr-none p-4 h-12 w-48"></div>
					</div>
					<div class="flex items-start gap-3 max-w-[70%]">
						<div class="w-8 h-8 rounded-lg bg-gray-200"></div>
						<div class="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 h-24 w-80"></div>
					</div>
				</div>
			{:else if errorBot}
				<!-- Error state -->
				<div class="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4 max-w-lg mx-auto mt-12 shadow-sm">
					<div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-bounce">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<div>
						<h3 class="font-bold text-gray-900 text-lg">Unable to load bot chat</h3>
						<p class="text-sm text-gray-600 mt-1">{errorBot}</p>
					</div>
					<button 
						onclick={fetchBotDetails}
						class="inline-flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-xl text-sm transition-all cursor-pointer shadow-sm"
					>
						Retry connection
					</button>
				</div>
			{:else if messages.length === 0}
				<!-- Welcoming Empty State -->
				<div class="flex flex-col items-center justify-center text-center py-16 px-4 gap-6 max-w-md mx-auto">
					<div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-600 flex items-center justify-center shadow-inner">
						<svg class="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
					</div>
					<div>
						<h2 class="font-bold text-gray-900 text-xl">Chat with {bot?.name}</h2>
						<p class="text-sm text-gray-500 mt-2">
							Ask anything! This assistant uses memory-enabled retrieval to search context from your previous conversations and respond intelligently.
						</p>
					</div>
					{#if bot?.systemPrompt}
						<div class="w-full bg-white border border-gray-150 rounded-2xl p-4 text-left shadow-sm">
							<span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">System Instructions</span>
							<p class="text-xs text-gray-600 font-mono line-clamp-3 leading-relaxed whitespace-pre-line">{bot.systemPrompt}</p>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Messages Feed -->
				<div class="flex flex-col gap-6">
					{#each messages as msg}
						{#if msg.sender === 'user'}
							<!-- User Message -->
							<div class="flex items-end justify-end gap-2.5 max-w-[85%] self-end">
								<div class="flex flex-col items-end gap-1">
									<div class="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl rounded-br-none px-4 py-3 shadow-md shadow-indigo-500/5 text-sm leading-relaxed whitespace-pre-wrap break-words">
										{msg.text}
									</div>
									<span class="text-[10px] text-gray-400 font-mono px-1">
										{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</span>
								</div>
							</div>
						{:else}
							<!-- Bot Message -->
							<div class="flex items-start gap-3 max-w-[85%]">
								<!-- Bot Icon -->
								<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-indigo-500/10 flex-shrink-0 mt-0.5">
									{bot?.name ? bot.name.slice(0, 2).toUpperCase() : 'AI'}
								</div>
								<div class="flex flex-col gap-1">
									<div class="bg-white border border-gray-100 text-gray-900 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words">
										{msg.text}
									</div>
									<span class="text-[10px] text-gray-400 font-mono px-1">
										{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</span>
								</div>
							</div>
						{/if}
					{/each}

					<!-- Typing Indicator -->
					{#if sendingMessage}
						<div class="flex items-start gap-3 max-w-[70%]">
							<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-indigo-500/10 flex-shrink-0 mt-0.5">
								{bot?.name ? bot.name.slice(0, 2).toUpperCase() : 'AI'}
							</div>
							<div class="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-1.5 min-h-[44px]">
								<span class="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
								<span class="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
								<span class="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
	 
	<!-- Bottom Chat Input Bar -->
	<div class="bg-white border-t border-gray-100 shadow-lg px-4 py-4 md:py-6 z-20">
		<div class="max-w-4xl mx-auto w-full flex flex-col gap-3">
			<!-- Ask Error Message Alert -->
			{#if askError}
				<div class="flex items-center justify-between gap-3 px-4 py-2.5 bg-red-50 border border-red-200/50 text-red-800 rounded-xl text-xs">
					<div class="flex items-center gap-2">
						<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<span class="font-medium">{askError}</span>
					</div>
					<button 
						onclick={() => askError = null}
						class="text-red-500 hover:text-red-900 transition-colors p-1 cursor-pointer"
					>
						Close
					</button>
				</div>
			{/if}

			<!-- Input Form -->
			<form 
				onsubmit={handleSendMessage}
				class="w-full flex items-center gap-3"
			>
				<input 
					type="text" 
					placeholder={bot ? `Ask ${bot.name}...` : 'Type a message...'} 
					bind:value={inputMessage}
					disabled={loadingBot || sendingMessage}
					class="flex-1 px-5 py-3.5 border border-gray-200 rounded-xl text-sm transition-all outline-none focus:border-purple-600 focus:ring-3 focus:ring-purple-600/10 disabled:bg-gray-50 disabled:cursor-not-allowed shadow-inner bg-gray-50/50"
				/>
				
				<button 
					type="submit"
					disabled={loadingBot || sendingMessage || !inputMessage.trim()}
					class="h-[50px] w-[50px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md transition-all hover:shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
					title="Send Message"
				>
					<svg class="w-5 h-5 transform rotate-45 -translate-x-0.5 -translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
					</svg>
				</button>
			</form>
		</div>
	</div>

</div>
</div>
</div>
