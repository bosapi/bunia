import { SveltePlugin } from "bun-plugin-svelte";
import { writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from "fs";
import { join, relative } from "path";
import { spawnSync } from "bun";

import { scanRoutes } from "./scanner.ts";
import type { RouteManifest } from "./types.ts";

// Resolved from this file's location inside the bunia package
const CORE_DIR = import.meta.dir;
const BUNIA_NODE_MODULES = join(CORE_DIR, "..", "..", "node_modules");

// ─── Entry Point ─────────────────────────────────────────

const isProduction = process.env.NODE_ENV === "production";

console.log("🏗️  Starting Bunia build...\n");

// 0. Clean all generated output first
try { rmSync("./dist",   { recursive: true, force: true }); } catch { }
try { rmSync("./.bunia", { recursive: true, force: true }); } catch { }

// 1. Scan routes
const manifest = scanRoutes();
console.log(`📂 Found ${manifest.pages.length} page route(s):`);
for (const r of manifest.pages) {
    console.log(`   ${r.pattern} → ${r.page}${r.pageServer ? " (server)" : ""}`);
}
if (manifest.apis.length > 0) {
    console.log(`📡 Found ${manifest.apis.length} API route(s):`);
    for (const r of manifest.apis) {
        console.log(`   ${r.pattern} → ${r.server}`);
    }
}

// 2. Generate .bunia/routes.ts (single file replaces all old code generators)
generateRoutesFile(manifest);

// 2b. Generate .bunia/types/src/routes/**/$types.d.ts for IDE type inference
generateRouteTypes(manifest);

// 2c. Ensure tsconfig.json has rootDirs pointing at .bunia/types
ensureRootDirs();

// 3. Build Tailwind CSS
console.log("\n🎨 Building Tailwind CSS...");
const tailwindBin = join(BUNIA_NODE_MODULES, ".bin", "tailwindcss");
const tailwindResult = spawnSync(
    [tailwindBin, "-i", "./src/app.css", "-o", "./public/bunia-tw.css", ...(isProduction ? ["--minify"] : [])],
    {
        cwd: process.cwd(),
        env: { ...process.env, NODE_PATH: BUNIA_NODE_MODULES },
    },
);
if (tailwindResult.exitCode !== 0) {
    console.error("❌ Tailwind CSS build failed:\n" + tailwindResult.stderr.toString());
    process.exit(1);
}
console.log("✅ Tailwind CSS built: public/bunia-tw.css");

// Shared Bun build plugin for both client and server
const buniaPlugin = makeBuniaPlugin();

// 5. Build client bundle
console.log("\n📦 Building client bundle...");
const clientResult = await Bun.build({
    entrypoints: [join(CORE_DIR, "client", "hydrate.ts")],
    outdir: "./dist/client",
    target: "browser",
    splitting: true,
    naming: { chunk: "[name]-[hash].[ext]" },
    minify: isProduction,
    define: {
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
    },
    plugins: [buniaPlugin, SveltePlugin()],
});

if (!clientResult.success) {
    console.error("❌ Client build failed:");
    for (const msg of clientResult.logs) console.error(msg);
    process.exit(1);
}

// 6. Collect output files for dist/manifest.json
const jsFiles: string[] = [];
const cssFiles: string[] = [];
for (const output of clientResult.outputs) {
    const rel = relative("./dist/client", output.path);
    if (output.path.endsWith(".js")) jsFiles.push(rel);
    if (output.path.endsWith(".css")) cssFiles.push(rel);
}

// 7. Build server bundle (before writing manifest so we can record the entry)
console.log("\n📦 Building server bundle...");
const serverResult = await Bun.build({
    entrypoints: [join(CORE_DIR, "server.ts")],
    outdir: "./dist/server",
    target: "bun",
    splitting: true,
    naming: { entry: "index.[ext]", chunk: "[name]-[hash].[ext]" },
    minify: isProduction,
    external: ["elysia", "@elysiajs/static"],
    plugins: [buniaPlugin, SveltePlugin()],
});

if (!serverResult.success) {
    console.error("❌ Server build failed:");
    for (const msg of serverResult.logs) console.error(msg);
    process.exit(1);
}

// Entry is always "index.js" due to naming: { entry: "index.[ext]" }
const serverEntry = serverResult.outputs
    .find(o => o.path.endsWith("index.js"))
    ?.path.split("/").pop() ?? "index.js";

// 8. Write dist/manifest.json
mkdirSync("./dist", { recursive: true });
const distManifest = {
    js: jsFiles,
    css: cssFiles,
    entry: jsFiles.find(f => f.startsWith("hydrate")) ?? jsFiles[0] ?? "hydrate.js",
    serverEntry,
};
writeFileSync("./dist/manifest.json", JSON.stringify(distManifest, null, 2));
console.log(`✅ Client bundle: ${jsFiles.join(", ")}`);
console.log(`✅ Server entry:  dist/server/${serverEntry}`);

// 9. Prerender static routes
await prerenderStaticRoutes(manifest);

console.log("\n🎉 Build complete!");

// ─── Route File Generator ─────────────────────────────────
// Generates .bunia/routes.ts — ONE file with three exports:
//   clientRoutes  — used by client hydrator (page + layout lazy imports)
//   serverRoutes  — used by SSR renderer (+ pageServer + layoutServers)
//   apiRoutes     — used by API handler

function generateRoutesFile(manifest: RouteManifest): void {
    const lines: string[] = [
        "// AUTO-GENERATED by bunia build — do not edit\n",
    ];

    // clientRoutes
    lines.push("export const clientRoutes: Array<{");
    lines.push("  pattern: string;");
    lines.push("  page: () => Promise<any>;");
    lines.push("  layouts: (() => Promise<any>)[];");
    lines.push("  hasServerData: boolean;");
    lines.push("}> = [");
    for (const r of manifest.pages) {
        const layoutImports = r.layouts
            .map(l => `() => import(${JSON.stringify(toImportPath(l))})`)
            .join(", ");
        const hasServerData = !!(r.pageServer || r.layoutServers.length > 0);
        lines.push("  {");
        lines.push(`    pattern: ${JSON.stringify(r.pattern)},`);
        lines.push(`    page: () => import(${JSON.stringify(toImportPath(r.page))}),`);
        lines.push(`    layouts: [${layoutImports}],`);
        lines.push(`    hasServerData: ${hasServerData},`);
        lines.push("  },");
    }
    lines.push("];\n");

    // serverRoutes
    lines.push("export const serverRoutes: Array<{");
    lines.push("  pattern: string;");
    lines.push("  pageModule: () => Promise<any>;");
    lines.push("  layoutModules: (() => Promise<any>)[];");
    lines.push("  pageServer: (() => Promise<any>) | null;");
    lines.push("  layoutServers: { loader: () => Promise<any>; depth: number }[];");
    lines.push("}> = [");
    for (const r of manifest.pages) {
        const layoutImports = r.layouts
            .map(l => `() => import(${JSON.stringify(toImportPath(l))})`)
            .join(", ");
        const layoutServerImports = r.layoutServers
            .map(ls => `{ loader: () => import(${JSON.stringify(toImportPath(ls.path))}), depth: ${ls.depth} }`)
            .join(", ");
        lines.push("  {");
        lines.push(`    pattern: ${JSON.stringify(r.pattern)},`);
        lines.push(`    pageModule: () => import(${JSON.stringify(toImportPath(r.page))}),`);
        lines.push(`    layoutModules: [${layoutImports}],`);
        lines.push(`    pageServer: ${r.pageServer ? `() => import(${JSON.stringify(toImportPath(r.pageServer))})` : "null"},`);
        lines.push(`    layoutServers: [${layoutServerImports}],`);
        lines.push("  },");
    }
    lines.push("];\n");

    // apiRoutes
    lines.push("export const apiRoutes: Array<{");
    lines.push("  pattern: string;");
    lines.push("  module: () => Promise<any>;");
    lines.push("}> = [");
    for (const r of manifest.apis) {
        lines.push("  {");
        lines.push(`    pattern: ${JSON.stringify(r.pattern)},`);
        lines.push(`    module: () => import(${JSON.stringify(toImportPath(r.server))}),`);
        lines.push("  },");
    }
    lines.push("];\n");

    // errorPage
    const ep = manifest.errorPage;
    lines.push(`export const errorPage: (() => Promise<any>) | null = ${
        ep ? `() => import(${JSON.stringify(toImportPath(ep))})` : "null"
    };\n`);

    mkdirSync(".bunia", { recursive: true });
    writeFileSync(".bunia/routes.ts", lines.join("\n"));
    console.log("✅ Routes generated: .bunia/routes.ts");
}

// Import path from .bunia/routes.ts to src/routes/<routePath>
function toImportPath(routePath: string): string {
    return "../src/routes/" + routePath.replace(/\\/g, "/");
}

// ─── Bun Build Plugin ─────────────────────────────────────
// Resolves:
//   bunia:routes  → .bunia/routes.ts  (generated route map)
//   $lib/*        → src/lib/*         (user library alias)

function makeBuniaPlugin() {
    return {
        name: "bunia-resolver",
        setup(build: import("bun").PluginBuilder) {
            // bunia:routes → .bunia/routes.ts
            build.onResolve({ filter: /^bunia:routes$/ }, () => ({
                path: join(process.cwd(), ".bunia", "routes.ts"),
            }));

            // $lib/* → src/lib/* with extension probing
            build.onResolve({ filter: /^\$lib\// }, async (args) => {
                const rel = args.path.slice(5); // remove "$lib/"
                const base = join(process.cwd(), "src", "lib", rel);
                return { path: await resolveWithExts(base) };
            });

            // "tailwindcss" inside app.css is a Tailwind CLI directive —
            // it's already compiled to public/bunia-tw.css by the CLI step.
            // Return an empty CSS module so Bun's CSS bundler doesn't choke on it.
            build.onResolve({ filter: /^tailwindcss$/ }, () => ({
                path: "tailwindcss",
                namespace: "bunia-empty-css",
            }));
            build.onLoad({ filter: /.*/, namespace: "bunia-empty-css" }, () => ({
                contents: "",
                loader: "css",
            }));
        },
    };
}

async function resolveWithExts(base: string): Promise<string> {
    if (await Bun.file(base).exists()) return base;
    for (const ext of [".ts", ".svelte", ".js"]) {
        if (await Bun.file(base + ext).exists()) return base + ext;
    }
    for (const idx of ["index.ts", "index.svelte", "index.js"]) {
        const p = join(base, idx);
        if (await Bun.file(p).exists()) return p;
    }
    return base;
}

// ─── Route Types Generator ────────────────────────────────
// Generates .bunia/types/src/routes/**/$types.d.ts for each
// route directory. Combined with rootDirs in tsconfig.json,
// this allows `import type { PageData } from './$types'` to
// work in +page.svelte files — identical to SvelteKit's API.

function routeDirOf(filePath: string): string {
    const parts = filePath.replace(/\\/g, "/").split("/");
    parts.pop();
    return parts.join("/") || ".";
}

function generateRouteTypes(manifest: RouteManifest): void {
    // Collect { dir → { pageServer?, layoutServer? } }
    const dirs = new Map<string, { pageServer?: string; layoutServer?: string }>();

    for (const route of manifest.pages) {
        const pageDir = routeDirOf(route.page);
        if (!dirs.has(pageDir)) dirs.set(pageDir, {});
        if (route.pageServer) {
            dirs.get(pageDir)!.pageServer = route.pageServer;
        }
        for (const ls of route.layoutServers) {
            const lsDir = routeDirOf(ls.path);
            if (!dirs.has(lsDir)) dirs.set(lsDir, {});
            dirs.get(lsDir)!.layoutServer = ls.path;
        }
    }

    for (const [dir, info] of dirs) {
        // Path segments of the route dir (empty array for root ".")
        const segments = dir === "." ? [] : dir.split("/").filter(Boolean);

        // Depth of the generated file from project root:
        // .bunia/ + types/ + src/ + routes/ + ...segments
        const depth = 4 + segments.length;
        const up = "../".repeat(depth);
        const srcBase = `${up}src/routes/${segments.length ? segments.join("/") + "/" : ""}`;

        const lines: string[] = ["// AUTO-GENERATED by bunia — do not edit\n"];

        if (info.pageServer) {
            lines.push(`import type { load as _pageLoad } from '${srcBase}+page.server.ts';`);
            lines.push(`export type PageData = Awaited<ReturnType<typeof _pageLoad>> & { params: Record<string, string> };`);
        } else {
            lines.push(`export type PageData = { params: Record<string, string> };`);
        }
        lines.push(`export type PageProps = { data: PageData };`);

        if (info.layoutServer) {
            lines.push(`\nimport type { load as _layoutLoad } from '${srcBase}+layout.server.ts';`);
            lines.push(`export type LayoutData = Awaited<ReturnType<typeof _layoutLoad>> & { params: Record<string, string> };`);
            lines.push(`export type LayoutProps = { data: LayoutData; children: any };`);
        }

        const outDir = join(process.cwd(), ".bunia", "types", "src", "routes", ...segments);
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, "$types.d.ts"), lines.join("\n") + "\n");
    }

    console.log(`✅ Route types generated: .bunia/types/ (${dirs.size} route director${dirs.size === 1 ? "y" : "ies"})`);
}

