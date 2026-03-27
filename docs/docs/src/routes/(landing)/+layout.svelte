<script lang="ts">
    import DocsNavbar from "$lib/components/DocsNavbar.svelte";

    let { children, data }: { children: any; data: any } = $props();
</script>

<svelte:head>
    <script>
        // Restore theme before paint
        if (localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            document.documentElement.classList.add("dark");
        }
    </script>
</svelte:head>

<div class="min-h-screen flex flex-col">
    <DocsNavbar
        version={data.version}
        locale={data.locale}
        switchLocaleUrl={data.switchLocaleUrl}
    />
    <main class="flex-1">
        {@render children()}
    </main>
</div>
