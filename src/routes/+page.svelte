<script lang="ts">
    import { onMount } from "svelte";
    import { getDb } from "$lib/rxdb";

    onMount(async () => {
        const db = await getDb();
        console.log("RxDB ready", db);
    });
</script>
