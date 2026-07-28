<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import { page } from "$app/stores";
	import { startReplication } from "$lib/rxdb/replication";

	let { children } = $props();

	onMount(() => {
		if (browser && $page.url.pathname !== "/login") {
			startReplication().then(() => console.log("replication started"));
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
