<script lang="ts">
    import { onMount } from "svelte";
    import {
        watchFeeds,
        watchArticles,
        toggleRead,
        toggleStarred,
    } from "$lib/rxdb/queries";
    import type { ArticleDoc, FeedDoc } from "$lib/rxdb/schemas";
    import { triggerSync } from "$lib/rxdb/replication";

    let feeds = $state<FeedDoc[]>([]);
    let articles = $state<ArticleDoc[]>([]);
    let selectedFeedId = $state<string | null>(null);
    let newFeedUrl = $state("");
    let addingFeed = $state(false);
    let addFeedError = $state("");

    onMount(() => {
        const unsubFeeds = watchFeeds((f) => (feeds = f));
        return unsubFeeds;
    });

    $effect(() => {
        const unsubArticles = watchArticles(
            selectedFeedId,
            (a) => (articles = a),
        );
        return unsubArticles;
    });

    async function addFeed(e: SubmitEvent) {
        e.preventDefault();
        if (!newFeedUrl.trim()) return;

        addingFeed = true;
        addFeedError = "";

        const res = await fetch("/api/feeds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: newFeedUrl.trim() }),
        });

        addingFeed = false;

        if (res.ok) {
            newFeedUrl = "";
            triggerSync();
        } else {
            const data = await res
                .json()
                .catch(() => ({ message: "Failed to add feed" }));
            addFeedError = data.message ?? "Failed to add feed";
        }
    }
</script>

<div class="layout">
    <aside class="feeds">
        <h2>Feeds</h2>
        <form onsubmit={addFeed} class="add-feed">
            <input
                type="url"
                bind:value={newFeedUrl}
                placeholder="https://example.com/feed.xml"
                required
            />
            <button type="submit" disabled={addingFeed}
                >{addingFeed ? "Adding…" : "Add"}</button
            >
            {#if addFeedError}<p class="error">{addFeedError}</p>{/if}
        </form>
        <button
            class:active={selectedFeedId === null}
            onclick={() => (selectedFeedId = null)}
        >
            All feeds
        </button>
        {#each feeds as feed (feed.id)}
            <button
                class:active={selectedFeedId === feed.id}
                onclick={() => (selectedFeedId = feed.id)}
            >
                {feed.title ?? feed.url}
            </button>
        {/each}
    </aside>

    <main class="articles">
        {#each articles as article (article.id)}
            <a
                href={`/articles/${article.id}`}
                class="article"
                class:read={article.isRead}
            >
                <div class="article-title">{article.title}</div>
                {#if article.author}<div class="article-author">
                        {article.author}
                    </div>{/if}
                <div class="article-excerpt">{article.excerpt ?? ""}</div>
                <div class="article-actions">
                    <button
                        onclick={(e) => {
                            e.preventDefault();
                            toggleRead(article.id, !article.isRead);
                        }}
                    >
                        {article.isRead ? "Mark unread" : "Mark read"}
                    </button>
                    <button
                        onclick={(e) => {
                            e.preventDefault();
                            toggleStarred(article.id, !article.isStarred);
                        }}
                    >
                        {article.isStarred ? "★ Starred" : "☆ Star"}
                    </button>
                </div>
            </a>
        {/each}
    </main>
</div>

<style>
    .layout {
        display: flex;
        height: 100vh;
    }
    .feeds {
        width: 220px;
        border-right: 1px solid #e5e5e5;
        padding: 1rem;
        overflow-y: auto;
    }
    .feeds button {
        display: block;
        width: 100%;
        text-align: left;
        padding: 0.5rem;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: 4px;
    }
    .feeds button.active {
        background: #eef2ff;
        font-weight: 600;
    }
    .articles {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
    }
    .article {
        display: block;
        padding: 1rem;
        border-bottom: 1px solid #e5e5e5;
        text-decoration: none;
        color: inherit;
    }
    .article.read {
        opacity: 0.5;
    }
    .article-title {
        font-weight: 600;
    }
    .article-author {
        font-size: 0.85rem;
        color: #666;
    }
    .article-excerpt {
        font-size: 0.9rem;
        color: #444;
        margin-top: 0.25rem;
    }
    .article-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
    .article-actions button {
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
    }

    .add-feed {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-bottom: 1rem;
    }
    .add-feed input {
        padding: 0.4rem;
        font-size: 0.85rem;
    }
    .add-feed .error {
        color: #dc2626;
        font-size: 0.8rem;
        margin: 0;
    }
</style>
