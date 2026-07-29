<script lang="ts">
  import type { FeedDoc } from "$lib/rxdb/schemas";

  let { feeds, selectedFeedId, unreadCounts, onFeedSelect }: {
    feeds: FeedDoc[];
    selectedFeedId: string | null;
    unreadCounts: Record<string, number>;
    onFeedSelect: (id: string | null) => void;
  } = $props();

  let totalUnread = $derived(
    Object.values(unreadCounts).reduce((sum, n) => sum + n, 0),
  );
</script>

<aside class="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
  <div class="px-4 py-4 border-b border-zinc-800">
    <div class="flex items-center justify-between">
      <h2 class="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Feeds</h2>
      {#if totalUnread > 0}
        <span class="text-[11px] font-medium text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded-full">{totalUnread}</span>
      {/if}
    </div>
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
      <span class="text-sm font-medium truncate flex-1">All feeds</span>
      {#if totalUnread > 0}
        <span class="text-[11px] font-medium text-zinc-500">{totalUnread}</span>
      {/if}
    </button>

    {#each feeds as feed (feed.id)}
      <button
        class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors {selectedFeedId === feed.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}"
        onclick={() => onFeedSelect(feed.id)}
      >
        {#if feed.faviconUrl}
          <img
            src={feed.faviconUrl}
            alt=""
            class="w-5 h-5 rounded-md shrink-0"
            onerror={(e) => (e.target as HTMLElement).style.display = "none"}
          />
        {/if}
        <div class="w-5 h-5 rounded-md bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0 {feed.faviconUrl ? 'hidden' : ''}">
          {(feed.title ?? feed.url).charAt(0).toUpperCase()}
        </div>
        <span class="text-sm font-medium truncate flex-1">{feed.title ?? feed.url}</span>
        {#if (unreadCounts[feed.id] ?? 0) > 0}
          <span class="text-[11px] font-medium text-zinc-500">{unreadCounts[feed.id]}</span>
        {/if}
      </button>
    {/each}
  </div>
</aside>
