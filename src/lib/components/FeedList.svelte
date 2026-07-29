<script lang="ts">
  import type { FeedDoc } from "$lib/rxdb/schemas";

  let { feeds, selectedFeedId, onFeedSelect }: {
    feeds: FeedDoc[];
    selectedFeedId: string | null;
    onFeedSelect: (id: string | null) => void;
  } = $props();
</script>

<aside class="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
  <div class="px-4 py-4 border-b border-zinc-800">
    <h2 class="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Feeds</h2>
    <p class="text-xs text-zinc-600 mt-1">{feeds.length} feed{feeds.length !== 1 ? 's' : ''}</p>
  </div>

  <div class="flex-1 overflow-y-auto py-2">
    <button
      class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors {selectedFeedId === null ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}"
      onclick={() => onFeedSelect(null)}
    >
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
      <span class="text-sm font-medium truncate">All feeds</span>
    </button>

    {#each feeds as feed (feed.id)}
      <button
        class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors {selectedFeedId === feed.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}"
        onclick={() => onFeedSelect(feed.id)}
      >
        <div class="w-5 h-5 rounded-md bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
          {(feed.title ?? feed.url).charAt(0).toUpperCase()}
        </div>
        <span class="text-sm font-medium truncate">{feed.title ?? feed.url}</span>
      </button>
    {/each}
  </div>
</aside>
