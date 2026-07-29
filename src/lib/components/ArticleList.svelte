<script lang="ts">
  import type { ArticleDoc, FeedDoc } from "$lib/rxdb/schemas";
  import { toggleRead, toggleStarred } from "$lib/rxdb/queries";

  let { articles, feeds, title, onArticleClick }: {
    articles: ArticleDoc[];
    feeds: FeedDoc[];
    title: string;
    onArticleClick?: (id: string) => void;
  } = $props();

  function getFeed(feedId: string) {
    return feeds.find((f) => f.id === feedId);
  }

  function getFeedName(feedId: string): string {
    return getFeed(feedId)?.title ?? "Unknown";
  }

  function getFeedFavicon(feedId: string): string | null {
    return getFeed(feedId)?.faviconUrl ?? null;
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "now";
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
</script>

<main class="flex-1 bg-zinc-950 overflow-y-auto">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
    <div class="flex items-center justify-between mb-6 lg:mb-8">
      <h1 class="text-xl lg:text-2xl font-bold text-zinc-100">{title}</h1>
      <span class="text-sm text-zinc-500">{articles.length} article{articles.length !== 1 ? "s" : ""}</span>
    </div>

    {#if articles.length === 0}
      <div class="text-center py-24">
        <svg class="w-16 h-16 mx-auto text-zinc-800 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 11a9 9 0 0 1 9 9" />
          <path d="M4 4a16 16 0 0 1 16 16" />
          <circle cx="5" cy="19" r="1" />
        </svg>
        <p class="text-zinc-500 font-medium">No articles yet</p>
        <p class="text-sm text-zinc-600 mt-1">Add some feeds to get started</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {#each articles as article (article.id)}
          <article class="flex flex-col bg-zinc-900/80 rounded-xl border border-zinc-800/50 hover:border-zinc-700/80 transition-all overflow-hidden">
            {#if article.imageUrl}
              <img
                src={article.imageUrl}
                alt=""
                class="w-full h-36 object-cover"
                onerror={(e) => (e.target as HTMLElement).style.display = "none"}
              />
            {/if}
            <button
              onclick={() => onArticleClick?.(article.id)}
              class="w-full text-left p-4 flex-1"
            >
              <div class="flex items-center gap-2 mb-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded truncate max-w-[160px]">
                  {#if getFeedFavicon(article.feedId)}
                    <img
                      src={getFeedFavicon(article.feedId)!}
                      alt=""
                      class="w-3.5 h-3.5 rounded-sm shrink-0"
                      onerror={(e) => (e.target as HTMLElement).style.display = "none"}
                    />
                  {/if}
                  {getFeedName(article.feedId)}
                </span>
              </div>
              <h2 class="text-sm font-semibold leading-snug line-clamp-2 {article.isRead ? 'text-zinc-400' : 'text-zinc-100'}">
                {article.title}
              </h2>
              {#if article.excerpt}
                <p class="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">{article.excerpt}</p>
              {/if}
            </button>

            <div class="flex items-center justify-between px-4 py-2.5 border-t border-zinc-800/50">
              <span class="text-xs text-zinc-600">{formatDate(article.publishedAt)}</span>
              <div class="flex items-center gap-2">
                <button
                  onclick={() => toggleStarred(article.id, !article.isStarred)}
                  aria-label={article.isStarred ? "Unstar" : "Star"}
                  class="p-0.5 transition-colors {article.isStarred ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-600 hover:text-zinc-400'}"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="{article.isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
                <button
                  onclick={() => toggleRead(article.id, !article.isRead)}
                  aria-label={article.isRead ? "Mark unread" : "Mark read"}
                  class="p-0.5 transition-colors {article.isRead ? 'text-zinc-600 hover:text-zinc-400' : 'text-emerald-400 hover:text-emerald-300'}"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    {#if article.isRead}
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    {:else}
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    {/if}
                  </svg>
                </button>
              </div>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</main>
