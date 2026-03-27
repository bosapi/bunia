import type { LoadEvent } from "bosia";
import { sidebar } from "$lib/docs/nav";
import { getLocale, switchLocaleUrl } from "$lib/docs/i18n";

const pkg = await import("../../../node_modules/bosia/package.json", { with: { type: "json" } }).catch(() => ({ default: { version: "0.1.1" } }));

export async function load({ url }: LoadEvent) {
    const slug = url.pathname === "/" ? "" : url.pathname.replace(/^\//, "").replace(/\/$/, "");
    const locale = getLocale(slug);
    const switchUrl = switchLocaleUrl(slug);
    const version = `v${pkg.default.version}`;

    return {
        sidebar,
        locale,
        version,
        switchLocaleUrl: switchUrl.url,
    };
}
