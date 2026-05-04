<script lang="ts">
	import { router } from "./router.svelte.ts";
	import { findMatch } from "../matcher.ts";
	import { clientRoutes } from "bosia:routes";
	import { consumePrefetch, prefetchCache, dataUrl } from "./prefetch.ts";
	import { appState } from "./appState.svelte.ts";
	import { pickErrorPage } from "../errorMatch.ts";

	let {
		ssrMode = false,
		ssrPageComponent = null,
		ssrLayoutComponents = [],
		ssrPageData = {},
		ssrLayoutData = [],
		ssrFormData = null,
		ssrErrorComponent = null,
		ssrErrorProps = null,
		ssrErrorDepth = null,
	}: {
		ssrMode?: boolean;
		ssrPageComponent?: any;
		ssrLayoutComponents?: any[];
		ssrPageData?: Record<string, any>;
		ssrLayoutData?: Record<string, any>[];
		ssrFormData?: any;
		ssrErrorComponent?: any;
		ssrErrorProps?: { error: { status: number; message: string } } | null;
		ssrErrorDepth?: number | null;
	} = $props();

	let PageComponent = $state<any>(ssrPageComponent);
	let layoutComponents = $state<any[]>(ssrLayoutComponents ?? []);
	// In SSR mode, render directly from props (server module singletons must
	// not hold per-request state). On the client, read/write through `appState`
	// so `use:enhance` and other helpers can update the same cells.
	const pageData = $derived(ssrMode ? (ssrPageData ?? {}) : appState.pageData);
	const layoutData = $derived(ssrMode ? (ssrLayoutData ?? []) : appState.layoutData);
	const routeParams = $derived(ssrMode ? (ssrPageData?.params ?? {}) : appState.routeParams);
	const formData = $derived(ssrMode ? ssrFormData : appState.form);
	const ErrorComponent = $derived(ssrMode ? ssrErrorComponent : appState.errorComponent);
	const errorProps = $derived(ssrMode ? ssrErrorProps : appState.errorProps);
	const errorDepth = $derived(ssrMode ? ssrErrorDepth : appState.errorDepth);
	let navigating = $state(false);
	let navDone = $state(false);
	// Skip bar on the very first effect run (initial hydration — data already present)
	let firstNav = true;
	let navDoneTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (ssrMode) return;

		const path = router.currentRoute;
		const pathname = path.split("?")[0].split("#")[0];
		const match = findMatch(clientRoutes, pathname);
		if (!match) return;

		let cancelled = false;

		const isFirst = firstNav;
		firstNav = false;
		if (isFirst) return; // Initial hydration — data already in SSR props, no fetch needed

		appState.form = null;
		if (navDoneTimer) {
			clearTimeout(navDoneTimer);
			navDoneTimer = null;
		}
		navDone = false;
		navigating = true;

		// Load components + data in parallel, then update state atomically
		// to avoid a flash of stale/empty data before the fetch completes.
		const cached = match.route.hasServerData ? consumePrefetch(path) : null;
		prefetchCache.clear(); // clear remaining entries on navigation — matches SvelteKit behavior
		const dataFetch = cached
			? Promise.resolve(cached)
			: match.route.hasServerData
				? fetch(dataUrl(path))
						.then((r) => r.json())
						.catch(() => null)
				: Promise.resolve(null);

		Promise.all([
			match.route.page(),
			Promise.all(match.route.layouts.map((l: any) => l())),
			dataFetch,
		]).then(async ([pageMod, layoutMods, result]: [any, any[], any]) => {
			if (cancelled) return;
			navigating = false;
			navDone = true;
			navDoneTimer = setTimeout(() => {
				navDone = false;
			}, 400);
			if (result?.redirect) {
				router.navigate(result.redirect);
				return;
			}
			if (result?.error || (result === null && match.route.hasServerData)) {
				// New shape: { error: { status, message }, errorDepth, errorOrigin }
				const errInfo = result?.error;
				const errStatus =
					typeof errInfo === "object" && errInfo !== null
						? (errInfo.status ?? 500)
						: (result?.status ?? 500);
				const errMessage =
					typeof errInfo === "object" && errInfo !== null
						? (errInfo.message ?? "Internal Server Error")
						: typeof errInfo === "string"
							? errInfo
							: "Internal Server Error";
				const errDepth: number =
					typeof result?.errorDepth === "number"
						? result.errorDepth
						: match.route.layouts.length;
				const errOrigin = result?.errorOrigin === "layout" ? "layout" : "page";
				const picked = pickErrorPage(match.route.errorPages ?? [], errDepth, errOrigin);
				if (!picked) {
					// No nested boundary — full reload so server can render global error page
					window.location.href = path;
					return;
				}
				try {
					const K = picked.depth;
					const [errMod, ...layoutModsForError] = await Promise.all([
						picked.loader(),
						...match.route.layouts.slice(0, K).map((l: any) => l()),
					]);
					if (cancelled) return;
					layoutComponents = layoutModsForError.map((m: any) => m.default);
					const newLayoutData: Record<string, any>[] = [];
					for (let i = 0; i < K; i++) newLayoutData.push({});
					appState.layoutData = newLayoutData;
					appState.pageData = {};
					appState.routeParams = match.params;
					appState.errorComponent = errMod.default;
					appState.errorProps = { error: { status: errStatus, message: errMessage } };
					appState.errorDepth = K;
					if (router.isPush) window.scrollTo(0, 0);
				} catch {
					window.location.href = path;
				}
				return;
			}
			PageComponent = pageMod.default;
			layoutComponents = layoutMods.map((m: any) => m.default);
			appState.pageData = result?.pageData ?? {};
			appState.layoutData = result?.layoutData ?? [];
			appState.routeParams = result?.pageData?.params ?? match.params;
			// Successful navigation — clear any prior error state.
			appState.errorComponent = null;
			appState.errorProps = null;
			appState.errorDepth = null;

			// Scroll to top on forward navigation (not on popstate/back-forward)
			if (router.isPush) window.scrollTo(0, 0);

			// Update document title and meta description from server metadata
			if (result?.metadata) {
				if (result.metadata.title) document.title = result.metadata.title;
				if (result.metadata.description) {
					let meta = document.querySelector(
						'meta[name="description"]',
					) as HTMLMetaElement | null;
					if (!meta) {
						meta = document.createElement("meta");
						meta.name = "description";
						document.head.appendChild(meta);
					}
					meta.content = result.metadata.description;
				}
			}
		});

		return () => {
			cancelled = true;
		};
	});
