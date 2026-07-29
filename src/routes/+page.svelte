<script lang="ts">
    import { onMount } from "svelte";
    import {
        watchFeeds,
        watchArticles,
        watchStarredArticles,
    } from "$lib/rxdb/queries";
    import type { ArticleDoc, FeedDoc } from "$lib/rxdb/schemas";
    import { triggerSync } from "$lib/rxdb/replication";
    import MenuColumn from "$lib/components/MenuColumn.svelte";
    import FeedList from "$lib/components/FeedList.svelte";
    import ArticleList from "$lib/components/ArticleList.svelte";
    import AddFeedDialog from "$lib/components/AddFeedDialog.svelte";
    import ArticleModal from "$lib/components/ArticleModal.svelte";
    import TopNav from "$lib/components/TopNav.svelte";

    let activeTab = $state<"feeds" | "saved">("feeds");
    let feeds = $state<FeedDoc[]>([]);
    let articles = $state<ArticleDoc[]>([]);
    let selectedFeedId = $state<string | null>(null);
    let showAddDialog = $state(false);
    let selectedArticleId = $state<string | null>(null);
    let sidebarOpen = $state(false);
    let allArticles = $state<ArticleDoc[]>([]);

    onMount(() => {
        const unsubFeeds = watchFeeds((f) => (feeds = f));
        const unsubAll = watchArticles(null, (a) => (allArticles = a));

        fetch("/api/feeds/refresh-all", { method: "POST" })
            .then(() => triggerSync())
            .catch(() => {});

        return () => {
            unsubFeeds();
            unsubAll();
        };
    });

    $effect(() => {
        if (activeTab === "feeds") {
            const unsub = watchArticles(selectedFeedId, (a) => (articles = a));
            return unsub;
        } else {
            const unsub = watchStarredArticles((a) => (articles = a));
            return unsub;
        }
    });

    async function addFeed(url: string) {
        const res = await fetch("/api/feeds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });

        if (res.ok) {
            triggerSync();
        } else {
            const data = await res
                .json()
                .catch(() => ({ message: "Failed to add feed" }));
            throw new Error(data.message ?? "Failed to add feed");
        }
    }

    let unreadCounts = $derived.by(() => {
        const counts: Record<string, number> = {};
        for (const a of allArticles) {
            if (!a.isRead) {
                counts[a.feedId] = (counts[a.feedId] || 0) + 1;
            }
        }
        return counts;
    });

    let pageTitle = $derived(
        activeTab === "saved"
            ? "Saved Articles"
            : selectedFeedId === null
              ? "All Articles"
              : (feeds.find((f) => f.id === selectedFeedId)?.title ??
                    "Articles"),
    );

    function handleTabChange(tab: "feeds" | "saved") {
        activeTab = tab;
        selectedFeedId = null;
        sidebarOpen = false;
    }

    function handleFeedSelect(id: string | null) {
        selectedFeedId = id;
        sidebarOpen = false;
    }
</script>

<div class="flex flex-col h-screen">
    <TopNav title={pageTitle} onMenuToggle={() => (sidebarOpen = !sidebarOpen)} />

    <div class="flex max-lg:flex-1 max-lg:min-h-0 lg:h-full overflow-hidden bg-zinc-950">
    {#if sidebarOpen}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onclick={() => (sidebarOpen = false)}
            role="presentation"
        ></div>
    {/if}

    <div
        class="flex fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transition-transform duration-300 ease-out max-lg:data-[open=false]:-translate-x-full max-lg:data-[open=true]:translate-x-0"
        data-open={sidebarOpen ? "true" : "false"}
    >
        <MenuColumn
            {activeTab}
            onTabChange={handleTabChange}
            onAddClick={() => {
                showAddDialog = true;
                sidebarOpen = false;
            }}
        />

        {#if activeTab === "feeds"}
            <FeedList {feeds} {selectedFeedId} {unreadCounts} onFeedSelect={handleFeedSelect} />
        {:else}
            <aside class="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
                <div class="px-4 py-4 border-b border-zinc-800">
                    <h2 class="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                        Saved
                    </h2>
                    <p class="text-xs text-zinc-600 mt-1">
                        {articles.length} article{articles.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-center px-6">
                        <svg
                            class="w-10 h-10 mx-auto text-amber-500/40 mb-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <polygon
                                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                            />
                        </svg>
                        <p class="text-sm text-zinc-500">Star articles to save them</p>
                        <p class="text-xs text-zinc-600 mt-1">for later reading</p>
                    </div>
                </div>
            </aside>
        {/if}
    </div>

    <ArticleList
        {articles}
        {feeds}
        title={pageTitle}
        onArticleClick={(id) => {
            selectedArticleId = id;
            sidebarOpen = false;
        }}
    />
</div>
</div>

{#if selectedArticleId}
    <ArticleModal articleId={selectedArticleId} onClose={() => (selectedArticleId = null)} />
{/if}

<AddFeedDialog
    show={showAddDialog}
    onClose={() => (showAddDialog = false)}
    onAdd={addFeed}
/>
