import type { LoadEvent } from "bosia";
import { getVersion } from "$lib/utils";

export async function load({ url }: LoadEvent) {
    const locale = "id" as const;
    const version = await getVersion();
    return { locale, version, switchLocaleUrl: "/" };
}
