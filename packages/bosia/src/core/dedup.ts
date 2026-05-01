// ─── Request Deduplication ──────────────────────────────
// Concurrent in-flight coalescing for public routes. When N parallel requests
// hit the same URL, run the loader once and share the resolved value across
// all N waiters. Settled responses are NOT cached — once the promise resolves,
// the entry is dropped, so the next request runs the loader again.
//
// Scope decision lives in the scanner: routes under a `(private)` group skip
// dedup entirely. Per-user routes MUST be private — sharing a loader result
// across users would leak data. See docs/guides/request-deduplication.md.

const inflight = new Map<string, Promise<unknown>>();

/** Build a stable dedup key from a URL: normalized path + sorted query. */
export function dedupKey(url: URL): string {
	let path = url.pathname;
	if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
	const sorted = new URLSearchParams([...url.searchParams.entries()].sort());
	const search = sorted.toString();
	return search ? `${path}?${search}` : path;
}

/** Coalesce concurrent calls under `key`. `fn` runs at most once per inflight window. */
export function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
	const existing = inflight.get(key);
	if (existing) return existing as Promise<T>;
	const promise = fn().finally(() => inflight.delete(key));
	inflight.set(key, promise);
	return promise as Promise<T>;
}