// ─── Ensure tsconfig rootDirs ─────────────────────────────
// Adds ".bunia/types" to rootDirs so TypeScript resolves
// `./$types` imports via the generated declaration files.
// Only patches the file if rootDirs is not already set.

function ensureRootDirs(): void {
    const tsconfigPath = join(process.cwd(), "tsconfig.json");
    if (!existsSync(tsconfigPath)) return;

    let tsconfig: any;
    try {
        tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
    } catch {
        console.warn("⚠️  Could not parse tsconfig.json — add rootDirs manually:\n" +
            '   "rootDirs": [".", ".bunia/types"]');
        return;
    }

    const rootDirs: string[] = tsconfig.compilerOptions?.rootDirs ?? [];
    if (rootDirs.includes(".bunia/types")) return;

    tsconfig.compilerOptions ??= {};
    tsconfig.compilerOptions.rootDirs = [".", ".bunia/types",
        ...rootDirs.filter((d: string) => d !== ".")];

    writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");
    console.log("✅ tsconfig.json: added .bunia/types to rootDirs");
}

// ─── Prerendering ─────────────────────────────────────────

async function detectPrerenderRoutes(manifest: RouteManifest): Promise<string[]> {
    const paths: string[] = [];
    for (const route of manifest.pages) {
        if (!route.pageServer) continue;
        if (route.pattern.includes("[")) {
            // TODO: Support dynamic routes by reading export const entries() and calling it to get param values
            // Then prerender each route variant: /blog/slug1, /blog/slug2, etc.
            continue;
        }
        const content = await Bun.file(join("src", "routes", route.pageServer)).text();
        if (/export\s+const\s+prerender\s*=\s*true/.test(content)) {
            paths.push(route.pattern);
        }
    }
    return paths;
}