</script>

<!--
  Nested layout rendering:
  layouts[0] wraps layouts[1] wraps ... wraps PageComponent
-->

{#if navigating}
	<div class="bosia-bar loading"></div>
{:else if navDone}
	<div class="bosia-bar done"></div>
{/if}

{#if ErrorComponent}
	{@const depth = errorDepth ?? 0}
	{#if depth > 0 && layoutComponents.length > 0}
		{@render renderLayout(0, depth)}
	{:else}
		<ErrorComponent {...errorProps ?? {}} />
	{/if}
{:else if layoutComponents.length > 0}
	{@render renderLayout(0, layoutComponents.length)}
{:else if PageComponent}
	<PageComponent data={{ ...pageData, params: routeParams }} form={formData} />
{:else}
	<p>Loading...</p>
{/if}

{#snippet renderLayout(index: number, leafDepth: number)}
	{@const Layout = layoutComponents[index]}
	{@const data = layoutData[index] ?? {}}

	{#if index < leafDepth - 1}
		<Layout {data}>
			{@render renderLayout(index + 1, leafDepth)}
		</Layout>
	{:else}
		<Layout {data}>
			{#if ErrorComponent}
				<ErrorComponent {...errorProps ?? {}} />
			{:else if PageComponent}
				<PageComponent data={{ ...pageData, params: routeParams }} form={formData} />
			{:else}
				<p>Loading...</p>
			{/if}
		</Layout>
	{/if}
{/snippet}

<style>
	.bosia-bar {
		position: fixed;
		top: 0;
		left: 0;
		height: 2px;
		width: 100%;
		background: var(--bosia-loading-color, #f73b27);
		z-index: 9999;
		pointer-events: none;
		transform-origin: left center;
	}
	.bosia-bar.loading {
		animation: bosia-load 8s cubic-bezier(0.02, 0.5, 0.5, 1) forwards;
	}
	.bosia-bar.done {
		animation: bosia-done 0.35s ease forwards;
	}
	@keyframes bosia-load {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(0.85);
		}
	}
	@keyframes bosia-done {
		from {
			transform: scaleX(1);
			opacity: 1;
		}
		to {
			transform: scaleX(1);
			opacity: 0;
		}
	}
</style>
