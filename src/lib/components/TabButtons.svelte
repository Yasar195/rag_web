<script lang="ts">
	import type { AuthTab } from '$lib/types/auth';

	interface Props {
		activeTab: AuthTab;
		onTabChange: (tab: AuthTab) => void;
	}

	let { activeTab, onTabChange }: Props = $props();
</script>

<div class="flex gap-4 mb-8 border-b border-gray-200">
	<button
		class="flex-1 py-4 bg-none border-b-2 cursor-pointer transition-all duration-300 text-base font-medium
		{activeTab === 'signin' ? 'text-gray-800 border-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-500'}"
		onclick={() => onTabChange('signin')}
	>
		Sign In
	</button>
	<button
		class="flex-1 py-4 bg-none border-b-2 cursor-pointer transition-all duration-300 text-base font-medium
		{activeTab === 'signup' ? 'text-gray-800 border-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-500'}"
		onclick={() => onTabChange('signup')}
	>
		Signup
	</button>
</div>
