<script lang="ts">
    import { cn } from "$lib/utils.ts";
    import { setContext } from "svelte";
    import type { Snippet } from "svelte";

    let {
        error = undefined as string | undefined,
        class: className = "",
        children,
        ...restProps
    }: {
        error?: string;
        class?: string;
        children?: Snippet;
        [key: string]: any;
    } = $props();

    const uid = crypto.randomUUID().slice(0, 8);
    const id = `field-${uid}`;
    const descriptionId = `field-desc-${uid}`;
    const errorId = `field-err-${uid}`;

    setContext("field", {
        get id() { return id; },
        get descriptionId() { return descriptionId; },
        get errorId() { return errorId; },
        get error() { return error; },
    });
</script>

<div class={cn("grid gap-1.5", className)} {...restProps}>
    {@render children?.()}
</div>
