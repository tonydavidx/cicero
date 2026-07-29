<script lang="ts">
  let { show, onClose, onAdd }: {
    show: boolean;
    onClose: () => void;
    onAdd: (url: string) => Promise<void>;
  } = $props();

  let url = $state("");
  let adding = $state(false);
  let error = $state("");

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    adding = true;
    error = "";
    try {
      await onAdd(url.trim());
      url = "";
      onClose();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : "Failed to add feed";
    } finally {
      adding = false;
    }
  }

  function handleBackdropClick() {
    onClose();
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === "Escape" && onClose()}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bg-zinc-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-zinc-800"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Add feed"
      tabindex="0"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Add Feed</h2>
        <button
          onclick={onClose}
          aria-label="Close"
          class="text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg p-1 hover:bg-zinc-800"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="feed-url" class="block text-sm font-medium text-zinc-400 mb-1.5">Feed URL</label>
          <input
            id="feed-url"
            type="url"
            bind:value={url}
            placeholder="https://example.com/feed.xml"
            required
            class="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        {#if error}
          <p class="text-red-400 text-sm">{error}</p>
        {/if}

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            onclick={onClose}
            class="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={adding}
            class="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition-colors text-sm font-medium disabled:cursor-not-allowed"
          >
            {adding ? "Adding..." : "Add Feed"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
