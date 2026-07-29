<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { getDb } from "$lib/rxdb/index";
    import { toggleRead, toggleStarred } from "$lib/rxdb/queries";
    import type { ArticleDoc } from "$lib/rxdb/schemas";
    import type { RxDocument } from "rxdb";

    let article = $state<ArticleDoc | null>(null);
    let doc: RxDocument<ArticleDoc> | null = null;
    let fetchingFull = $state(false);
    let fetchError = $state(false);

    onMount(() => {
        let unsub: (() => void) | undefined;

        getDb().then(async (db) => {
            doc = await db.articles.findOne($page.params.id).exec();
            if (!doc) return;

            // mark read on open
            if (!doc.isRead) {
                await doc.patch({
                    isRead: true,
                    updatedAt: new Date().toISOString(),
                });
            }

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
                await doc?.patch({
                    contentFull: data.content,
                    contentStatus: "fetched",
                    updatedAt: new Date().toISOString(),
                });
            } else {
                await doc?.patch({
                    contentStatus: "failed",
                    updatedAt: new Date().toISOString(),
                });
                fetchError = true;
            }
        } catch {
            fetchError = true;
        } finally {
            fetchingFull = false;
        }
    }
</script>

{#if article}
    <article class="reader">
        <a href="/" class="back">&larr; Back</a>
        <h1>{article.title}</h1>
        <div class="meta">
            {#if article.author}<span>{article.author}</span>{/if}
            {#if article.publishedAt}<span
                    >{new Date(article.publishedAt).toLocaleDateString()}</span
                >{/if}
            <button
                onclick={() => toggleStarred(article!.id, !article!.isStarred)}
            >
                {article.isStarred ? "★ Starred" : "☆ Star"}
            </button>
        </div>

        {#if article.contentStatus === "fetched" && article.contentFull}
            {@html article.contentFull}
        {:else}
            {#if article.contentRaw}
                <div class="snippet">{@html article.contentRaw}</div>
            {/if}

            {#if article.contentStatus !== "failed"}
                <button
                    class="fetch-full"
                    onclick={fetchFull}
                    disabled={fetchingFull}
                >
                    {fetchingFull
                        ? "Loading full article…"
                        : "View full content"}
                </button>
            {/if}

            {#if fetchError || article.contentStatus === "failed"}
                <p class="error">
                    Couldn't extract this article. <a
                        href={article.url}
                        target="_blank">Open original</a
                    >
                </p>
            {/if}
        {/if}

        <a class="original-link" href={article.url} target="_blank"
            >View original</a
        >
    </article>
{:else}
    <p>Loading…</p>
{/if}

<style>
    .reader {
        max-width: 680px;
        margin: 0 auto;
        padding: 2rem 1rem;
        line-height: 1.6;
    }
    .back {
        display: inline-block;
        margin-bottom: 1rem;
        color: #666;
        text-decoration: none;
    }
    .meta {
        display: flex;
        gap: 1rem;
        align-items: center;
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
    }
    .fetch-full {
        display: block;
        margin: 1.5rem 0;
        padding: 0.6rem 1.2rem;
    }
    .error {
        color: #dc2626;
    }
    .original-link {
        display: block;
        margin-top: 2rem;
        font-size: 0.9rem;
    }
    .snippet :global(img),
    .reader :global(img) {
        max-width: 100%;
    }
</style>
