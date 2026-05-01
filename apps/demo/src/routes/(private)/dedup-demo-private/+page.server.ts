import type { PageServerLoad } from "./$types";
import { slowQuery } from "$lib/dedupCounter";

export const load = (async () => {
	const result = await slowQuery("private");
	console.log(`[dedup-demo private] loader run #${result.count} @ ${result.loadedAt}`);
	return result;
}) satisfies PageServerLoad;
