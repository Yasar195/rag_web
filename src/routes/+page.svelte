<script lang="ts">
</script>

<svelte:head>
	<title>Memorise - Custom Memory RAG Chatbots</title>
	<meta name="description" content="A powerful RAG application where users can implement and customize their chatbots with their own personalized long-term memory." />
</svelte:head>

<div class="relative flex flex-col items-center justify-center min-h-screen p-6 text-center bg-radial from-slate-900 via-slate-950 to-black text-white overflow-hidden">
	<!-- Ambient Background Glows -->
	<div class="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
	<div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>

	<div class="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
		<!-- Logo / Emblem -->
		<div class="mb-8 p-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl animate-float">
			<svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect width="32" height="32" rx="8" fill="url(#homeLogoGradient)" />
				<defs>
					<linearGradient id="homeLogoGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
						<stop stop-color="#a855f7" />
						<stop offset="1" stop-color="#3b82f6" />
					</linearGradient>
				</defs>
				<!-- Brain/Chip node icon -->
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
		</div>

		<h1 class="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">
			Memorise
		</h1>
		
		<p class="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
			A RAG application where users can implement their chatbots with their own memory.
		</p>
		
		<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
			<a href="/login" class="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0">
				Get Started
				<svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
				</svg>
			</a>
		</div>
	</div>
</div>

