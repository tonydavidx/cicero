<script lang="ts">
  let { activeTab, onTabChange, onAddClick }: {
    activeTab: 'feeds' | 'saved';
    onTabChange: (tab: 'feeds' | 'saved') => void;
    onAddClick: () => void;
  } = $props();
</script>

<nav class="w-16 bg-zinc-950 flex flex-col items-center py-4 gap-1 border-r border-zinc-800 shrink-0">
  <div class="mb-4 w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
    C
  </div>

  <button
    class="w-10 h-10 flex items-center justify-center rounded-xl transition-all {activeTab === 'feeds' ? 'bg-emerald-500/15 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}"
    onclick={() => onTabChange('feeds')}
    title="Feeds"
  >
    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  </button>

  <button
    class="w-10 h-10 flex items-center justify-center rounded-xl transition-all {activeTab === 'saved' ? 'bg-amber-500/15 text-amber-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}"
    onclick={() => onTabChange('saved')}
    title="Saved"
  >
    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  </button>

  <div class="flex-1"></div>

  <button
    class="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
    onclick={onAddClick}
    title="Add Feed"
  >
    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </button>
</nav>
