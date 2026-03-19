import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { render } from "svelte/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

import { findMatch } from "./matcher.ts";
import { serverRoutes, apiRoutes, errorPage } from "bunia:routes";
import type { Handle, RequestEvent, Cookies, CookieOptions } from "./hooks.ts";
import { HttpError, Redirect } from "./errors.ts";
import App from "./client/App.svelte";

// ─── Dist Manifest ───────────────────────────────────────
// Maps hashed filenames → script/link tags.
// Cached at startup; server restarts on rebuild in dev anyway.

const distManifest: { js: string[]; css: string[]; entry: string } = (() => {
    const p = "./dist/manifest.json";
    return existsSync(p)
        ? JSON.parse(readFileSync(p, "utf-8"))
        : { js: [], css: [], entry: "hydrate.js" };
})();

// ─── User Hooks ──────────────────────────────────────────
// Load src/hooks.server.ts if present. Uses process.cwd() so
// Bun can resolve it at runtime without bundling user code.

let userHandle: Handle | null = null;

const hooksPath = join(process.cwd(), "src", "hooks.server.ts");
if (existsSync(hooksPath)) {
    try {
        const mod = await import(hooksPath);
        if (typeof mod.handle === "function") {
            userHandle = mod.handle as Handle;
            console.log("🪝 Loaded hooks.server.ts");
        }
    } catch (err) {
        console.warn("⚠️  Failed to load hooks.server.ts:", err);
    }
}

// ─── Cookie Helpers ──────────────────────────────────────

function parseCookies(header: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const pair of header.split(";")) {
        const idx = pair.indexOf("=");
        if (idx === -1) continue;
        const name = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        if (name) result[name] = decodeURIComponent(value);
    }
    return result;
}

class CookieJar implements Cookies {
    private _incoming: Record<string, string>;
    private _outgoing: string[] = [];

    constructor(cookieHeader: string) {
        this._incoming = parseCookies(cookieHeader);
    }

    get(name: string): string | undefined {
        return this._incoming[name];
    }

    getAll(): Record<string, string> {
        return { ...this._incoming };
    }

    set(name: string, value: string, options?: CookieOptions): void {
        let header = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        header += `; Path=${options?.path ?? "/"}`;
        if (options?.domain) header += `; Domain=${options.domain}`;
        if (options?.maxAge != null) header += `; Max-Age=${options.maxAge}`;
        if (options?.expires) header += `; Expires=${options.expires.toUTCString()}`;
        if (options?.httpOnly) header += "; HttpOnly";
        if (options?.secure) header += "; Secure";
        if (options?.sameSite) header += `; SameSite=${options.sameSite}`;
        this._outgoing.push(header);
    }

    delete(name: string, options?: Pick<CookieOptions, "path" | "domain">): void {
        this.set(name, "", { path: options?.path, domain: options?.domain, maxAge: 0 });
    }

    get outgoing(): readonly string[] {
        return this._outgoing;
    }
}

// ─── Session-Aware Fetch ─────────────────────────────────
// Passed to load() functions so they can call internal APIs
// with the current user's cookies automatically forwarded.

function makeFetch(req: Request, url: URL) {
    const cookie = req.headers.get("cookie") ?? "";
    const origin = url.origin;

    return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const resolved =
            typeof input === "string" && input.startsWith("/")
                ? `${origin}${input}`
                : input;

        const headers = new Headers(init?.headers);
        if (cookie && !headers.has("cookie")) headers.set("cookie", cookie);

        return globalThis.fetch(resolved, { ...init, headers });
    };
}

// ─── Route Data Loader ───────────────────────────────────
// Runs layout + page server loaders for a given URL.
// Used by both SSR and the /__bunia/data JSON endpoint.

