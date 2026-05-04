// ─── Nested Error-Page Matcher ────────────────────────────
// Picks the deepest +error.svelte boundary that protects the failing
// code. Shared by SSR (renderer.ts) and CSR (App.svelte) so client
// and server agree on which boundary catches a thrown error.
//
// Catch rules (SvelteKit-compatible):
//   - "page"   origin: error in +page / +page.server at depth = layouts.length
//              → caught by deepest entry where `depth ≤ errorDepth`.
//   - "layout" origin: error in +layout.server (or layout render) at depth L
//              → caught by deepest entry where `depth < errorDepth`. An error
//              page in the same dir as the failing layout cannot catch its own
//              layout — it would render *inside* the broken layout.

export type ErrorOrigin = "page" | "layout";

export interface ErrorPageEntry<L = unknown> {
	loader: L;
	depth: number;
}

export function pickErrorPage<L>(
	errorPages: readonly ErrorPageEntry<L>[],
	errorDepth: number,
	origin: ErrorOrigin,
): ErrorPageEntry<L> | null {
	let best: ErrorPageEntry<L> | null = null;
	for (const ep of errorPages) {
		const ok = origin === "page" ? ep.depth <= errorDepth : ep.depth < errorDepth;
		if (!ok) continue;
		if (!best || ep.depth > best.depth) best = ep;
	}
	return best;
}
