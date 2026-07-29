<script lang="ts">
  import type { ArticleDoc, FeedDoc } from "$lib/rxdb/schemas";
  import { toggleRead, toggleStarred } from "$lib/rxdb/queries";

  let { articles, feeds, title, onArticleClick }: {
    articles: ArticleDoc[];
    feeds: FeedDoc[];
    title: string;
    onArticleClick?: (id: string) => void;
  } = $props();

  function getFeedName(feedId: string): string {
    return feeds.find((f) => f.id === feedId)?.title ?? "Unknown";
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
</script>

<main class="flex-1 bg-zinc-950 overflow-y-auto">
  <div class="max-w-3xl mx-auto px-8 py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-zinc-100">{title}</h1>
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
      <div class="space-y-2">
        {#each articles as article (article.id)}
          <article
            class="bg-zinc-900/80 rounded-xl border {article.isRead ? 'border-zinc-800/60' : 'border-l-4 border-l-emerald-500 border-t border-r border-b border-zinc-800/60'} hover:border-zinc-700 transition-all"
          >
            <button
              onclick={() => onArticleClick?.(article.id)}
              class="w-full text-left px-5 pt-4 pb-3 no-underline text-inherit"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      {getFeedName(article.feedId)}
                    </span>
                    {#if article.publishedAt}
                      <span class="text-xs text-zinc-500">{formatDate(article.publishedAt)}</span>
                    {/if}
                  </div>
                  <h2 class="text-[15px] font-semibold leading-snug {article.isRead ? 'text-zinc-500' : 'text-zinc-100'}">
                    {article.title}
                  </h2>
                  {#if article.excerpt}
                    <p class="text-sm text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">{article.excerpt}</p>
                  {/if}
                </div>
              </div>
            </button>
            <div class="flex items-center gap-1 px-5 py-2.5 border-t border-zinc-800">
              <button
                onclick={() => toggleRead(article.id, !article.isRead)}
                class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors {article.isRead ? 'text-zinc-500 hover:text-zinc-300 bg-zinc-800 hover:bg-zinc-700' : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-950'}"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  {#if article.isRead}
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  {:else}
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  {/if}
                </svg>
                {article.isRead ? "Unread" : "Read"}
              </button>
              <button
                onclick={() => toggleStarred(article.id, !article.isStarred)}
                class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors {article.isStarred ? 'text-amber-400 bg-amber-950/50 hover:bg-amber-950' : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800 hover:bg-zinc-700'}"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="{article.isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {article.isStarred ? "Starred" : "Star"}
              </button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</main>
