import type { PageServerLoad } from "./$types";
import { slowQuery } from "$lib/dedupCounter";

export const load = (async () => {
	const result = await slowQuery("public");
	console.log(`[dedup-demo public] loader run #${result.count} @ ${result.loadedAt}`);
	return result;
}) satisfies PageServerLoad;
