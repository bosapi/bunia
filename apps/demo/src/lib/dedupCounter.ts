// Module-level counters demonstrate scope-aware dedup:
// public route → counter increments once per unique URL even with N concurrent loads
// private route → counter increments N times for N concurrent loads
const counters = { public: 0, private: 0 };

export async function slowQuery(scope: "public" | "private"): Promise<{
	count: number;
	loadedAt: string;
	scope: "public" | "private";
}> {
	counters[scope] += 1;
	const count = counters[scope];
	const loadedAt = new Date().toISOString();
	// Simulate a slow DB hit so concurrent requests overlap in flight
	await new Promise((r) => setTimeout(r, 300));
	return { count, loadedAt, scope };
}

export function resetCounter(scope: "public" | "private") {
	counters[scope] = 0;
}