async function prerenderStaticRoutes(manifest: RouteManifest): Promise<void> {
    const paths = await detectPrerenderRoutes(manifest);
    if (paths.length === 0) return;

    console.log(`\n🖨️  Prerendering ${paths.length} route(s)...`);

    const port = 13572;
    const child = Bun.spawn(
        ["bun", "run", "./dist/server/index.js"],
        {
            env: { ...process.env, NODE_ENV: "production", PORT: String(port) },
            stdout: "ignore",
            stderr: "ignore",
        },
    );

    // Poll /_health until ready (max 10s)
    const base = `http://localhost:${port}`;
    let ready = false;
    for (let i = 0; i < 50; i++) {
        await Bun.sleep(200);
        try {
            const res = await fetch(`${base}/_health`);
            if (res.ok) { ready = true; break; }
        } catch { /* not ready yet */ }
    }

    if (!ready) {
        child.kill();
        console.error("❌ Prerender server failed to start");
        return;
    }

    mkdirSync("./dist/prerendered", { recursive: true });

    for (const routePath of paths) {
        try {
            const res = await fetch(`${base}${routePath}`);
            const html = await res.text();
            const outPath = routePath === "/"
                ? "./dist/prerendered/index.html"
                : `./dist/prerendered${routePath}/index.html`;
            mkdirSync(outPath.substring(0, outPath.lastIndexOf("/")), { recursive: true });
            writeFileSync(outPath, html);
            console.log(`   ✅ ${routePath} → ${outPath}`);
        } catch (err) {
            console.error(`   ❌ Failed to prerender ${routePath}:`, err);
        }
    }

    child.kill();
    console.log("✅ Prerendering complete");
}
