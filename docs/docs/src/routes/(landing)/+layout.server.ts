import type { LoadEvent } from "bosia";

const pkg = await import("../../../node_modules/bosia/package.json", { with: { type: "json" } }).catch(() => ({ default: { version: "0.1.1" } }));

export async function load({ url }: LoadEvent) {
    const locale = url.pathname.startsWith("/id") ? "id" : "en";
    const switchUrl = locale === "en" ? "/id" : "/";
    const version = `v${pkg.default.version}`;

    return {
        locale,
        version,
        switchLocaleUrl: switchUrl,
    };
}
