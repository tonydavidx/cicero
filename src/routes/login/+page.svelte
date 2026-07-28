<script lang="ts">
    import { goto } from "$app/navigation";

    let password = $state("");
    let error = $state("");
    let loading = $state(false);

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = "";

        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });

        loading = false;

        if (res.ok) {
            goto("/");
        } else {
            error = "Invalid password";
        }
    }
</script>

<div class="login">
    <form onsubmit={handleSubmit}>
        <h1>Cicero</h1>
        <input
            type="password"
            bind:value={password}
            placeholder="Password"
            autofocus
        />
        {#if error}<p class="error">{error}</p>{/if}
        <button type="submit" disabled={loading}
            >{loading ? "Logging in…" : "Log in"}</button
        >
    </form>
</div>

<style>
    .login {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
    }
    form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 280px;
    }
    .error {
        color: #dc2626;
        font-size: 0.875rem;
        margin: 0;
    }
</style>
