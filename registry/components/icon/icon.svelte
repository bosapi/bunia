<script lang="ts">
    import { cn } from "$lib/utils.ts";

    type IconName = "sun" | "moon" | "menu" | "x";

    let {
        name,
        size = 18,
        class: className = "",
        ...restProps
    }: {
        name: IconName;
        size?: number;
        class?: string;
        [key: string]: any;
    } = $props();

    const paths: Record<IconName, string> = {
        sun: "M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
        moon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
        menu: "M4 6h16M4 12h16M4 18h16",
        x: "M18 6L6 18M6 6l12 12",
    };
</script>

<svg
    class={cn(className)}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    {...restProps}
>
    <path d={paths[name]} />
</svg>