async function loadRouteData(
    url: URL,
    locals: Record<string, any>,
    req: Request,
    cookies: Cookies,
) {
    const match = findMatch(serverRoutes, url.pathname);
    if (!match) return null;

    const { route, params } = match;
    const fetch = makeFetch(req, url);
    const layoutData: Record<string, any>[] = [];

    // Run layout server loaders root → leaf, each gets parent() data
    for (const ls of route.layoutServers) {
        try {
            const mod = await ls.loader();
            if (typeof mod.load === "function") {
                const parent = async () => {
                    const merged: Record<string, any> = {};
                    for (let d = 0; d < ls.depth; d++) Object.assign(merged, layoutData[d] ?? {});
                    return merged;
                };
                layoutData[ls.depth] = (await mod.load({ params, url, locals, cookies, parent, fetch })) ?? {};
            }
        } catch (err) {
            if (err instanceof HttpError || err instanceof Redirect) throw err;
            console.error("Layout server load error:", err);
        }
    }

    // Run page server loader
    let pageData: Record<string, any> = {};
    let csr = true;
    if (route.pageServer) {
        try {
            const mod = await route.pageServer();
            if (mod.csr === false) csr = false;
            if (typeof mod.load === "function") {
                const parent = async () => {
                    const merged: Record<string, any> = {};
                    for (const d of layoutData) if (d) Object.assign(merged, d);
                    return merged;
                };
                pageData = (await mod.load({ params, url, locals, cookies, parent, fetch })) ?? {};
            }
        } catch (err) {
            if (err instanceof HttpError || err instanceof Redirect) throw err;
            console.error("Page server load error:", err);
        }
    }

    return { pageData: { ...pageData, params }, layoutData, csr };
}

// ─── SSR Renderer ────────────────────────────────────────

async function renderSSR(url: URL, locals: Record<string, any>, req: Request, cookies: Cookies) {
    const match = findMatch(serverRoutes, url.pathname);
    if (!match) return null;

    const { route } = match;

    // Kick off component imports in parallel with data loading
    const pageModPromise = route.pageModule();
    const layoutModsPromise = Promise.all(route.layoutModules.map(l => l()));

    const data = await loadRouteData(url, locals, req, cookies);
    if (!data) return null;

    const [pageMod, layoutMods] = await Promise.all([pageModPromise, layoutModsPromise]);

    const { body, head } = render(App, {
        props: {
            ssrMode: true,
            ssrPageComponent: pageMod.default,
            ssrLayoutComponents: layoutMods.map((m: any) => m.default),
            ssrPageData: data.pageData,
            ssrLayoutData: data.layoutData,
        },
    });

    return { body, head, pageData: data.pageData, layoutData: data.layoutData, csr: data.csr };
}

// ─── HTML Builder ─────────────────────────────────────────

const isDev = process.env.NODE_ENV !== "production";

