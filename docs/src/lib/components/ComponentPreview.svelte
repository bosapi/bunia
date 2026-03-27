<script lang="ts">
    import type { Snippet } from "svelte";

    let { children, class: className = "" }: { children: Snippet; class?: string } = $props();
</script>

<div class="bosia-preview not-content {className}">
    <div class="preview-container">
        {@render children()}
    </div>
</div>

<style>
    .preview-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 2rem;
        border: 1px solid hsl(var(--border));
        border-radius: 0.5rem;
        min-height: 80px;
    }
</style>
