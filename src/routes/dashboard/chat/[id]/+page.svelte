<script lang="ts">
	import { authState } from "$lib/auth.svelte";
	import { goto } from "$app/navigation";
	import { env } from "$env/dynamic/public";
	import { page } from "$app/stores";
	import { onMount } from "svelte";

	interface Bot {
		id: string;
		name: string;
		description: string;
		systemPrompt: string;
		userId: string;
	}

async function handleAddMemoryInPanel(e?: SubmitEvent) {
	if (e) e.preventDefault();
	if (!newMemoryText.trim() || addingMemory) return;

	addingMemory = true;
	errorMemory = null;
	memorySuccess = false;

	try {
		const token = await authState.user?.getIdToken();
		if (!token) throw new Error("No authorization token available.");

		const backendUrl = env.PUBLIC_BACKEND_URL;
		if (!backendUrl) throw new Error("Backend URL is not set.");

		const response = await fetch(`${backendUrl}/bot/${botId}/memory/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ text: newMemoryText })
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(errText || `Failed to add memory: ${response.status}`);
		}

		const resData = await response.json();
		if (resData.success || response.ok) {
			newMemoryText = "";
			memorySuccess = true;
			// refresh list
			await fetchMemory();
			setTimeout(() => (memorySuccess = false), 3000);
		} else {
			throw new Error(resData.message || "Failed to save memory.");
		}
	} catch (err: any) {
		console.error("Error adding memory:", err);
		errorMemory = err.message || "Failed to add memory. Please try again.";
	} finally {
		addingMemory = false;
	}
}

	interface Message {
		id: string;
		sender: "user" | "bot";
		text: string;
		timestamp: Date;
	}

	interface LLMMessage {
		role: "system" | "user" | "assistant";
		content: string;
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
	let showMemoryPanel = $state(false);

	// Add memory states (for in-panel creation)
	let newMemoryText = $state("");
	let addingMemory = $state(false);
	let memorySuccess = $state(false);

	interface Connector {
		id: string;
		url: string;
		lastUpdated: string;
		botId: string;
	}

	// Connector panel state
	let connectors = $state<Connector[]>([]);
	let loadingConnectors = $state(false);
	let errorConnectors = $state<string | null>(null);
	let showConnectorsPanel = $state(false);

	// Add connector states
	let newConnectorUrl = $state("");
	let addingConnector = $state(false);
	let connectorSuccess = $state(false);
	let refreshingConnectors = $state<Record<string, boolean>>({});


	onMount(() => {
		try {
			showMemoryPanel = window.innerWidth >= 1024;
			showConnectorsPanel = window.innerWidth >= 1024;
		} catch (e) {
			// noop on SSR
		}
	});

	// Redirect if not authenticated
	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto("/login");
		}
	});

	// Fetch bot information, memory & connectors
	$effect(() => {
		if (!authState.loading && authState.user) {
			fetchBotDetails();
			fetchMemory();
			fetchConnectors();
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

	async function fetchConnectors() {
		loadingConnectors = true;
		errorConnectors = null;
		try {
			const token = await authState.user?.getIdToken();
			if (!token) throw new Error("No authorization token available.");
			const backendUrl = env.PUBLIC_BACKEND_URL;
			if (!backendUrl) throw new Error("Backend URL is not set.");

			const response = await fetch(`${backendUrl}/bot/${botId}/connectors/get`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(errText || `Failed to fetch connectors: ${response.status}`);
			}

			const resData = await response.json();
			if (resData.success) {
				connectors = resData.data?.connectors || [];
			} else {
				throw new Error(resData.message || "Failed to load connectors.");
			}
		} catch (err: any) {
			console.error("Error fetching connectors:", err);
			errorConnectors = err.message || "Could not load connectors.";
		} finally {
			loadingConnectors = false;
		}
	}

	async function handleAddConnector(e?: SubmitEvent) {
		if (e) e.preventDefault();
		if (!newConnectorUrl.trim() || addingConnector) return;

		addingConnector = true;
		errorConnectors = null;
		connectorSuccess = false;

		try {
			const token = await authState.user?.getIdToken();
			if (!token) throw new Error("No authorization token available.");

			const backendUrl = env.PUBLIC_BACKEND_URL;
			if (!backendUrl) throw new Error("Backend URL is not set.");

			const response = await fetch(`${backendUrl}/bot/connectors/create`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ botId: botId, url: newConnectorUrl })
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(errText || `Failed to add connector: ${response.status}`);
			}

			const resData = await response.json();
			if (resData.success || response.ok) {
				newConnectorUrl = "";
				connectorSuccess = true;
				// refresh list
				await fetchConnectors();
				setTimeout(() => (connectorSuccess = false), 3000);
			} else {
				throw new Error(resData.message || "Failed to save connector.");
			}
		} catch (err: any) {
			console.error("Error adding connector:", err);
			errorConnectors = err.message || "Failed to add connector. Please try again.";
		} finally {
			addingConnector = false;
		}
	}

	async function handleRefreshConnector(url: string, id: string) {
		if (refreshingConnectors[id]) return;
		refreshingConnectors = { ...refreshingConnectors, [id]: true };
		errorConnectors = null;

		try {
			const token = await authState.user?.getIdToken();
			if (!token) throw new Error("No authorization token available.");

			const backendUrl = env.PUBLIC_BACKEND_URL;
			if (!backendUrl) throw new Error("Backend URL is not set.");

			const response = await fetch(`${backendUrl}/bot/connectors/create`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ botId: botId, url: url })
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(errText || `Failed to refresh: ${response.status}`);
			}

			const resData = await response.json();
			if (resData.success || response.ok) {
				await fetchConnectors();
			} else {
				throw new Error(resData.message || "Failed to refresh connector.");
			}
		} catch (err: any) {
			console.error("Error refreshing connector:", err);
			errorConnectors = err.message || "Failed to refresh connector.";
		} finally {
			refreshingConnectors = { ...refreshingConnectors, [id]: false };
		}
	}

	async function handleSendMessage(e: SubmitEvent) {
		e.preventDefault();
		const trimmedMessage = inputMessage.trim();
		if (!trimmedMessage || sendingMessage) return;

		// Extract conversation history before appending the current message
		const conversation: LLMMessage[] = messages.map(msg => ({
			role: msg.sender === "user" ? "user" : "assistant",
			content: msg.text
		}));

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
					message: trimmedMessage,
					conversation: conversation
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

	function toggleMemoryPanel() {
		showMemoryPanel = !showMemoryPanel;
		try {
			if (showMemoryPanel && window.innerWidth < 768) {
				showConnectorsPanel = false;
			}
		} catch (e) {}
	}

	function toggleConnectorsPanel() {
		showConnectorsPanel = !showConnectorsPanel;
		try {
			if (showConnectorsPanel && window.innerWidth < 768) {
				showMemoryPanel = false;
			}
		} catch (e) {}
	}
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

				<!-- User Profile Info & Sidebar Toggles -->
				{#if authState.user}
					<div class="flex items-center gap-3">
						<!-- Toggle Memory Panel (Left) -->
						<button
							onclick={toggleMemoryPanel}
							class="inline-flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer {showMemoryPanel ? 'border-emerald-200 bg-emerald-50 text-emerald-650 font-semibold' : 'border-gray-200 bg-white text-gray-500 hover:text-gray-905 hover:bg-gray-50'}"
							title="Toggle Memory Panel"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
						</button>

						<!-- Toggle Connectors Panel (Right) -->
						<button
							onclick={toggleConnectorsPanel}
							class="inline-flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer {showConnectorsPanel ? 'border-blue-200 bg-blue-50 text-blue-650 font-semibold' : 'border-gray-200 bg-white text-gray-500 hover:text-gray-905 hover:bg-gray-50'}"
							title="Toggle Connectors Panel"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
							</svg>
						</button>

						<!-- User Profile Avatar -->
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
			<aside class="fixed inset-0 z-50 w-full md:static md:flex md:w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden" class:hidden={!showMemoryPanel}>
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
						<!-- Mobile: close memory panel -->
						<button
							onclick={() => showMemoryPanel = false}
							title="Close"
							class="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all md:hidden"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>

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

				<!-- Add Memory Form (in-panel) -->
				<div class="px-4 py-3 border-t border-gray-100">
					{#if memorySuccess}
						<div class="flex items-center gap-3 px-3 py-2 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-md text-xs mb-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/></svg>
							<span class="font-medium">Memory saved.</span>
						</div>
					{/if}
					{#if errorMemory}
						<div class="flex items-center gap-3 px-3 py-2 bg-red-50 border border-red-200/50 text-red-800 rounded-md text-xs mb-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"/></svg>
							<span class="font-medium">{errorMemory}</span>
						</div>
					{/if}

					<form onsubmit={handleAddMemoryInPanel} class="flex flex-col gap-2">
						<label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Memory Text <span class="text-red-500">*</span></label>
						<textarea rows="3" bind:value={newMemoryText} placeholder="Add your memory here." disabled={addingMemory} class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:border-emerald-500"></textarea>
						<div class="flex items-center justify-end gap-2 mt-1">
							<button type="button" onclick={() => newMemoryText = ''} class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50">Reset</button>
							<button type="submit" disabled={addingMemory} class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:opacity-95 disabled:opacity-60">
								{#if addingMemory}
									<span class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
									Saving...
								{:else}
									Add Memory
								{/if}
							</button>
						</div>
					</form>
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
							<div class="flex items-start gap-3 max-w-[95%] md:max-w-[70%]">
								<div class="w-8 h-8 rounded-lg bg-gray-200"></div>
								<div class="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 h-16 w-64"></div>
							</div>
							<div class="flex items-start gap-3 max-w-[95%] md:max-w-[70%] self-end">
								<div class="bg-purple-200 rounded-2xl rounded-tr-none p-4 h-12 w-48"></div>
							</div>
							<div class="flex items-start gap-3 max-w-[95%] md:max-w-[70%]">
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
								<div class="flex items-end justify-end gap-2.5 max-w-[95%] md:max-w-[85%] self-end">
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
								<div class="flex items-start gap-3 max-w-[95%] md:max-w-[85%]">
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
						<div class="flex items-start gap-3 max-w-[95%] md:max-w-[70%]">
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

		<!-- Right Connectors Panel -->
		{#if showConnectorsPanel}
			<aside class="fixed inset-0 z-50 w-full md:static md:flex md:w-80 flex-shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden animate-fade-in" class:hidden={!showConnectorsPanel}>
				<!-- Panel Header -->
				<div class="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/20 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
							</svg>
						</div>
						<span class="text-xs font-bold text-gray-700 uppercase tracking-wider">Connectors</span>
						{#if connectors.length > 0}
							<span class="text-[10px] font-bold bg-blue-100 text-blue-750 rounded-full px-1.5 py-0.5">{connectors.length}</span>
						{/if}
					</div>
					<div class="flex items-center gap-1.5">
						<!-- Refresh connectors -->
						<button
							onclick={fetchConnectors}
							title="Refresh connectors"
							class="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
						>
							<svg class="w-3.5 h-3.5" class:animate-spin={loadingConnectors} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</button>
						<!-- Close panel -->
						<button
							onclick={() => showConnectorsPanel = false}
							title="Close panel"
							class="p-1 rounded-md text-gray-400 hover:text-gray-750 hover:bg-gray-100 transition-all"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Connectors List -->
				<div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
					{#if loadingConnectors}
						<div class="flex flex-col gap-2 animate-pulse mt-1">
							{#each [1,2,3] as _}
								<div class="bg-gray-100 rounded-xl h-20"></div>
							{/each}
						</div>
					{:else if errorConnectors}
						<div class="mt-4 text-center flex flex-col items-center gap-2 px-2">
							<svg class="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<p class="text-xs text-red-500 font-medium">{errorConnectors}</p>
							<button onclick={fetchConnectors} class="text-[10px] text-blue-600 hover:text-blue-800 underline cursor-pointer">Retry</button>
						</div>
					{:else if connectors.length === 0}
						<div class="mt-6 text-center flex flex-col items-center gap-3 px-3">
							<div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-400">
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
								</svg>
							</div>
							<p class="text-xs font-semibold text-gray-505">No documents connected yet</p>
							<p class="text-[10px] text-gray-400 leading-relaxed">Add links to external documents, Google Sheets, Google Docs or public web pages to sync their knowledge with the bot.</p>
						</div>
					{:else}
						{#each connectors as connector}
							<div class="group relative bg-gray-50 hover:bg-blue-50/50 border border-gray-100 hover:border-blue-200/50 rounded-xl p-3 transition-all duration-200">
								<div class="flex items-start gap-2.5">
									<!-- Dynamic Icon depending on URL type -->
									<div class="mt-0.5 w-6 h-6 rounded-md bg-white border border-gray-100 flex items-center justify-center text-xs flex-shrink-0 shadow-sm group-hover:border-blue-200">
										{#if connector.url.includes("docs.google.com/spreadsheets")}
											<span class="text-green-600 font-bold text-[10px]" title="Google Spreadsheet">田</span>
										{:else if connector.url.includes("docs.google.com/document")}
											<span class="text-blue-500 font-bold text-[10px]" title="Google Document">目</span>
										{:else}
											<span class="text-gray-400 font-bold text-[10px]" title="Web Link">🔗</span>
										{/if}
									</div>
									<div class="flex-1 min-w-0">
										<a
											href={connector.url}
											target="_blank"
											rel="noopener noreferrer"
											class="text-xs font-medium text-gray-700 hover:text-blue-600 transition-colors break-all line-clamp-2 hover:underline cursor-pointer"
										>
											{connector.url}
										</a>
										<p class="text-[9px] text-gray-400 mt-1 font-mono">
											Updated: {new Date(connector.lastUpdated).toLocaleDateString()} {new Date(connector.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
										</p>
									</div>

									<!-- Refresh / Re-sync button -->
									<button
										onclick={() => handleRefreshConnector(connector.url, connector.id)}
										disabled={refreshingConnectors[connector.id]}
										class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
										title="Refresh/Re-sync knowledge"
									>
										<svg class="w-3.5 h-3.5" class:animate-spin={refreshingConnectors[connector.id]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Add Connector Form -->
				<div class="px-4 py-3 border-t border-gray-100 bg-white">
					{#if connectorSuccess}
						<div class="flex items-center gap-3 px-3 py-2 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-md text-xs mb-2 animate-pulse">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/></svg>
							<span class="font-medium">Connection added.</span>
						</div>
					{/if}
					{#if errorConnectors}
						<div class="flex items-center gap-3 px-3 py-2 bg-red-50 border border-red-200/50 text-red-800 rounded-md text-xs mb-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"/></svg>
							<span class="font-medium">{errorConnectors}</span>
						</div>
					{/if}

					<form onsubmit={handleAddConnector} class="flex flex-col gap-2">
						<label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Document URL <span class="text-red-500">*</span></label>
						<input
							type="url"
							required
							bind:value={newConnectorUrl}
							placeholder="https://docs.google.com/spreadsheets/..."
							disabled={addingConnector}
							class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
						/>
						<div class="flex items-center justify-end gap-2 mt-1">
							<button type="button" onclick={() => newConnectorUrl = ''} class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50">Reset</button>
							<button type="submit" disabled={addingConnector || !newConnectorUrl.trim()} class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all">
								{#if addingConnector}
									<span class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
									Syncing...
								{:else}
									Connect
								{/if}
							</button>
						</div>
					</form>
				</div>
			</aside>
		{/if}
	</div>
</div>
