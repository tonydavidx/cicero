<script lang="ts">
  import { onMount } from "svelte";
  import { getDb } from "$lib/rxdb/index";
  import { toggleStarred } from "$lib/rxdb/queries";
  import type { ArticleDoc } from "$lib/rxdb/schemas";
  import type { RxDocument } from "rxdb";

  let { articleId, onClose }: {
    articleId: string;
    onClose: () => void;
  } = $props();

  let article = $state<ArticleDoc | null>(null);
  let doc: RxDocument<ArticleDoc> | null = null;
  let fetchingFull = $state(false);
  let fetchError = $state(false);
  let loading = $state(true);

  onMount(() => {
    let unsub: (() => void) | undefined;

    getDb().then(async (db) => {
      doc = await db.articles.findOne(articleId).exec();
      if (!doc) {
        loading = false;
        return;
      }

      if (!doc.isRead) {
        await doc.patch({
          isRead: true,
          updatedAt: new Date().toISOString(),
        });
      }

      loading = false;
      const sub = doc.$.subscribe((d) => (article = d.toJSON()));
      unsub = () => sub.unsubscribe();
    });

    return () => unsub?.();
  });

  async function fetchFull() {
    if (!article) return;
    fetchingFull = true;
    fetchError = false;

    try {
      const res = await fetch(`/api/articles/${article.id}/fetch-full`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.status === "fetched") {
        const db = await getDb();
        const freshDoc = await db.articles.findOne(article.id).exec();
        await freshDoc?.patch({
          contentFull: data.content,
          contentStatus: "fetched",
          updatedAt: new Date().toISOString(),
        });
      } else {
        fetchError = true;
      }
    } catch {
      fetchError = true;
    } finally {
      fetchingFull = false;
    }
  }

  function handleBackdropClick() {
    onClose();
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onClose()} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex"
  onclick={handleBackdropClick}
  role="presentation"
>
  <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative w-full h-full lg:w-[92vw] lg:h-[90vh] lg:mx-auto lg:mt-auto lg:mb-auto bg-zinc-950 lg:border lg:border-zinc-800 lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && onClose()}
    role="dialog"
    aria-modal="true"
    aria-label="Article viewer"
    tabindex="0"
  >
    {#if loading}
      <div class="flex-1 flex items-center justify-center">
        <div class="w-6 h-6 border-2 border-zinc-600 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    {:else if !article}
      <div class="flex-1 flex items-center justify-center">
        <p class="text-zinc-500">Article not found</p>
      </div>
    {:else}
      <div class="flex items-center justify-between px-6 py-3 border-b border-zinc-800 shrink-0">
        <div class="flex items-center gap-3">
          <button
            onclick={onClose}
            aria-label="Close"
            class="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <span class="w-px h-5 bg-zinc-800"></span>
          <span class="text-xs text-zinc-600">{article.isRead ? "Read" : "Unread"}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            onclick={() => toggleStarred(article!.id, !article!.isStarred)}
            class="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors {article.isStarred ? 'text-amber-400 bg-amber-950/50 hover:bg-amber-950' : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700'}"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="{article.isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {article.isStarred ? "Starred" : "Star"}
          </button>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition-colors no-underline"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Original
          </a>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="max-w-3xl mx-auto px-8 py-8">
          <h1 class="text-3xl font-bold text-zinc-100 leading-tight mb-4">{article.title}</h1>

          <div class="flex items-center gap-3 text-sm text-zinc-500 mb-8">
            {#if article.author}
              <span class="text-zinc-400">{article.author}</span>
              <span class="w-1 h-1 rounded-full bg-zinc-700"></span>
            {/if}
            {#if article.publishedAt}
              <span>{formatDate(article.publishedAt)}</span>
            {/if}
          </div>

          {#if article.imageUrl}
            <img
              src={article.imageUrl}
              alt=""
              class="w-full max-h-80 object-cover rounded-xl mb-8"
              onerror={(e) => (e.target as HTMLElement).style.display = "none"}
            />
          {/if}

          {#if article.contentStatus === "fetched" && article.contentFull}
            <div class="prose prose-invert prose-zinc prose-headings:text-zinc-100 prose-a:text-emerald-400 prose-strong:text-zinc-200 prose-code:text-zinc-300 prose-img:rounded-lg max-w-none">
              {@html article.contentFull}
            </div>
          {:else}
            {#if article.contentRaw}
              <div class="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {@html article.contentRaw}
              </div>
            {/if}

            <div class="mt-8 space-y-4">
              {#if article.contentStatus !== "fetched"}
                <button
                  onclick={fetchFull}
                  disabled={fetchingFull}
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-600 text-zinc-200 rounded-xl transition-colors text-sm font-medium disabled:cursor-not-allowed"
              >
                {#if fetchingFull}
                  <div class="w-4 h-4 border-2 border-zinc-500 border-t-emerald-400 rounded-full animate-spin"></div>
                  Loading full article...
                {:else}
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  View full content
                {/if}
              </button>
              {/if}

              {#if fetchError}
                <div class="flex items-center gap-2 text-sm text-zinc-500">
                  <svg class="w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  Couldn't extract this article.
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-emerald-400 hover:text-emerald-300 underline"
                  >Open original</a>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.article-modal-content img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
  }
</style>
