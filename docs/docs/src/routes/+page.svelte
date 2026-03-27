<script lang="ts">
    import { Button } from "$registry/button";
</script>

<div class="space-y-16">
    <!-- Hero Section -->
    <section class="px-4 py-20 sm:py-32 text-center">
        <div class="mx-auto max-w-3xl space-y-6">
            <h1 class="text-5xl sm:text-6xl font-bold tracking-tight">
                Build <span class="text-primary">full-stack</span> apps with ease
            </h1>
            <p class="text-xl text-muted-foreground">
                Bosia combines Bun, Svelte 5, and ElysiaJS into a modern, fast, and developer-friendly framework.
            </p>
            <div class="flex flex-wrap gap-3 justify-center">
                <a href="/getting-started">
                    <Button size="lg">Get Started</Button>
                </a>
                <a href="/components/button">
                    <Button variant="outline" size="lg">Browse Components</Button>
                </a>
                <a href="https://github.com/bosapi/bosia" target="_blank" rel="noopener">
                    <Button variant="ghost" size="lg">GitHub</Button>
                </a>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="px-4 py-16 border-t border-border">
        <div class="mx-auto max-w-5xl">
            <h2 class="text-3xl font-bold mb-12 text-center">Why Bosia?</h2>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="space-y-2">
                    <h3 class="font-semibold text-lg">⚡ Fast & Lightweight</h3>
                    <p class="text-muted-foreground">Built on Bun for lightning-fast startup and execution. Stream SSR for instant page loads.</p>
                </div>
                <div class="space-y-2">
                    <h3 class="font-semibold text-lg">🎯 Developer-Friendly</h3>
                    <p class="text-muted-foreground">SvelteKit-inspired API you know and love. Type-safe with auto-generated types.</p>
                </div>
                <div class="space-y-2">
                    <h3 class="font-semibold text-lg">🔒 Secure by Default</h3>
                    <p class="text-muted-foreground">CSRF protection, XSS escaping, and security headers built-in. No configuration needed.</p>
                </div>
                <div class="space-y-2">
                    <h3 class="font-semibold text-lg">📦 Full Stack</h3>
                    <p class="text-muted-foreground">Backend and frontend in one framework. No context switching, unified tooling.</p>
                </div>
                <div class="space-y-2">
                    <h3 class="font-semibold text-lg">🎨 Component Registry</h3>
                    <p class="text-muted-foreground">Beautiful, reusable UI components. Add with a single command.</p>
                </div>
                <div class="space-y-2">
                    <h3 class="font-semibold text-lg">🚀 Production Ready</h3>
                    <p class="text-muted-foreground">Proven patterns for routing, data loading, forms, and middleware.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Quick Start Section -->
    <section class="px-4 py-16 bg-muted/50 border-t border-border">
        <div class="mx-auto max-w-3xl">
            <h2 class="text-3xl font-bold mb-8 text-center">Quick Start</h2>
            <div class="bg-background rounded-lg border border-border p-6 font-mono text-sm space-y-2">
                <div class="text-muted-foreground">$ bun create bosia my-app</div>
                <div class="text-muted-foreground">$ cd my-app</div>
                <div class="text-muted-foreground">$ bun run dev</div>
                <div class="text-primary mt-4">→ Open http://localhost:5173</div>
            </div>
            <p class="text-center text-muted-foreground mt-6">
                <a href="/getting-started" class="text-primary hover:underline">Read the full getting started guide →</a>
            </p>
        </div>
    </section>

    <!-- Tech Stack Section -->
    <section class="px-4 py-16 border-t border-border">
        <div class="mx-auto max-w-3xl text-center">
            <h2 class="text-3xl font-bold mb-12">Built With</h2>
            <div class="grid sm:grid-cols-3 gap-8">
                <div class="space-y-2">
                    <div class="text-2xl font-bold">Bun</div>
                    <p class="text-muted-foreground text-sm">All-in-one JS runtime & package manager</p>
                </div>
                <div class="space-y-2">
                    <div class="text-2xl font-bold">Svelte 5</div>
                    <p class="text-muted-foreground text-sm">Reactive component framework with runes</p>
                </div>
                <div class="space-y-2">
                    <div class="text-2xl font-bold">ElysiaJS</div>
                    <p class="text-muted-foreground text-sm">High-performance HTTP server for Bun</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="px-4 py-16 bg-primary/5 border-t border-border text-center">
        <div class="mx-auto max-w-3xl space-y-6">
            <h2 class="text-3xl font-bold">Ready to build?</h2>
            <p class="text-lg text-muted-foreground">Start your first Bosia project today.</p>
            <a href="/getting-started">
                <Button size="lg">Get Started</Button>
            </a>
        </div>
    </section>
</div>
