<script lang="ts">
    let { children, data = {} }: { children: any; data?: Record<string, any> } = $props();
</script>

<div class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <nav class="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
            <a href="/" class="font-bold tracking-tight">🐰 Bunia</a>
            <a href="/" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="/about" class="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="/blog" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a>
            <a href="/api/hello" target="_blank" class="text-sm text-muted-foreground hover:text-foreground transition-colors">API</a>
        </nav>
    </header>

    <main class="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {@render children()}
    </main>

    <footer class="border-t py-4 text-center text-sm text-muted-foreground">
        Powered by Bunia
        {#if (data as any)?.requestTime}
            <span class="ml-2 opacity-40 font-mono text-xs">
                req at {new Date((data as any).requestTime).toISOString()}
            </span>
        {/if}
    </footer>
</div>
