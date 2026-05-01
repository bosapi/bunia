import type { LoadEvent } from "bosia";

export async function load({ locals }: LoadEvent) {
	return {
		appName: "Bosia Todo",
		requestTime: (locals.requestTime as number | null) ?? null,
	};
}