function buildHtml(
    body: string,
    head: string,
    pageData: any,
    layoutData: any[],
    csr = true,
): string {
    const cacheBust = isDev ? `?v=${Date.now()}` : "";

    const cssLinks = (distManifest.css ?? [])
        .map((f: string) => `<link rel="stylesheet" href="/dist/client/${f}">`)
        .join("\n  ");

    const fallbackTitle = head.includes("<title>") ? "" : "<title>Bunia App</title>";

    const scripts = csr
        ? `\n  <script>window.__BUNIA_PAGE_DATA__=${JSON.stringify(pageData)};window.__BUNIA_LAYOUT_DATA__=${JSON.stringify(layoutData)};</script>\n  <script type="module" src="/dist/client/${distManifest.entry}${cacheBust}"></script>`
        : isDev
            ? `\n  <script>!function r(){var e=new EventSource("/__bunia/sse");e.addEventListener("reload",()=>location.reload());e.onopen=()=>r._ok||(r._ok=1);e.onerror=()=>{e.close();setTimeout(r,2000)}}()</script>`
            : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${fallbackTitle}
  <link rel="icon" href="data:,">
  ${head}
  ${cssLinks}
  <link rel="stylesheet" href="/bunia-tw.css${cacheBust}">
</head>
<body>
  <div id="app">${body}</div>${scripts}
</body>
</html>`;
}

// ─── Gzip Compression ────────────────────────────────────

function compress(body: string, contentType: string, req: Request, status = 200): Response {
    const headers: Record<string, string> = { "Content-Type": contentType, "Vary": "Accept-Encoding" };
    const accept = req.headers.get("accept-encoding") ?? "";
    // Skip compression in dev — the dev proxy's fetch() auto-decompresses gzip
    // responses but keeps the Content-Encoding header, causing ERR_CONTENT_DECODING_FAILED.
    if (!isDev && body.length > 1024 && accept.includes("gzip")) {
        return new Response(Bun.gzipSync(body), { status, headers: { ...headers, "Content-Encoding": "gzip" } });
    }
    return new Response(body, { status, headers });
}

// ─── Error Page Renderer ──────────────────────────────────

async function renderErrorPage(status: number, message: string, url: URL, req: Request): Promise<Response> {
    if (errorPage) {
        try {
            const mod = await errorPage();
            const { body, head } = render(App, {
                props: {
                    ssrMode: true,
                    ssrPageComponent: mod.default,
                    ssrLayoutComponents: [],
                    ssrPageData: { status, message },
                    ssrLayoutData: [],
                },
            });
            const html = buildHtml(body, head, { status, message }, [], false);
            return compress(html, "text/html; charset=utf-8", req, status);
        } catch (err) {
            console.error("Error page render failed:", err);
        }
    }
    return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

// ─── Static File Detection ────────────────────────────────

const STATIC_EXTS = new Set([".ico", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".css", ".js", ".woff", ".woff2", ".ttf"]);

function isStaticPath(path: string): boolean {
    if (path.startsWith("/dist/") || path.startsWith("/__bunia/")) return true;
    const dot = path.lastIndexOf(".");
    return dot !== -1 && STATIC_EXTS.has(path.slice(dot));
}

// ─── Core Request Resolver ────────────────────────────────
// This is the inner handler that hooks wrap around.

async function resolve(event: RequestEvent): Promise<Response> {
    const { request, url, locals, cookies } = event;
    const path = url.pathname;
    const method = request.method.toUpperCase();

    // Health check endpoint — for load balancers and orchestrators
    if (path === "/_health") {
        return Response.json({ status: "ok", timestamp: new Date().toISOString() });
    }

    // Data endpoint — returns server loader data as JSON for client-side navigation
    if (path === "/__bunia/data") {
        const routePath = url.searchParams.get("path") ?? "/";
        const routeUrl = new URL(routePath, url.origin);
        // Rewrite event.url so logging middleware sees the real page path, not /__bunia/data
        event.url = routeUrl;
        try {
            const data = await loadRouteData(routeUrl, locals, request, cookies);
            if (!data) return compress(JSON.stringify({ pageData: {}, layoutData: [] }), "application/json", request);
            return compress(JSON.stringify(data), "application/json", request);
        } catch (err) {
            if (err instanceof Redirect) {
                return compress(JSON.stringify({ redirect: err.location, status: err.status }), "application/json", request);
            }
            if (err instanceof HttpError) {
                return compress(JSON.stringify({ error: err.message, status: err.status }), "application/json", request, err.status);
            }
            console.error("Data endpoint error:", err);
            return Response.json({ error: "Internal Server Error" }, { status: 500 });
        }
    }

    // Static files
    if (isStaticPath(path)) {
        // dist/client: serve with cache headers based on whether filename is hashed
        if (path.startsWith("/dist/client/")) {
            const file = Bun.file(`.${path.split("?")[0]}`);
            if (await file.exists()) {
                const filename = path.split("/").pop() ?? "";
                const isHashed = /\-[a-z0-9]{8,}\.[a-z]+$/.test(filename);
                const cacheControl = !isDev && isHashed
                    ? "public, max-age=31536000, immutable"
                    : "no-cache";
                return new Response(file, { headers: { "Cache-Control": cacheControl } });
            }
            return new Response("Not Found", { status: 404 });
        }
        const pub = Bun.file(`./public${path}`);
        if (await pub.exists()) return new Response(pub);
        const dist = Bun.file(`.${path}`);
        if (await dist.exists()) return new Response(dist);
        return new Response("Not Found", { status: 404 });
    }

    // Prerendered pages — serve static HTML built at build time
    const prerenderFile = Bun.file(
        path === "/" ? "./dist/prerendered/index.html" : `./dist/prerendered${path}/index.html`
    );
    if (await prerenderFile.exists()) {
        return new Response(prerenderFile, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "public, max-age=3600",
            },
        });
    }

    // API routes (+server.ts)
    const apiMatch = findMatch(apiRoutes, path);
    if (apiMatch) {
        try {
            const mod = await apiMatch.route.module();
            const handler = mod[method];

            if (!handler) {
                const allowed = Object.keys(mod).filter(k => /^[A-Z]+$/.test(k)).join(", ");
                return Response.json(
                    { error: `Method ${method} not allowed` },
                    { status: 405, headers: { Allow: allowed } },
                );
            }

            event.params = apiMatch.params;
            return await handler({ request, params: apiMatch.params, url, locals, cookies });
        } catch (err) {
            console.error("API route error:", err);
            return Response.json({ error: "Internal Server Error" }, { status: 500 });
        }
    }

    // SSR pages (+page.svelte)
    try {
        const ssr = await renderSSR(url, locals, request, cookies);
        if (!ssr) {
            return renderErrorPage(404, "Not Found", url, request);
        }
        const html = buildHtml(ssr.body, ssr.head, ssr.pageData, ssr.layoutData, ssr.csr);
        return compress(html, "text/html; charset=utf-8", request);
    } catch (err) {
        if (err instanceof Redirect) {
            return new Response(null, { status: err.status, headers: { Location: err.location } });
        }
        if (err instanceof HttpError) {
            return renderErrorPage(err.status, err.message, url, request);
        }
        console.error("SSR error:", err);
        return renderErrorPage(500, "Internal Server Error", url, request);
    }
}

// ─── Request Entry ────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
};

async function handleRequest(request: Request, url: URL): Promise<Response> {
    const cookieJar = new CookieJar(request.headers.get("cookie") ?? "");
    const event: RequestEvent = { request, url, locals: {}, params: {}, cookies: cookieJar };
    const response = userHandle
        ? await userHandle({ event, resolve })
        : await resolve(event);

    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
    // Apply any Set-Cookie headers accumulated during the request
    for (const cookie of cookieJar.outgoing) headers.append("Set-Cookie", cookie);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

// ─── Elysia App ───────────────────────────────────────────

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (isDev ? 3001 : 3000);

const app = new Elysia()
    .use(staticPlugin({ assets: "public", prefix: "/" }))
    // dist/client is served by our resolve() handler with proper cache headers
    // API routes must intercept all HTTP methods before the GET catch-all
    .onBeforeHandle(async ({ request }) => {
        const url = new URL(request.url);
        if (!findMatch(apiRoutes, url.pathname)) return; // not an API route
        return handleRequest(request, url);
    })
    // SSR pages
    .get("*", ({ request }) => {
        const url = new URL(request.url);
        return handleRequest(request, url);
    })
    // Non-GET catch-alls so onBeforeHandle fires for API routes on other methods
    .post("*", () => new Response("Not Found", { status: 404 }))
    .put("*", () => new Response("Not Found", { status: 404 }))
    .patch("*", () => new Response("Not Found", { status: 404 }))
    .delete("*", () => new Response("Not Found", { status: 404 }))
    .options("*", () => new Response("Not Found", { status: 404 }));

app.listen(PORT, () => {
    // In dev mode the proxy owns port 3000 — don't print the internal port
    if (!isDev) console.log(`🐰 Bunia server running at http://localhost:${PORT}`);
});

export { app };
