<script lang="ts">
    import { cn } from "$lib/utils.ts";
    import type { ColumnDef, FilterDef, SortState, TableState, RenderDescriptor } from "./types.ts";
    import DataTableHeader from "./data-table-header.svelte";
    import DataTableFilters from "./data-table-filters.svelte";
    import DataTableEmpty from "./data-table-empty.svelte";
    import DataTablePagination from "./data-table-pagination.svelte";

    let {
        columns = [],
        filters = [],
        data = [],
        totalRows = 0,
        pageSize = 10,
        loading = false,
        emptyMessage = "No results found.",
        onStateChange,
        class: className = "",
    }: {
        columns?: ColumnDef<any>[];
        filters?: FilterDef[];
        data?: any[];
        totalRows?: number;
        pageSize?: number;
        loading?: boolean;
        emptyMessage?: string;
        onStateChange?: (state: TableState) => void | Promise<void>;
        class?: string;
    } = $props();

    let sort: SortState = $state(null);
    let filterValues: Record<string, string> = $state({});
    let page: number = $state(1);

    function emitState() {
        onStateChange?.({
            sort,
            filters: { ...filterValues },
            pagination: { page, pageSize },
        });
    }

    function handleSortChange(newSort: SortState) {
        sort = newSort;
        page = 1;
        emitState();
    }

    function handleFilterChange() {
        page = 1;
        emitState();
    }

    function handlePageChange(newPage: number) {
        page = newPage;
        emitState();
    }

    function resolveValue(row: any, col: ColumnDef<any>): any {
        if (col.accessorFn) return col.accessorFn(row);
        if (col.accessorKey) return row[col.accessorKey];
        return undefined;
    }

    function resolveCell(row: any, col: ColumnDef<any>, index: number): RenderDescriptor | string {
        const value = resolveValue(row, col);
        if (col.cell) return col.cell({ row, value, index });
        return value != null ? String(value) : "";
    }
</script>

<div class={cn("w-full", className)}>
    <DataTableFilters
        {filters}
        bind:values={filterValues}
        onchange={handleFilterChange}
    />

    <div class="relative rounded-md border">
        {#if loading}
            <div
                class="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-sm"
            >
                <div
                    class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
                ></div>
            </div>
        {/if}

        <table class="w-full caption-bottom text-sm">
            <DataTableHeader
                {columns}
                {sort}
                onSortChange={handleSortChange}
            />

            <tbody class="[&_tr:last-child]:border-0">
                {#if data.length === 0}
                    <DataTableEmpty colspan={columns.length} message={emptyMessage} />
                {:else}
                    {#each data as row, index (index)}
                        <tr class="border-b transition-colors hover:bg-muted/50">
                            {#each columns as col (col.id)}
                                {@const cellContent = resolveCell(row, col, index)}
                                <td class={cn("px-4 py-3 align-middle", col.class)}>
                                    {#if typeof cellContent === "string"}
                                        {cellContent}
                                    {:else if cellContent.type === "snippet"}
                                        {@render cellContent.snippet()}
                                    {:else if cellContent.type === "component"}
                                        <svelte:component
                                            this={cellContent.component}
                                            {...cellContent.props}
                                        />
                                    {/if}
                                </td>
                            {/each}
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
    </div>

    <DataTablePagination
        {page}
        {pageSize}
        {totalRows}
        onPageChange={handlePageChange}
    />
</div>
