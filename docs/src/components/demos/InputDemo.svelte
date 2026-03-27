<script lang="ts">
    import { Input } from "$registry/input";

    let value = $state("");
</script>

<div class="flex flex-col gap-4 w-full max-w-sm">
    <Input bind:value placeholder="Type something..." />
    {#if value}
        <p class="text-sm text-muted-foreground">Value: <strong>{value}</strong></p>
    {/if}
    <Input type="email" placeholder="you@example.com" />
    <Input disabled placeholder="Disabled input" />
</div>
