<script lang="ts">
    import { cn } from "$lib/utils.ts";
    import { setContext } from "svelte";
    import type { Snippet } from "svelte";

    type Orientation = "horizontal" | "vertical";

    let {
        class: className = "",
        orientation = "horizontal" as Orientation,
        children,
        ...restProps
    }: {
        class?: string;
        orientation?: Orientation;
        children?: Snippet;
        [key: string]: any;
    } = $props();

    let canScrollPrev = $state(false);
    let canScrollNext = $state(false);
    let viewport: HTMLElement | undefined = $state(undefined);

    function updateScrollState() {
        if (!viewport) return;
        if (orientation === "horizontal") {
            canScrollPrev = viewport.scrollLeft > 1;
            canScrollNext =
                viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth - 1;
        } else {
            canScrollPrev = viewport.scrollTop > 1;
            canScrollNext =
                viewport.scrollTop < viewport.scrollHeight - viewport.clientHeight - 1;
        }
    }

    function scrollPrev() {
        if (!viewport) return;
        if (orientation === "horizontal") {
            viewport.scrollBy({ left: -viewport.clientWidth, behavior: "smooth" });
        } else {
            viewport.scrollBy({ top: -viewport.clientHeight, behavior: "smooth" });
        }
    }

    function scrollNext() {
        if (!viewport) return;
        if (orientation === "horizontal") {
            viewport.scrollBy({ left: viewport.clientWidth, behavior: "smooth" });
        } else {
            viewport.scrollBy({ top: viewport.clientHeight, behavior: "smooth" });
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (orientation === "horizontal") {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                scrollPrev();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                scrollNext();
            }
        } else {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                scrollPrev();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                scrollNext();
            }
        }
    }

    function registerViewport(el: HTMLElement) {
        viewport = el;
        updateScrollState();
    }

    setContext("carousel", {
        get orientation() {
            return orientation;
        },
        get canScrollPrev() {
            return canScrollPrev;
        },
        get canScrollNext() {
            return canScrollNext;
        },
        scrollPrev,
        scrollNext,
        registerViewport,
        updateScrollState,
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    data-slot="carousel"
    data-orientation={orientation}
    class={cn("relative", className)}
    onkeydown={handleKeydown}
    role="region"
    aria-roledescription="carousel"
    {...restProps}
>
    {@render children?.()}
</div>
