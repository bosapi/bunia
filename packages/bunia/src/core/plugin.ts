import { join } from "path";

// ─── Bun Build Plugin ─────────────────────────────────────
// Resolves:
//   bunia:routes  → .bunia/routes.ts  (generated route map)
//   bunia:env     → .bunia/env.server.ts (bun) or .bunia/env.client.ts (browser)
//   $lib/*        → src/lib/*         (user library alias)

export function makeBuniaPlugin(target: "browser" | "bun" = "bun") {
    return {
        name: "bunia-resolver",
        setup(build: import("bun").PluginBuilder) {
            // bunia:routes → .bunia/routes.ts
            build.onResolve({ filter: /^bunia:routes$/ }, () => ({
                path: join(process.cwd(), ".bunia", "routes.ts"),
            }));

            // bunia:env → .bunia/env.client.ts (browser) or .bunia/env.server.ts (bun)
            build.onResolve({ filter: /^bunia:env$/ }, () => ({
                path: join(
                    process.cwd(),
                    ".bunia",
                    target === "browser" ? "env.client.ts" : "env.server.ts",
                ),
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
