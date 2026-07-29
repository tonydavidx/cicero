<script lang="ts">
  let { title, onMenuToggle }: {
    title: string;
    onMenuToggle: () => void;
  } = $props();
</script>

<nav class="lg:hidden flex items-center justify-between px-3 h-14 bg-zinc-950 border-b border-zinc-800 shrink-0">
  <button
    onclick={onMenuToggle}
    aria-label="Toggle sidebar"
    class="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
  >
    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  </button>

  <h1 class="text-sm font-semibold text-zinc-100 truncate">{title}</h1>

  <div class="w-10"></div>
</nav>
